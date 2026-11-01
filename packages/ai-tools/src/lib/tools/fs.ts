import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { sync as rm } from '@polymech/fs/remove'
import { isString } from '@polymech/core/primitives'
import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { sync as rename } from '@polymech/fs/rename'
import { sync as exists } from '@polymech/fs/exists'
import { sanitize } from "@polymech/fs/utils"
import { filesEx } from '@polymech/commons'

import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'
import { EXCLUDE_GLOB } from '../../constants.js'

import { glob } from 'glob'

const isBase64 = (str: string): boolean => {
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
      const decoded = atob(str);   // Decode from Base64
      const reencoded = btoa(decoded); // Re-encode to Base64
      
      // Compare the re-encoded string to original
      return reencoded === str;
    } catch {
      return false;
    }
  }

export const decode_base64 = (base64: string): string => {
    try {
        if(!isBase64(base64)) {
            return base64
        }
        return Buffer.from(base64, 'base64').toString('utf-8');
    } catch (error) {
        throw new Error('Failed to decode base64 string');
    }
};

// Helper function for smart Base64 decoding
const decodeContentSmart = (content: string, logger: any, identifier: string): string => {
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
        } catch (decodeError) {
            // If decoding throws an error, assume it's plain text
            // Use debug level as this is expected for non-base64 lines
            logger.debug(`Base64 decoding failed for line in ${identifier}, assuming plain text. Line: ${trimmedLine}`);
            return trimmedLine; // Return original trimmed line
        }
    });


    // Join the processed lines back together
    return processedLines.join('\n');
};

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('fs', options)
    
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
                function: async (params: any) => {
                    try {
                        const directory = path.join(target, sanitize(params.directory));
                        if (!exists(directory)) {
                            logger.debug(`Tool::ListFiles Directory ${directory} does not exist`);
                            return []
                        }
                        let pattern = params.pattern || '**/*';
                        logger.debug(`Tool::ListFiles Listing files in ${directory} with pattern ${pattern}`);
                        pattern = [
                            ...EXCLUDE_GLOB,
                            pattern
                        ]
                        const ret = await glob(pattern, {
                            cwd: directory,
                            absolute: false,
                            ignore: EXCLUDE_GLOB
                        });
                        return ret
                    } catch (error) {
                        logger.error('Error listing files', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
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
                function: async (params: any) => {
                    try {
                        const pattern = params.pattern || '**/*';
                        let entries = filesEx(target, pattern);
                        let ret = entries.map((entry) => {
                            try {
                                let content = read(entry);
                                return {
                                    path: path.relative(target, entry).replace(/\\/g, '/'),
                                    content: content.toString()
                                }
                            } catch (error) {
                                logger.error(`Error reading file ${entry}:`, error)
                                return null
                            }
                        })
                        ret = ret.filter((entry) => (entry !== null && entry.content))
                        logger.debug(`Tool::ReadFiles Reading files in ${target} with pattern ${pattern} : ${ret.length} files`, ret.map((entry) => entry.path));
                        return ret
                    } catch (error) {
                        logger.error('Error listing files', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
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
                function: async (params: any) => {
                    try {
                        const filePath = path.join(target, sanitize(params.path));
                        logger.debug(`Tool::RemoveFile Removing file ${filePath}`);
                        rm(filePath);
                        return true;
                    } catch (error) {
                        logger.error('Error removing file', error);
                        throw error;
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
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
                function: async (params: any) => {
                    try {
                        const src = path.join(target, sanitize(params.src))
                        const dst = path.join(target, sanitize(params.dst))
                        logger.debug(`Tool::Rename file ${src} to ${dst}`)
                        rename(src, dst)
                        rm(src)
                        return true
                    } catch (error) {
                        logger.error('Error removing file', error)
                        throw error
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
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
                            logger.error(`Tool::FS:modify_project_files : Root path required`)
                            return
                        }
                        let { files } = ret as any
                        if (isString(files)) {
                            try {
                                files = JSON.parse(files)
                            } catch (error: any) {
                                logger.error(`Tool::modify_project_files : Structure Error parsing files`, error, ret)
                                // Consider writing the raw input for debugging if JSON parsing fails
                                // write(path.join(target, 'tools-output-error.json'), files) 
                                return error.message
                            }
                        }
                        for (const file of files) {
                            const sanitizedPath = sanitize(file.path);
                            const filePath = path.join(target, sanitizedPath);
                            logger.debug(`Tool:modify_project_files writing file ${filePath}`)
                            try {
                                // const contentToWrite = decodeContentSmart(file.content, logger, sanitizedPath);
                                try {
                                    await write(filePath, file.content)
                                } catch (writeError) {
                                    logger.error(`Tool:modify_project_files Error writing file ${filePath}`, writeError)
                                }
                            } catch (error) {
                                logger.error(`Tool:modify_project_files Error processing file content for ${filePath}`, error)
                            }
                        }
                    } catch (error) {
                        logger.error(`Error creating project structure`, error)
                    }
                },

                parse: JSON.parse,
            },
        } as RunnableToolFunction<{ id: string }>,
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
                                params = JSON.parse(params)
                            } catch (error: any) {
                                logger.error(`Tool::write_file : Structure Error parsing JSON`, error, params)
                                return error.message
                            }
                        }
                        
                        fileInfo = (params as any).file; // Keep fileInfo accessible

                        if (!target || !fileInfo || !fileInfo.path || typeof fileInfo.content === 'undefined') {
                            logger.error(`Tool::write_file : Path/Target/Content are required`, fileInfo)
                            return false; // Indicate failure
                        }

                        const sanitizedPath = sanitize(fileInfo.path);
                        const filePath = path.join(target, sanitizedPath)
                        logger.debug(`Tool::write_file Writing file ${filePath}`)
                        try {
                            // Use the smart decoding helper function
                            // const contentToWrite = decodeContentSmart(fileInfo.content, logger, sanitizedPath);
                            await write(filePath, fileInfo.content)
                            return true
                        } catch (error) {
                            // Log error related to processing or writing the file
                            logger.error(`Tool:write_file Error processing or writing file ${sanitizedPath}`, error)
                            return false // Indicate failure
                        }
                    } catch (error) {
                        logger.error(`Tool:write_file Error writing file ${fileInfo?.path ? sanitize(fileInfo.path) : 'unknown'}`, error)
                        return false // Indicate failure
                    }
                },
                parse: JSON.parse,
            },
        } as RunnableToolFunction<{ id: string }>,
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
                                ret = JSON.parse(ret)
                            } catch (error: any) {
                                logger.error(`Tool::file_exists : Structure Error parsing files`, error, ret)
                                return error.message
                            }
                        }
                        const { file } = ret as any
                        if (!target || !file.path) {
                            logger.error(`Tool::file_exists : Path is required`, ret)
                            return
                        }
                        const sanitizedPath = sanitize(file.path);
                        const filePath = path.join(target, sanitizedPath)
                        const res = exists(filePath)
                        logger.debug(`Tool::file_exists ${filePath} exists: ${res}`)
                        return res ? true : false
                    } catch (error) {
                        logger.error(`Tool:file_exists error`, error)
                        return false
                    }
                },
                parse: JSON.parse,
            },
        } as RunnableToolFunction<{ id: string }>,
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
                        const { file } = ret as any
                        const sanitizedPath = sanitize(file.path);
                        const filePath = path.join(target, sanitizedPath)
                        logger.debug(`Tool::ReadFile Reading file ${filePath}`)
                        return read(filePath, 'string')
                    } catch (error) {
                        logger.error(`Error reading file`, error)
                    }
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<{ id: string }>
    ]
};
