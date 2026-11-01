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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3Rvb2xzL2ZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBRTVCLE9BQU8sRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDaEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBQzdDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUUzQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFM0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBRWpELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxNQUFNLENBQUE7QUFFM0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFXLEVBQVcsRUFBRTtJQUN0QyxtREFBbUQ7SUFDbkQsdUNBQXVDO0lBQ3ZDLGlGQUFpRjtJQUNqRixJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDO0lBQzdDLElBQUksQ0FBQyxXQUFX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