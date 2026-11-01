import { z } from 'zod'
import * as path from 'node:path'
import chalk from 'chalk'
import env from 'env-var'
import { generate_interfaces, ZodMetaMap, resolve, write } from '@polymech/commons'
import { sync as exists } from '@polymech/fs/exists'
import { sync as writeFS } from '@polymech/fs/write'
import { sync as readFS } from '@polymech/fs/read'
import { isArray, isFunction, isString } from '@polymech/core/primitives'
import { zodResponseFormat } from "openai/helpers/zod"

import { API_PREFIX, LOGGING_DIRECTORY, PREFERENCES_FILE_NAME } from './constants.js'

export const get_var = (key: string = '') => env.get(key).asString() || env.get(key.replace(/-/g, '_')).asString() || env.get(key.replace(/_/g, '-')).asString()
export const HOME = (sub = '') => path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || '', sub)
export const PREFERENCES_DEFAULT = (key: string = 'KBOT_PREFERENCES') => get_var(key) || path.join(HOME(`.${API_PREFIX}`), PREFERENCES_FILE_NAME)
import { jsonSchemaToZod } from "json-schema-to-zod"
import { Filters } from './filters.js'
import { models_dist } from './models/index.js'
import { defaultTemplate } from './tools.js'

export const E_Filters = z.enum(Object.keys(Filters) as any)

export const E_RouterTypeSchema = z.enum(['openrouter', 'openai', 'deepseek', 'huggingface', 'ollama', 'fireworks', 'gemini', 'xai'])
export type E_RouterType = z.infer<typeof E_RouterTypeSchema>

export const E_Mode = {
  COMPLETION: 'completion',
  TOOLS: 'tools',
  ASSISTANT: 'assistant',
  RESPONSES: 'responses',
  CUSTOM: 'custom'
} as const

export const EType = z.enum([
  E_Mode.COMPLETION,
  E_Mode.TOOLS,
  E_Mode.ASSISTANT,
  E_Mode.RESPONSES,
  E_Mode.CUSTOM
])

// Define the new enum for append modes
export const E_AppendMode = z.enum(['concat', 'merge', 'replace'])
export type E_AppendModeType = z.infer<typeof E_AppendMode>


// Define the new enum for wrap modes
export const E_WrapMode = z.enum(['meta', 'none'])
export type E_WrapModeType = z.infer<typeof E_WrapMode>

// Define the new enum for glob extensions (presets)
export const E_GlobExtension = z.enum(['match-cpp']) // Add more presets here later if needed
export type E_GlobExtensionType = z.infer<typeof E_GlobExtension>

export type OptionsSchemaMeta = Record<string, unknown>

export { fetchOpenRouterModels, listModelsAsStrings as listOpenRouterModelsAsStrings } from './models/openrouter.js'
export { fetchOpenAIModels, listModelsAsStrings as listOpenAIModelsAsStrings } from './models/openai.js'

let schemaMap

export const OptionsSchema = (opts?: any): any => {

  schemaMap = ZodMetaMap.create<OptionsSchemaMeta>()
  schemaMap.add(
    'path',
    z.string()
      .min(1)
      .default('.')
      .describe('Target directory')
    , { 'ui:widget': 'file' })
    .add(
      'prompt',
      z.string()
        .describe('The prompt. Supports file paths and environment variables.')
        .optional()
    )
    .add(
      'output',
      z.string()
        .optional()
        .describe('Optional output path for modified files (Tool mode only)')
    )
    .add(
      'dst',
      z.string()
        .optional()
        .describe('Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for "completion" mode')
    )
    .add(
      'append',
      E_AppendMode
        .optional()
        .describe('How to handle output if --dst file already exists: "concat" (append) or "merge" (try to merge structures if possible, otherwise append). Only used if --dst is specified.')
    )
    .add(
      'wrap',
      E_WrapMode
        .default('none')
        .describe('Specify how to wrap the output, "meta (file name, absolute path, cwd)" or "none".')
    )
    .add(
      'each',
      z.string()
        .optional()
        .describe('Iterate over items, supported: GLOB | Path to JSON File | array of strings (comma separated). To test different models, use --each="gpt-3.5-turbo,gpt-4o", the actual string will exposed as variable `ITEM`, eg: --dst="${ITEM}-output.md"')
    )
    .add(
      'disable',
      z.array(z.string())
        .default([])
        .describe(`Disable tools categories, eg: --disable=${defaultTemplate.tools.join(',')}`)
    )
    .add(
      'disableTools',
      z.array(z.string())
        .optional()
        .default([])
        .describe('List of specific tools to disable')
    )
    .add(
      'tools',
      z.union(
        [
          z.array(z.string()),
          z.string()
        ]).optional()
        .default(defaultTemplate.tools)
        .describe(`List of tools to use. Can be built-in tool names or paths to custom tool files. Default: ${defaultTemplate.tools.join(',')}`)
        .transform((val) => Array.isArray(val) ? val : val.split(','))
    )
    .add(
      'include',
      z.array(z.string())
        .optional()
        .describe('Comma separated glob patterns or paths, eg --include=src/*.tsx,src/*.ts --include=package.json')
    )
    .add(
      'exclude',
      z.array(z.string())
        .optional()
        .describe('Comma separated glob patterns or paths, eg --exclude=src/*.tsx,src/*.ts --exclude=package.json')
    )
    .add(
      'globExtension',
      z.union([E_GlobExtension, z.string()]) // Allow preset enum or custom string
        .optional()
        .describe(
          'Specify a glob extension behavior. Available presets: ' + E_GlobExtension.options.join(', ') + 
          '. Also accepts a custom glob pattern with variables like ${SRC_DIR}, ${SRC_NAME}, ${SRC_EXT}. ' + 
          'E.g., \"match-cpp\" or \"${SRC_DIR}/${SRC_NAME}*.cpp\"'
        )
    )
    .add(
      'api_key',
      z.string()
        .optional()
        .describe('Explicit API key to use')
    )
    .add(
      'model',
      z.string()
        .optional()
        .describe(`AI model to use for processing. Available models:\n${models_dist().join('\n')}`)
    )
    .add(
      'router',
      z.string()
        .default('openrouter')
        .describe('Router to use: openai, openrouter or deepseek')
    )
    .add(
      'mode',
      EType
        .default(E_Mode.TOOLS)
        .describe(`Chat completion mode:\n\t completion, tools, assistant.
          ${chalk.green.bold('completion')}: no support for tools, please use --dst parameter to save the output.
          ${chalk.green.bold('tools')}: allows for tools to be used, eg 'save to ./output.md'. Not all models support this mode.
          ${chalk.green.bold('responses')}: allows for responses to be used, eg 'save to ./output.md'. Not all models support this mode.
          ${chalk.green.bold('assistant')}: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :
          ${chalk.green.bold('custom')}: custom mode
      `)
    )
    .add(
      'logLevel',
      z.number()
        .default(4)
        .describe('Logging level for the application')
    )
    .add(
      'profile',
      z.string()
        .optional()
        .describe('Path to profile for variables. Supports environment variables.')
    )
    .add(
      'baseURL',
      z.string()
        .optional()
        .describe('Base URL for the API, set via --router or directly')
    )
    .add(
      'config',
      z.string()
        .optional()
        .describe('Path to JSON configuration file (API keys). Supports environment variables.')
    )
    .add(
      'dump',
      z.string()
        .optional()
        .describe('Create a script')
    )
    .add(
      'preferences',
      z.string()
        .default(PREFERENCES_DEFAULT())
        .describe('Path to preferences file, eg: location, your email address, gender, etc. Supports environment variables.')
    )
    .add(
      'logs',
      z.string()
        .default(LOGGING_DIRECTORY)
        .describe('Logging directory')
    ).add(
      'stream',
      z.boolean()
        .default(false)
        .describe('Enable streaming (verbose LLM output)')
    )
    .add(
      'alt',
      z.boolean()
        .default(false)
        .describe('Use alternate tokenizer & instead of $')
    )
    .add(
      'env',
      z.string()
        .default('default')
        .describe('Environment (in profile)')
    )
    .add(
      'variables',
      z.record(z.string(), z.string())
        .optional()
        .default({})
    )
    .add(
      'filters',
      z.union([
        z.string(),
        z.array(E_Filters),
        z.array(z.string()),
        z.array(z.function())
      ])
        .optional()
        .default('')
        .describe(`List of filters to apply to the output.
         Used only in completion mode and a given output file specified with --dst. 
         It unwraps by default any code or data in Markdown. 
         Choices:\n\t${Object.keys(Filters)}\n`)
        .transform((val) => {
          if (isArray(val) && val.length && isFunction(val[0])) {
            return val
          }
          let filters = isString(val) ? val.split(',') : val
          filters = filters.map((f: any) => Filters[f]).filter(Boolean)
          return filters
        })
    )
    .add(
      'query',
      z.string()
        .nullable()
        .optional()
        .default(null)
        .describe('JSONPath query to be used to transform input objects')
    )
    .add(
      'dry',
      z.union([
        z.boolean(),
        z.string().transform((val) => val.toLowerCase() === 'true')
      ])
        .optional()
        .default(false)
        .describe('Dry run - only write out parameters without making API calls')
    )
    .add(
      'customTools',
      z.array(z.any())
        .optional()
        .describe('Pre-built tool definitions (OpenAI RunnableToolFunctionWithParse[]) injected directly. When set, skips built-in tool loading.')
    )
    .add(
      'format',
      z.union([
        z.string().transform((val) => {
          try {
            // Check if the string is a file path
            if (exists(val) && val.endsWith('.json')) {
              const content = readFS(val);
              const schema = JSON.parse(content.toString());
              const zodSchemaStr = jsonSchemaToZod(schema);
              // Evaluate the string to get the actual Zod schema
              const zodSchema = eval(`(${zodSchemaStr})`);
              return zodResponseFormat(zodSchema, "format");
            } else {
              // Try parsing as JSON schema first
              try {
                const schema = JSON.parse(val);
                const zodSchemaStr = jsonSchemaToZod(schema);
                const zodSchema = eval(`(${zodSchemaStr})`);
                return zodResponseFormat(zodSchema, "format");
              } catch {
                // If not JSON, try evaluating as Zod schema directly
                const zodSchema = eval(`(${val})`);
                return zodResponseFormat(zodSchema, "format");
              }
            }
          } catch (e) {
            console.error(`Error parsing format: ${e}`)
            return null;
          }
        }),
        z.any().transform((val) => {
          // If it's already a Zod schema, use it directly
          if (val && typeof val === 'object' && 'parse' in val) {
            return zodResponseFormat(val, "format");
          }
          return null;
        })
      ])
        .optional()
        .describe('Format for structured outputs. Can be a Zod schema, a Zod schema string, a JSON schema string, or a path to a JSON file.')
    );
  return schemaMap.root()
    .passthrough()
    .describe('IKBotOptions')
}
export const types = () => {
  generate_interfaces([OptionsSchema()], 'src/zod_types.ts')
  generate_interfaces([OptionsSchema()], path.resolve(resolve('../ai-tools/src/types_kbot.ts')))
  schemas()
}
export const schemas = () => {
  write([OptionsSchema()], 'schema.json', 'kbot', {})
  writeFS('schema_ui.json', schemaMap.getUISchema())
}