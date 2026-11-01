import * as path from 'node:path'
import { lookup } from 'mime-types'
import { cwd as processCwd } from 'node:process'

import { hasMagic } from 'glob'
import { lstatSync } from 'node:fs';
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { forward_slash, resolve, isFile, pathInfoEx } from '@polymech/commons'
import { isArray, isString } from '@polymech/core/primitives'
import { ChatCompletionToolRunnerParams } from 'openai/lib/ChatCompletionRunner'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

import { IKBotTask } from '../ai-tools/index.js'
import { createClient } from '../client.js'
import { OptionsSchema } from '../zod_schema.js'
import { get } from '../source.js'
import { isWebUrl } from '../glob.js'
import { flatten } from '../utils/array.js'
import { collector } from '../collector.js'
import { load as loadProfile } from '../profile.js'
import { load as loadTools } from '../tools.js'
import { preferences, prompt } from '../prompt.js'
import { variables } from '../variables.js'
import { E_Mode } from '../zod_schema.js'

import { runCompletion } from './run-completion.js'
import { runTools } from './run-tools.js'
import { runAssistant } from './run-assistant.js'
import { runResponses } from './run-responses.js'
import { all } from '../models/index.js'
import { getLogger } from '../index.js'



export const default_sort = (files: string[]): string[] => {
  const getSortableParts = (filename: string) => {
      const baseName = path.parse(filename).name;
      const match = baseName.match(/^(\d+)_?(.*)$/); // Match leading numbers
      const numPart = match ? parseInt(match[1], 10) : NaN;
      const textPart = match ? match[2] : baseName; // Extract text part

      return { numPart, textPart };
  }
  return files.sort((a, b) => {
      const { numPart: aNum, textPart: aText } = getSortableParts(a)
      const { numPart: bNum, textPart: bText } = getSortableParts(b)
      if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum || aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
      }
      return aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' })
  })
}

type ProcessRunResult = string | boolean | Record<string, unknown> | null;

/**
 * Complete options by setting up defaults, validating inputs, and initializing required components
 * 
 * @param opts - The initial task options
 * @returns - The fully configured options object or null if validation fails
 */
export const complete_options = async (opts: IKBotTask): Promise<IKBotTask | null> => {
  opts.logger = getLogger(opts)

  const target = path.resolve(opts.output || opts.path || '.')
  if (!exists(target)) {
    dir(target)
  }

  opts.disable = flatten(opts.disable)
  opts.disableTools = flatten(opts.disableTools)
  opts.include = flatten(opts.include)
  opts.exclude = flatten(opts.exclude || [])
  opts.variables = opts.profile ? await loadProfile(opts) : {}

  try {
    const parsed = OptionsSchema().parse(opts);
    const options = parsed as IKBotTask;

    const client = createClient(options)
    if (!client) {
      opts.logger.error('Failed to create client')
      return null
    }

    options.client = client
    options.variables = { ...options.variables, ...variables(options) }
    options.collector = collector(options, client)
    options.format = opts.format
    options.onRun = options.onRun || (async (options) => options)

    return options
  } catch (error) {
    opts.logger.error(
      { err: error?.message, issues: error?.issues, stack: error?.stack },
      'Failed to parse options',
    )
    return null
  }
}

/**
 * Gather all messages from various sources for the task
 * 
 * @param opts - The task options
 * @param options - The completed options
 * @returns - Array of messages and source files
 */
export const complete_messages = async (
  opts: IKBotTask,
  options: IKBotTask
): Promise<{
  messages: Array<ChatCompletionMessageParam>,
  files: any[]
}> => {
  let chatMessages: Array<ChatCompletionMessageParam> = []

  const promptMessage = await prompt(opts)
  if (promptMessage?.content) {
    chatMessages.push(promptMessage as ChatCompletionMessageParam)
  }
  chatMessages.push((await preferences(opts)) as ChatCompletionMessageParam)

  const projectPath = path.resolve(options.path || '.')
  let sourceFiles = await get(projectPath, options.include, options) || []

  const processedFileMessages: ChatCompletionMessageParam[] = sourceFiles.map(f => {
    if (f.path && f.content && typeof f.content === 'string') {
      const mimeType = lookup(f.path)
      // Check if the mime type is not binary (heuristic: starts with 'text/' or is a common non-binary type)
      if (mimeType && (mimeType.startsWith('text/') || ['application/json', 'application/xml', 'application/javascript', 'application/typescript'].includes(mimeType))) {
        if (options.wrap === 'meta') {
          const absolutePath = path.resolve(options.path || '.', f.path)
          const relativePath = f.path // f.path is already relative from the get() function
          const currentWorkingDirectory = processCwd()
          const metaHeader = `IMPORTANT: The following information is file metadata. Please remove this entire block (from METADATA_START to METADATA_END) before processing the file content.
METADATA_START
File: ${relativePath}
Absolute Path: ${absolutePath}
CWD: ${currentWorkingDirectory}
METADATA_END

Original Content:
`
          return { ...f, content: metaHeader + f.content, role: 'user' }
        } else {
          return { ...f, role: 'user' }
        }
      }
    }
    return { ...f, role: 'user' }
  })

  chatMessages = [...chatMessages, ...processedFileMessages]
  return { messages: chatMessages, files: sourceFiles }
}

/**
 * Create and configure the parameters for the request
 * 
 * @param options - The completed options
 * @param messages - The gathered messages
 * @returns - The configured parameters for the API request
 */
export const complete_params = async (
  options: IKBotTask,
  messages: Array<ChatCompletionMessageParam>
): Promise<ChatCompletionToolRunnerParams<any>> => {
  const params = {
    model: options.model,
    messages,
    tools: []
  } as ChatCompletionToolRunnerParams<any>

  if (options.mode === E_Mode.TOOLS || options.mode === E_Mode.ASSISTANT) {
    if (options.customTools && options.customTools.length > 0) {
      // Use caller-supplied tool definitions directly, skipping built-in loader
      params.tools = options.customTools
    } else {
      params.tools = await loadTools(options)
    }
    params.tool_choice = 'auto'
  }

  return params
}

/**
 * Execute the request based on the mode and return the result
 * 
 * @param options - The completed options
 * @param client - The API client
 * @param params - The request parameters
 * @returns - The result of the execution
 */
export const execute_request = async (
  options: IKBotTask,
  client: any,
  params: ChatCompletionToolRunnerParams<any>
): Promise<ProcessRunResult> => {
  let ret: any = null
  
  try {
    switch (options.mode) {
      case E_Mode.COMPLETION:
        ret = await runCompletion(client, params, options)
        break

      case E_Mode.TOOLS:
        ret = await runTools(client, params, options)
        break

      case E_Mode.ASSISTANT:
        ret = await runAssistant(client, params, options)
        break

      case E_Mode.RESPONSES:
        ret = await runResponses(client, params, options)
        break

      default:
        throw new Error(`Unsupported mode: ${options.mode}`)
    }
  } catch (e) {
    options.logger?.error(`Error running ${options.mode} mode: ${e.message}`)
  }

  return ret
}

/**
 * Process a task with the configured options and return the result
 * 
 * @param opts - The task options
 * @returns - The result of the task execution
 */
export const processRun = async (opts: IKBotTask): Promise<ProcessRunResult> => {
  const intialIncludes = [...opts.include]
  let options = await complete_options(opts)
  if (!options) {
    return null
  }

  const client = options.client

  const { messages, files } = await complete_messages(opts, options)
  if(intialIncludes.length > 0 && files.length === 0) {
    return ""
  }
  if (messages.length === 0) {
    return ""
  }
  const params = await complete_params(options, messages)

  if (!opts.silent) {
    const logDir = path.resolve(resolve(opts.logs || './logs'))
    const paramsPath = path.join(logDir, 'params.json')
    write(paramsPath, JSON.stringify({ ...params }, null, 2))
  }
  if (opts.mode === E_Mode.TOOLS) {
    options.logger.debug(
      {
        mode: options.mode, model: options.model, router: options.router,
        project: path.resolve(options.path || '.'), include: options.include,
        files: files.map(f => f.path),
        tools: params.tools.map((t: any) => `${t.function.name}: ${t.function.description}`),
      },
      `kbot run ${options.mode} : ${options.model} @ ${options.router} : ${files.length} files`,
    )
  } else {
    options.logger.debug(
      {
        mode: options.mode, model: options.model, router: options.router,
        project: path.resolve(options.path || '.'), include: options.include,
        files: files.map(f => f.path),
      },
      `kbot run ${options.mode} : ${options.model} @ ${options.router} : ${files.length} files`,
    )
  }
  options = await options.onRun(options) || options
  const ret = await execute_request(options, client, params)
  return ret
}

/**
 * Extract file paths (Windows or POSIX style) from a single string,
 * preserving any spaces within the paths. Needed for Salamand File Manager selections (eg: kbot "summarize, as json" -i "$(ListOfSelectedFullNames)")
 * - For Windows, it looks for patterns like "C:\" (any drive letter).
 * - For POSIX, it looks for a leading slash "/".
 * - For web URLs, it looks for patterns like "http://" or "https://".
 *
 * Returns an array of path strings. If no matches are found, returns [].
 * 
 */
function extractPaths(input: string): string[] {
  // If it's a web URL, return it
  if (isWebUrl(input)) {
    return [input]
  }

  // If it's a direct path that exists, return it
  if (exists(path.resolve(resolve(input)))) {
    return [input]
  }

  // If it's a glob pattern, return it as is
  if (hasMagic(input)) {
    return [input]
  }

  // Matches either a Windows drive pattern like "C:\", a forward slash "/", or http/https URLs
  const pathStartRegex = /([A-Za-z]:\\)|\/|(https?:\/\/)/g;

  const matchIndices: number[] = [];
  let match: RegExpExecArray | null;

  // Collect the start index of each path
  while ((match = pathStartRegex.exec(input)) !== null) {
    matchIndices.push(match.index);
  }

  // If none found, return empty
  if (!matchIndices.length) {
    return [];
  }

  // Slice from each index to just before the next
  const paths: string[] = [];
  for (let i = 0; i < matchIndices.length; i++) {
    const start = matchIndices[i];
    const end = i < matchIndices.length - 1 ? matchIndices[i + 1] : input.length;
    const path = input.substring(start, end).trim();
    if (path) {
      paths.push(path);
    }
  }

  return paths;
}

function flattenArrays<T>(arrays: T[][]): T[] {
  return arrays.reduce((accumulator, current) => {
    return accumulator.concat(current);
  }, [] as T[]);
}

export const run = async (opts: IKBotTask): Promise<ProcessRunResult[]> => {
  const ret: ProcessRunResult[] = []
  opts.logger = opts.logger ?? (await import('../logger.js')).kbotLogger

  if (opts.include) {
    if (isString(opts.include)) {
      opts.include = [opts.include]
    }
    if (isArray(opts.include)) {
      // First check for glob patterns and web URLs
      const specialPatterns = opts.include.filter((path: string) => hasMagic(path) || isWebUrl(path))
      // Then process normal paths
      const normalPaths = opts.include.filter((path: string) => !hasMagic(path) && !isWebUrl(path))
      const processedPaths = flattenArrays(normalPaths.map(extractPaths))
      // Combine special patterns and processed paths
      opts.include = [...specialPatterns, ...processedPaths]
    }
  } else {
    opts.include = []
  }

  // Process opts.exclude similarly to opts.include
  if (opts.exclude) {
    if (isString(opts.exclude)) {
      opts.exclude = [opts.exclude]
    }
    if (isArray(opts.exclude)) {
      const specialPatterns = opts.exclude.filter((path: string) => hasMagic(path) || isWebUrl(path));
      const normalPaths = opts.exclude.filter((path: string) => !hasMagic(path) && !isWebUrl(path));
      const processedPaths = flattenArrays(normalPaths.map(extractPaths));
      opts.exclude = [...specialPatterns, ...processedPaths];
    }
  } else {
    opts.exclude = []
  }

  if (opts.each) {
    let items: string[] = []
    if (isArray(opts.each)) {
      items = opts.each
    } else if (exists(opts.each) && isFile(opts.each) && path.parse(opts.each).ext === '.json') {
      items = read(opts.each, 'json') as [] || []
    } else if (hasMagic(opts.each)) {
      const info = pathInfoEx(forward_slash(path.resolve(resolve(opts.each))),false,{
        absolute: true,
      })
      items = default_sort(info.FILES)
    } else if (isFile(opts.each) && exists(opts.each)) {
      items = [opts.each]
    } else if (isString(opts.each)) {
      items = opts.each.split(',')
    }
    if (items.length === 0) {
      opts.logger.warn(`No files matching pattern ${opts.each} found in ${opts.path}`)
      return ret
    }
    opts.logger.info(`Processing ${items.length} items matching pattern ${opts.each}...`)
    const _models = all()
    for (const item of items) {
      try {
        const stats = lstatSync(item);
        if (!stats.isFile()) {
          opts.logger.warn(`Item from --each is not a file, skipping: ${item}`);
          continue;
        }
      } catch (e) {
        opts.logger.warn(`Item from --each is not a valid path, skipping: ${item}`);
        continue;
      }
      const itemOpts = {
        ...opts,
        ITEM: item,
        variables: { ITEM: item }
      }
      const model = _models.find(m => m.id === item)
      if (model) {
        itemOpts.model = item
      }

      let currentItemSpecificIncludes = [forward_slash(item)];

      const initialIncludes = [...opts.include]; // Store original includes
      itemOpts.include = [...initialIncludes, ...currentItemSpecificIncludes];
      
      const result = await processRun(itemOpts)
      if (result !== undefined) {
        ret.push(result)
      }
    }
  } else {
    const result = await processRun(opts)
    if (result !== undefined) {
      ret.push(result)
    }
  }
  return ret
}
