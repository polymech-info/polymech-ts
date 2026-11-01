import * as path from 'node:path';
import { lookup } from 'mime-types';
import { cwd as processCwd } from 'node:process';
import { hasMagic } from 'glob';
import { lstatSync } from 'node:fs';
import { sync as dir } from '@polymech/fs/dir';
import { sync as exists } from '@polymech/fs/exists';
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/read';
import { forward_slash, resolve, isFile, pathInfoEx } from '@polymech/commons';
import { isArray, isString } from '@polymech/core/primitives';
import { createClient } from '../client.js';
import { OptionsSchema } from '../zod_schema.js';
import { get } from '../source.js';
import { isWebUrl } from '../glob.js';
import { flatten } from '../utils/array.js';
import { collector } from '../collector.js';
import { load as loadProfile } from '../profile.js';
import { load as loadTools } from '../tools.js';
import { preferences, prompt } from '../prompt.js';
import { variables } from '../variables.js';
import { E_Mode } from '../zod_schema.js';
import { runCompletion } from './run-completion.js';
import { runTools } from './run-tools.js';
import { runAssistant } from './run-assistant.js';
import { runResponses } from './run-responses.js';
import { all } from '../models/index.js';
import { getLogger } from '../index.js';
export const default_sort = (files) => {
    const getSortableParts = (filename) => {
        const baseName = path.parse(filename).name;
        const match = baseName.match(/^(\d+)_?(.*)$/); // Match leading numbers
        const numPart = match ? parseInt(match[1], 10) : NaN;
        const textPart = match ? match[2] : baseName; // Extract text part
        return { numPart, textPart };
    };
    return files.sort((a, b) => {
        const { numPart: aNum, textPart: aText } = getSortableParts(a);
        const { numPart: bNum, textPart: bText } = getSortableParts(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum || aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' });
        }
        return aText.localeCompare(bText, undefined, { numeric: true, sensitivity: 'base' });
    });
};
/**
 * Complete options by setting up defaults, validating inputs, and initializing required components
 *
 * @param opts - The initial task options
 * @returns - The fully configured options object or null if validation fails
 */
export const complete_options = async (opts) => {
    opts.logger = getLogger(opts);
    const target = path.resolve(opts.output || opts.path || '.');
    if (!exists(target)) {
        dir(target);
    }
    opts.disable = flatten(opts.disable);
    opts.disableTools = flatten(opts.disableTools);
    opts.include = flatten(opts.include);
    opts.exclude = flatten(opts.exclude || []);
    opts.variables = opts.profile ? await loadProfile(opts) : {};
    try {
        const parsed = OptionsSchema().parse(opts);
        const options = parsed;
        const client = createClient(options);
        if (!client) {
            opts.logger.error('Failed to create client');
            return null;
        }
        options.client = client;
        options.variables = { ...options.variables, ...variables(options) };
        options.collector = collector(options, client);
        options.format = opts.format;
        options.onRun = options.onRun || (async (options) => options);
        return options;
    }
    catch (error) {
        opts.logger.error({ err: error?.message, issues: error?.issues, stack: error?.stack }, 'Failed to parse options');
        return null;
    }
};
/**
 * Gather all messages from various sources for the task
 *
 * @param opts - The task options
 * @param options - The completed options
 * @returns - Array of messages and source files
 */
export const complete_messages = async (opts, options) => {
    let chatMessages = [];
    const promptMessage = await prompt(opts);
    if (promptMessage?.content) {
        chatMessages.push(promptMessage);
    }
    chatMessages.push((await preferences(opts)));
    const projectPath = path.resolve(options.path || '.');
    let sourceFiles = await get(projectPath, options.include, options) || [];
    const processedFileMessages = sourceFiles.map(f => {
        if (f.path && f.content && typeof f.content === 'string') {
            const mimeType = lookup(f.path);
            // Check if the mime type is not binary (heuristic: starts with 'text/' or is a common non-binary type)
            if (mimeType && (mimeType.startsWith('text/') || ['application/json', 'application/xml', 'application/javascript', 'application/typescript'].includes(mimeType))) {
                if (options.wrap === 'meta') {
                    const absolutePath = path.resolve(options.path || '.', f.path);
                    const relativePath = f.path; // f.path is already relative from the get() function
                    const currentWorkingDirectory = processCwd();
                    const metaHeader = `IMPORTANT: The following information is file metadata. Please remove this entire block (from METADATA_START to METADATA_END) before processing the file content.
METADATA_START
File: ${relativePath}
Absolute Path: ${absolutePath}
CWD: ${currentWorkingDirectory}
METADATA_END

Original Content:
`;
                    return { ...f, content: metaHeader + f.content, role: 'user' };
                }
                else {
                    return { ...f, role: 'user' };
                }
            }
        }
        return { ...f, role: 'user' };
    });
    chatMessages = [...chatMessages, ...processedFileMessages];
    return { messages: chatMessages, files: sourceFiles };
};
/**
 * Create and configure the parameters for the request
 *
 * @param options - The completed options
 * @param messages - The gathered messages
 * @returns - The configured parameters for the API request
 */
export const complete_params = async (options, messages) => {
    const params = {
        model: options.model,
        messages,
        tools: []
    };
    if (options.mode === E_Mode.TOOLS || options.mode === E_Mode.ASSISTANT) {
        if (options.customTools && options.customTools.length > 0) {
            // Use caller-supplied tool definitions directly, skipping built-in loader
            params.tools = options.customTools;
        }
        else {
            params.tools = await loadTools(options);
        }
        params.tool_choice = 'auto';
    }
    return params;
};
/**
 * Execute the request based on the mode and return the result
 *
 * @param options - The completed options
 * @param client - The API client
 * @param params - The request parameters
 * @returns - The result of the execution
 */
export const execute_request = async (options, client, params) => {
    let ret = null;
    try {
        switch (options.mode) {
            case E_Mode.COMPLETION:
                ret = await runCompletion(client, params, options);
                break;
            case E_Mode.TOOLS:
                ret = await runTools(client, params, options);
                break;
            case E_Mode.ASSISTANT:
                ret = await runAssistant(client, params, options);
                break;
            case E_Mode.RESPONSES:
                ret = await runResponses(client, params, options);
                break;
            default:
                throw new Error(`Unsupported mode: ${options.mode}`);
        }
    }
    catch (e) {
        options.logger?.error(`Error running ${options.mode} mode: ${e.message}`);
    }
    return ret;
};
/**
 * Process a task with the configured options and return the result
 *
 * @param opts - The task options
 * @returns - The result of the task execution
 */
export const processRun = async (opts) => {
    const intialIncludes = [...opts.include];
    let options = await complete_options(opts);
    if (!options) {
        return null;
    }
    const client = options.client;
    const { messages, files } = await complete_messages(opts, options);
    if (intialIncludes.length > 0 && files.length === 0) {
        return "";
    }
    if (messages.length === 0) {
        return "";
    }
    const params = await complete_params(options, messages);
    if (!opts.silent) {
        const logDir = path.resolve(resolve(opts.logs || './logs'));
        const paramsPath = path.join(logDir, 'params.json');
        write(paramsPath, JSON.stringify({ ...params }, null, 2));
    }
    if (opts.mode === E_Mode.TOOLS) {
        options.logger.debug({
            mode: options.mode, model: options.model, router: options.router,
            project: path.resolve(options.path || '.'), include: options.include,
            files: files.map(f => f.path),
            tools: params.tools.map((t) => `${t.function.name}: ${t.function.description}`),
        }, `kbot run ${options.mode} : ${options.model} @ ${options.router} : ${files.length} files`);
    }
    else {
        options.logger.debug({
            mode: options.mode, model: options.model, router: options.router,
            project: path.resolve(options.path || '.'), include: options.include,
            files: files.map(f => f.path),
        }, `kbot run ${options.mode} : ${options.model} @ ${options.router} : ${files.length} files`);
    }
    options = await options.onRun(options) || options;
    const ret = await execute_request(options, client, params);
    return ret;
};
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
function extractPaths(input) {
    // If it's a web URL, return it
    if (isWebUrl(input)) {
        return [input];
    }
    // If it's a direct path that exists, return it
    if (exists(path.resolve(resolve(input)))) {
        return [input];
    }
    // If it's a glob pattern, return it as is
    if (hasMagic(input)) {
        return [input];
    }
    // Matches either a Windows drive pattern like "C:\", a forward slash "/", or http/https URLs
    const pathStartRegex = /([A-Za-z]:\\)|\/|(https?:\/\/)/g;
    const matchIndices = [];
    let match;
    // Collect the start index of each path
    while ((match = pathStartRegex.exec(input)) !== null) {
        matchIndices.push(match.index);
    }
    // If none found, return empty
    if (!matchIndices.length) {
        return [];
    }
    // Slice from each index to just before the next
    const paths = [];
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
function flattenArrays(arrays) {
    return arrays.reduce((accumulator, current) => {
        return accumulator.concat(current);
    }, []);
}
export const run = async (opts) => {
    const ret = [];
    opts.logger = opts.logger ?? (await import('../logger.js')).kbotLogger;
    if (opts.include) {
        if (isString(opts.include)) {
            opts.include = [opts.include];
        }
        if (isArray(opts.include)) {
            // First check for glob patterns and web URLs
            const specialPatterns = opts.include.filter((path) => hasMagic(path) || isWebUrl(path));
            // Then process normal paths
            const normalPaths = opts.include.filter((path) => !hasMagic(path) && !isWebUrl(path));
            const processedPaths = flattenArrays(normalPaths.map(extractPaths));
            // Combine special patterns and processed paths
            opts.include = [...specialPatterns, ...processedPaths];
        }
    }
    else {
        opts.include = [];
    }
    // Process opts.exclude similarly to opts.include
    if (opts.exclude) {
        if (isString(opts.exclude)) {
            opts.exclude = [opts.exclude];
        }
        if (isArray(opts.exclude)) {
            const specialPatterns = opts.exclude.filter((path) => hasMagic(path) || isWebUrl(path));
            const normalPaths = opts.exclude.filter((path) => !hasMagic(path) && !isWebUrl(path));
            const processedPaths = flattenArrays(normalPaths.map(extractPaths));
            opts.exclude = [...specialPatterns, ...processedPaths];
        }
    }
    else {
        opts.exclude = [];
    }
    if (opts.each) {
        let items = [];
        if (isArray(opts.each)) {
            items = opts.each;
        }
        else if (exists(opts.each) && isFile(opts.each) && path.parse(opts.each).ext === '.json') {
            items = read(opts.each, 'json') || [];
        }
        else if (hasMagic(opts.each)) {
            const info = pathInfoEx(forward_slash(path.resolve(resolve(opts.each))), false, {
                absolute: true,
            });
            items = default_sort(info.FILES);
        }
        else if (isFile(opts.each) && exists(opts.each)) {
            items = [opts.each];
        }
        else if (isString(opts.each)) {
            items = opts.each.split(',');
        }
        if (items.length === 0) {
            opts.logger.warn(`No files matching pattern ${opts.each} found in ${opts.path}`);
            return ret;
        }
        opts.logger.info(`Processing ${items.length} items matching pattern ${opts.each}...`);
        const _models = all();
        for (const item of items) {
            try {
                const stats = lstatSync(item);
                if (!stats.isFile()) {
                    opts.logger.warn(`Item from --each is not a file, skipping: ${item}`);
                    continue;
                }
            }
            catch (e) {
                opts.logger.warn(`Item from --each is not a valid path, skipping: ${item}`);
                continue;
            }
            const itemOpts = {
                ...opts,
                ITEM: item,
                variables: { ITEM: item }
            };
            const model = _models.find(m => m.id === item);
            if (model) {
                itemOpts.model = item;
            }
            let currentItemSpecificIncludes = [forward_slash(item)];
            const initialIncludes = [...opts.include]; // Store original includes
            itemOpts.include = [...initialIncludes, ...currentItemSpecificIncludes];
            const result = await processRun(itemOpts);
            if (result !== undefined) {
                ret.push(result);
            }
        }
    }
    else {
        const result = await processRun(opts);
        if (result !== undefined) {
            ret.push(result);
        }
    }
    return ret;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3J1bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLFdBQVcsQ0FBQTtBQUNqQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBQ25DLE9BQU8sRUFBRSxHQUFHLElBQUksVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBRWhELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFDL0IsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNwQyxPQUFPLEVBQUUsSUFBSSxJQUFJLEdBQUcsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQzlDLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUM5RSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBSzdELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFDM0MsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFDbEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0MsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGlCQUFp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