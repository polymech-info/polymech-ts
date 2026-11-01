import * as path from 'path';
import { sync as rm } from '@polymech/fs/remove';
import { isString } from '@polymech/core/primitives';
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/read';
import { sync as rename } from '@polymech/fs/rename';
import { sync as exists } from '@polymech/fs/exists';
import { sanitize } from "@polymech/fs/utils";
import { filesEx } from '@polymech/commons';
import { toolLogger } from '../../index.js';
import { EXCLUDE_GLOB } from '../../constants.js';
import { glob } from 'glob';
const isBase64 = (str) => {
    // 1. Quick checks for length & allowed characters:
    //    - Must be multiple of 4 in length
    //    - Must match Base64 charset (A-Z, a-z, 0-9, +, /) plus optional "=" padding
    if (!str || str.length % 4 !== 0) {
        return false;
    }
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    if (!base64Regex.test(str)) {
        return false;
    }
    // 2. Attempt decode–re-encode to confirm validity:
    try {
        const decoded = atob(str); // Decode from Base64
        const reencoded = btoa(decoded); // Re-encode to Base64
        // Compare the re-encoded string to original
        return reencoded === str;
    }
    catch {
        return false;
    }
};
export const decode_base64 = (base64) => {
    try {
        if (!isBase64(base64)) {
            return base64;
        }
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
    catch (error) {
        throw new Error('Failed to decode base64 string');
    }
};
// Helper function for smart Base64 decoding
const decodeContentSmart = (content, logger, identifier) => {
    if (!content || typeof content !== 'string') {
        return content; // Return original content if null, undefined, or not a string
    }
    const lines = content.split(/\r?\n/);
    const processedLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            return ''; // Preserve empty lines between potential blocks but decode the blocks themselves
        }
        try {
            // Attempt to decode Base64
            const decodedLine = Buffer.from(trimmedLine, 'base64').toString('utf-8');
            // Validate if it was actually Base64 by re-encoding
            const reEncodedLine = Buffer.from(decodedLine, 'utf-8').toString('base64');
            // Revised Validation Check:
            // Compare original trimmed line with re-encoded line.
            // Allow for potential padding differences by checking both exact match and no-pad match.
            const originalNoPad = trimmedLine.replace(/={1,2}$/, '');
            const reEncodedNoPad = reEncodedLine.replace(/={1,2}$/, '');
            if (reEncodedLine === trimmedLine || reEncodedNoPad === originalNoPad) {
                logger.debug(`Successfully decoded Base64 line for ${identifier}`);
                return decodedLine;
            }
            // If validation fails, treat as plain text
            logger.debug(`Re-encoding mismatch for ${identifier}. Original: '${trimmedLine}', Re-encoded: '${reEncodedLine}', using original trimmed line.`);
            return trimmedLine;
        }
        catch (decodeError) {
            // If decoding throws an error, assume it's plain text
            // Use debug level as this is expected for non-base64 lines
            logger.debug(`Base64 decoding failed for line in ${identifier}, assuming plain text. Line: ${trimmedLine}`);
            return trimmedLine; // Return original trimmed line
        }
    });
    // Join the processed lines back together
    return processedLines.join('\n');
};
export const tools = (target, options) => {
    const logger = toolLogger('fs', options);
    return [
        {
            type: 'function',
            function: {
                name: 'list_files',
                description: 'List all files in a directory',
                parameters: {
                    type: 'object',
                    properties: {
                        directory: { type: 'string' },
                        pattern: { type: 'string', optional: true }
                    },
                    required: ['directory']
                },
                function: async (params) => {
                    try {
                        const directory = path.join(target, sanitize(params.directory));
                        if (!exists(directory)) {
                            logger.debug(`Tool::ListFiles Directory ${directory} does not exist`);
                            return [];
                        }
                        let pattern = params.pattern || '**/*';
                        logger.debug(`Tool::ListFiles Listing files in ${directory} with pattern ${pattern}`);
                        pattern = [
                            ...EXCLUDE_GLOB,
                            pattern
                        ];
                        const ret = await glob(pattern, {
                            cwd: directory,
                            absolute: false,
                            ignore: EXCLUDE_GLOB
                        });
                        return ret;
                    }
                    catch (error) {
                        logger.error('Error listing files', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        },
        {
            type: 'function',
            function: {
                name: 'read_files',
                description: 'Reads files in a directory with a given pattern',
                parameters: {
                    type: 'object',
                    properties: {
                        directory: { type: 'string' },
                        pattern: { type: 'string', optional: true }
                    },
                    required: ['directory']
                },
                function: async (params) => {
                    try {
                        const pattern = params.pattern || '**/*';
                        let entries = filesEx(target, pattern);
                        let ret = entries.map((entry) => {
                            try {
                                let content = read(entry);
                                return {
                                    path: path.relative(target, entry).replace(/\\/g, '/'),
                                    content: content.toString()
                                };
                            }
                            catch (error) {
                                logger.error(`Error reading file ${entry}:`, error);
                                return null;
                            }
                        });
                        ret = ret.filter((entry) => (entry !== null && entry.content));
                        logger.debug(`Tool::ReadFiles Reading files in ${target} with pattern ${pattern} : ${ret.length} files`, ret.map((entry) => entry.path));
                        return ret;
                    }
                    catch (error) {
                        logger.error('Error listing files', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        },
        {
            type: 'function',
            function: {
                name: 'remove_file',
                description: 'Remove a file at given path',
                parameters: {
                    type: 'object',
                    properties: {
                        path: { type: 'string' }
                    },
                    required: ['path']
                },
                function: async (params) => {
                    try {
                        const filePath = path.join(target, sanitize(params.path));
                        logger.debug(`Tool::RemoveFile Removing file ${filePath}`);
                        rm(filePath);
                        return true;
                    }
                    catch (error) {
                        logger.error('Error removing file', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        },
        {
            type: 'function',
            function: {
                name: 'rename_file',
                description: 'Rename or move a file or directory',
                parameters: {
                    type: 'object',
                    properties: {
                        src: { type: 'string' },
                        dst: { type: 'string' }
                    },
                    required: ['path']
                },
                function: async (params) => {
                    try {
                        const src = path.join(target, sanitize(params.src));
                        const dst = path.join(target, sanitize(params.dst));
                        logger.debug(`Tool::Rename file ${src} to ${dst}`);
                        rename(src, dst);
                        rm(src);
                        return true;
                    }
                    catch (error) {
                        logger.error('Error removing file', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        },
        {
            type: 'function',
            function: {
                name: "modify_project_files",
                description: "Create or modify existing project files in one shot, preferably used for creating project structure)",
                parameters: {
                    type: "object",
                    properties: {
                        files: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    path: { type: "string" },
                                    content: { type: "string", description: "new file content (Part of JSON payload)" }
                                },
                                required: ["path", "content"]
                            }
                        }
                    },
                    required: ["files"],
                },
                function: async (ret) => {
                    try {
                        if (!target) {
                            logger.error(`Tool::FS:modify_project_files : Root path required`);
                            return;
                        }
                        let { files } = ret;
                        if (isString(files)) {
                            try {
                                files = JSON.parse(files);
                            }
                            catch (error) {
                                logger.error(`Tool::modify_project_files : Structure Error parsing files`, error, ret);
                                // Consider writing the raw input for debugging if JSON parsing fails
                                // write(path.join(target, 'tools-output-error.json'), files) 
                                return error.message;
                            }
                        }
                        for (const file of files) {
                            const sanitizedPath = sanitize(file.path);
                            const filePath = path.join(target, sanitizedPath);
                            logger.debug(`Tool:modify_project_files writing file ${filePath}`);
                            try {
                                // const contentToWrite = decodeContentSmart(file.content, logger, sanitizedPath);
                                try {
                                    await write(filePath, file.content);
                                }
                                catch (writeError) {
                                    logger.error(`Tool:modify_project_files Error writing file ${filePath}`, writeError);
                                }
                            }
                            catch (error) {
                                logger.error(`Tool:modify_project_files Error processing file content for ${filePath}`, error);
                            }
                        }
                    }
                    catch (error) {
                        logger.error(`Error creating project structure`, error);
                    }
                },
                parse: JSON.parse,
            },
        },
        {
            type: 'function',
            function: {
                name: "write_file",
                description: "Writes to a file, given a path and content (Part of JSON payload). No directory or file exists check needed!",
                parameters: {
                    type: "object",
                    properties: {
                        file: {
                            type: "object",
                            properties: {
                                path: { type: "string" },
                                content: { type: "string", description: "new file content (Part of JSON payload)" }
                            }
                        }
                    },
                    required: ["file"],
                },
                function: async (params) => {
                    let fileInfo;
                    try {
                        if (isString(params)) {
                            try {
                                params = JSON.parse(params);
                            }
                            catch (error) {
                                logger.error(`Tool::write_file : Structure Error parsing JSON`, error, params);
                                return error.message;
                            }
                        }
                        fileInfo = params.file; // Keep fileInfo accessible
                        if (!target || !fileInfo || !fileInfo.path || typeof fileInfo.content === 'undefined') {
                            logger.error(`Tool::write_file : Path/Target/Content are required`, fileInfo);
                            return false; // Indicate failure
                        }
                        const sanitizedPath = sanitize(fileInfo.path);
                        const filePath = path.join(target, sanitizedPath);
                        logger.debug(`Tool::write_file Writing file ${filePath}`);
                        try {
                            // Use the smart decoding helper function
                            // const contentToWrite = decodeContentSmart(fileInfo.content, logger, sanitizedPath);
                            await write(filePath, fileInfo.content);
                            return true;
                        }
                        catch (error) {
                            // Log error related to processing or writing the file
                            logger.error(`Tool:write_file Error processing or writing file ${sanitizedPath}`, error);
                            return false; // Indicate failure
                        }
                    }
                    catch (error) {
                        logger.error(`Tool:write_file Error writing file ${fileInfo?.path ? sanitize(fileInfo.path) : 'unknown'}`, error);
                        return false; // Indicate failure
                    }
                },
                parse: JSON.parse,
            },
        },
        {
            type: 'function',
            function: {
                name: "file_exists",
                description: "check if a file or folder exists",
                parameters: {
                    type: "object",
                    properties: {
                        file: {
                            type: "object",
                            properties: {
                                path: { type: "string" }
                            }
                        }
                    },
                    required: ["file"],
                },
                function: async (ret) => {
                    try {
                        if (isString(ret)) {
                            try {
                                ret = JSON.parse(ret);
                            }
                            catch (error) {
                                logger.error(`Tool::file_exists : Structure Error parsing files`, error, ret);
                                return error.message;
                            }
                        }
                        const { file } = ret;
                        if (!target || !file.path) {
                            logger.error(`Tool::file_exists : Path is required`, ret);
                            return;
                        }
                        const sanitizedPath = sanitize(file.path);
                        const filePath = path.join(target, sanitizedPath);
                        const res = exists(filePath);
                        logger.debug(`Tool::file_exists ${filePath} exists: ${res}`);
                        return res ? true : false;
                    }
                    catch (error) {
                        logger.error(`Tool:file_exists error`, error);
                        return false;
                    }
                },
                parse: JSON.parse,
            },
        },
        {
            type: 'function',
            function: {
                name: "read_file",
                description: "read a file, at given a path",
                parameters: {
                    type: "object",
                    properties: {
                        file: {
                            type: "object",
                            properties: {
                                path: { type: "string" }
                            }
                        }
                    },
                    required: ["file"],
                },
                function: async (ret) => {
                    try {
                        const { file } = ret;
                        const sanitizedPath = sanitize(file.path);
                        const filePath = path.join(target, sanitizedPath);
                        logger.debug(`Tool::ReadFile Reading file ${filePath}`);
                        return read(filePath, 'string');
                    }
                    catch (error) {
                        logger.error(`Error reading file`, error);
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMgY29weS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdG9vbHMvZnMgY29weS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUU1QixPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDaEQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUM3QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFM0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRTNDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUVqRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBRTNCLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBVyxFQUFXLEVBQUU7SUFDdEMsbURBQW1EO0lBQ25ELHVDQUF1QztJQUN2QyxpRkFBaUY7SUFDakYsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDO0lBQzdDLElBQUksQ0FBQyxXQUFX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