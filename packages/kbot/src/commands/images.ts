import { z } from 'zod';
import * as path from 'node:path';
import { sync as write } from '@polymech/fs/write';
import { sync as exists } from '@polymech/fs/exists';
import {
    readFileSync,
    statSync,
    unlinkSync
} from 'node:fs';
import { ILogObj, Logger } from 'tslog';
import { variables } from '../variables.js';
import { resolve } from '@polymech/commons';

import { isArray, isString } from '@polymech/core/primitives';

import { OptionsSchema } from '../zod_schema.js';
import { createImage, editImage } from '../lib/images-google.js';
import { prompt as resolvePrompt } from '../prompt.js';
import { spawn } from 'node:child_process';
import { loadConfig } from '../config.js';

function generateUniqueFilename(dst: string | undefined, genFiles: string[]): string {
    let dstDir: string;

    if (dst) {
        const absoluteDst = path.resolve(dst);
        const dstStat = exists(absoluteDst) ? statSync(absoluteDst) : null;
        if (dstStat && dstStat.isDirectory()) {
            dstDir = absoluteDst;
        } else {
            dstDir = path.dirname(absoluteDst);
        }
    } else if (genFiles.length > 0) {
        dstDir = path.dirname(genFiles[0]);
    } else {
        dstDir = process.cwd(); // fallback to current working dir
    }

    let baseFileName;
    let i = 0;

    if (genFiles.length > 0) {
        const originalBaseName = path.basename(genFiles[0], path.extname(genFiles[0]));
        const match = originalBaseName.match(/_gen_(\d+)$/);
        if (match && match.index) {
            baseFileName = originalBaseName.substring(0, match.index);
            i = parseInt(match[1], 10) + 1;
        } else {
            baseFileName = originalBaseName;
        }
    } else {
        baseFileName = 'generated';
    }

    let newFileName;
    let finalDstPath;
    do {
        newFileName = `${baseFileName}_gen_${i}.png`;
        finalDstPath = path.resolve(dstDir, newFileName);
        i++;
    } while (exists(finalDstPath));

    return finalDstPath;
}

function getGuiAppPath(): string {
    
    // Get the directory of this script file, then navigate to the GUI app
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, URL.pathname can have an extra leading slash, so we need to handle it
    const cleanScriptDir = process.platform === 'win32' && scriptDir.startsWith('/') 
        ? scriptDir.substring(1) 
        : scriptDir;
    
        const packageRoot = path.resolve(cleanScriptDir, '..', '..');
    
    // Determine platform-specific subdirectory and executable name
    let platformDir: string;
    let executableName: string;
    
    switch (process.platform) {
        case 'win32':
            platformDir = 'win-64';
            executableName = 'tauri-app.exe';
            break;
        case 'darwin':
            platformDir = 'osx-64';
            executableName = 'tauri-app';
            break;
        case 'linux':
            platformDir = 'linux-64';
            executableName = 'tauri-app';
            break;
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
    
    return path.join(packageRoot, 'dist', platformDir, executableName);
}

export const ImageOptionsSchema = () => {
    const baseSchema = OptionsSchema().pick({
        prompt: true,
        include: true,
        dst: true,
        model: true,
        logLevel: true,
        config: true,
        api_key: true,
        alt: true,
    });

    return baseSchema.extend({
        gui: z.boolean().optional().describe('Use GUI to enter prompt.'),
        model: z.string().default('gemini-2.5-flash-image-preview').describe('AI model to use for image generation/editing.'),
        dst: z.string().describe('Destination path for the output image. Required.'),
        prompt: z.string().optional().describe('The prompt for image creation or editing.'),
    });
}

async function launchGuiAndGetPrompt(argv: any): Promise<string | null> {
    const logger = new Logger<ILogObj>({ 
        minLevel: 0, // Show all logs for debugging
        prettyLogTemplate: "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}.{{ms}}\t{{logLevelName}}\t"
    });
    
    return new Promise((_resolve, reject) => {
        const guiAppPath = getGuiAppPath();
        logger.info('📁 GUI app path:', guiAppPath);
        if (!exists(guiAppPath)) {
            return reject(new Error(`GUI application not found at: ${guiAppPath}. Please build it first by running 'npm run tauri build' in 'gui/tauri-app'.`));
        }
        
        // Prepare CLI arguments
        const args: string[] = [];
        
        // Add include files
        if (argv.include) {
            const includes = Array.isArray(argv.include) ? argv.include : [argv.include];
            const absoluteIncludes = includes.map(p => path.resolve(p));
            args.push(...absoluteIncludes);
        }
        
        // Add API key
        const config = loadConfig(argv);
        const apiKey = argv.api_key || config?.google?.key;
        if (apiKey) {
            args.push('--api-key', apiKey);
        }

        // Add dst
        if (argv.dst) {
            args.push('--dst', argv.dst);
        }

        // Add prompt
        if (argv.prompt) {
            args.push('--prompt', argv.prompt);
        }

        const tauriProcess = spawn(guiAppPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        
        let output = '';
        let errorOutput = '';
        
        tauriProcess.stdout.on('data', async (data) => {
            const chunk = data.toString();
            
            // Check for config requests from the GUI
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const message = JSON.parse(line);
                    if (message.type === 'config_request') {
                        logger.info('📨 Received config request from GUI');
                        
                        // Send config data back via Tauri commands
                        const config = loadConfig(argv);
                        const apiKey = argv.api_key || config?.google?.key;
                        const includes = argv.include ? (Array.isArray(argv.include) ? argv.include : [argv.include]) : [];
                        const absoluteIncludes = includes.map(p => path.resolve(p));

                        const configResponse = {
                            cmd: 'forward_config_to_frontend',
                            prompt: argv.prompt || null,
                            dst: argv.dst || null,
                            apiKey: apiKey || null,
                            files: absoluteIncludes
                        };
                        
                        const jsonString = JSON.stringify(configResponse);
                        logger.info('📤 About to write to stdin:', jsonString);
                        tauriProcess.stdin?.write(jsonString + '\n');
                        logger.info('📤 Sent config response to GUI', configResponse);

                        // Send image data
                        for (const imagePath of absoluteIncludes) {
                            try {
                                if (exists(imagePath)) {
                                    const imageBuffer = readFileSync(imagePath);
                                    const base64 = imageBuffer.toString('base64');
                                    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
                                    const filename = path.basename(imagePath);
                                    
                                    const imageResponse = {
                                        cmd: 'forward_image_to_frontend',
                                        base64,
                                        mimeType,
                                        filename: imagePath
                                    };
                                    
                                    tauriProcess.stdin?.write(JSON.stringify(imageResponse) + '\n');
                                    logger.info(`📤 Sent image data: ${filename} (${Math.round(base64.length/1024)}KB)`);
                                }
                            } catch (error) {
                                logger.error(`Failed to send image: ${imagePath}`, error.message);
                            }
                        }
                    } else if (message.type === 'delete_request') {
                        logger.info('📨 Received delete request from GUI');
                        const pathToDelete = message.path;
                        if (pathToDelete && isString(pathToDelete)) {
                            try {
                                if (exists(pathToDelete)) {
                                    unlinkSync(pathToDelete);
                                    logger.info(`✅ File deleted successfully: ${pathToDelete}`);
                                    const successResponse = {
                                        cmd: 'file_deleted_successfully',
                                        path: pathToDelete
                                    };
                                    tauriProcess.stdin?.write(JSON.stringify(successResponse) + '\n');
                                } else {
                                    logger.warn(`⚠️ File not found for deletion: ${pathToDelete}`);
                                    const errorResponse = {
                                        cmd: 'file_deletion_error',
                                        path: pathToDelete,
                                        error: 'File not found on server.'
                                    };
                                    tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                                }
                            } catch (error) {
                                logger.error(`❌ Failed to delete file: ${pathToDelete}`, error.message);
                                const errorResponse = {
                                    cmd: 'file_deletion_error',
                                    path: pathToDelete,
                                    error: error.message
                                };
                                tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                            }
                        } else {
                            logger.error('Invalid delete request from GUI, path is missing.');
                        }
                    } else if (message.type === 'generate_request') {
                        logger.info('📨 Received generation request from GUI');
                        
                        // Extract variables outside try block for error handling
                        const genPrompt = message.prompt;
                        const genFiles = message.files || [];
                        const genDst = message.dst;
                        
                        // Process the generation request using our existing image generation logic
                        try {
                            
                            const finalDstPath = generateUniqueFilename(genDst, genFiles);
                            logger.info(`📝 Determined destination path for generated image: ${finalDstPath}`);
                            
                            logger.info(`🎨 Starting image generation: "${genPrompt}"`);
                            
                            let imageBuffer: Buffer | null = null;
                            
                            if (genFiles.length > 0) {
                                // Image editing
                                logger.info(`Editing image(s) "${genFiles.join(', ')}" with prompt: "${genPrompt}"`);
                                const parsedOptions = ImageOptionsSchema().parse({
                                    ...argv,
                                    prompt: genPrompt,
                                    include: genFiles,
                                    dst: finalDstPath // Use the new path
                                });
                                imageBuffer = await editImage(genPrompt, genFiles, parsedOptions);
                            } else {
                                // Image creation
                                logger.info(`Creating image with prompt: "${genPrompt}"`);
                                const creationArgv = { ...argv };
                                delete creationArgv.include;
                                const parsedOptions = ImageOptionsSchema().parse({
                                    ...creationArgv,
                                    prompt: genPrompt,
                                    dst: finalDstPath // Use the new path
                                });
                                imageBuffer = await createImage(genPrompt, parsedOptions);
                            }

                            if (imageBuffer) {
                                write(finalDstPath, imageBuffer);
                                logger.info(`✅ Image saved to: ${finalDstPath}`);

                                // Send the generated image back to the GUI (chat mode)
                                const base64Result = imageBuffer.toString('base64');
                                
                                const imageResponse = {
                                    cmd: 'forward_image_to_frontend',
                                    base64: base64Result,
                                    mimeType: 'image/png',
                                    filename: finalDstPath
                                };
                                
                                tauriProcess.stdin?.write(JSON.stringify(imageResponse) + '\n');
                                logger.info(`✅ Generated image sent to GUI: ${path.basename(finalDstPath)}`);
                            } else {
                                logger.error('❌ Failed to generate image');
                                
                                // Send error back to GUI
                                const errorResponse = {
                                    cmd: 'generation_error',
                                    error: 'Failed to generate image'
                                };
                                tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                            }
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            const errorStack = error instanceof Error ? error.stack : undefined;

                            console.log('🔴 Generation error:', error,errorMessage);
                            
                            logger.error('❌ Generation error:', {
                                message: errorMessage,
                                stack: errorStack,
                                prompt: genPrompt?.substring(0, 100) + '...',
                                fileCount: genFiles?.length || 0,
                                files: genFiles?.map(f => path.basename(f))
                            });
                            
                            // Send detailed error back to GUI
                            const errorResponse = {
                                cmd: 'generation_error',
                                error: errorMessage,
                                details: {
                                    prompt: genPrompt?.substring(0, 100) + '...',
                                    fileCount: genFiles?.length || 0,
                                    timestamp: new Date().toISOString()
                                }
                            };
                            tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                        }
                    }
                } catch (e) {
                    // Not a JSON message, add to regular output
                    logger.info('GUI stdout chunk:', JSON.stringify(line));
                    output += line + '\n';
                }
            }
        });

        tauriProcess.stderr.on('data', (data) => {
            const chunk = data.toString();
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const logMessage = JSON.parse(line);
                    if (logMessage.level && logMessage.message) {
                        // This is a structured log from Rust
                        
                        // Suppress noisy debug messages
                        if (logMessage.message === 'add_debug_message command called.' || 
                            logMessage.message.includes('Debug message added. Total messages:')) {
                            return; // Skip these noisy logs
                        }
                        
                        // Parse and prettify stdin command logs
                        if (logMessage.message === 'Received stdin command' && logMessage.data?.content) {
                            try {
                                const command = JSON.parse(logMessage.data.content);
                                if (command.cmd) {
                                    logger.info(`🦀 📨 Stdin: ${command.cmd}`, {
                                        prompt: command.prompt ? `"${command.prompt.substring(0, 50)}${command.prompt.length > 50 ? '...' : ''}"` : undefined,
                                        dst: command.dst,
                                        files: command.files?.length ? `${command.files.length} files` : undefined,
                                        hasApiKey: !!command.apiKey
                                    });
                                    return;
                                }
                            } catch (e) {
                                // Fall through to regular logging
                            }
                        }
                        
                        switch (logMessage.level.toLowerCase()) {
                            case 'debug':
                                logger.debug(`🦀 ${logMessage.message}`, logMessage.data);
                                break;
                            case 'info':
                                logger.info(`🦀 ${logMessage.message}`, logMessage.data);
                                break;
                            case 'warn':
                                logger.warn(`🦀 ${logMessage.message}`, logMessage.data);
                                break;
                            case 'error':
                                logger.error(`🦀 ${logMessage.message}`, logMessage.data);
                                break;
                            default:
                                logger.info(`🦀 ${logMessage.message}`, logMessage.data);
                        }
                    } else {
                        // Fallback for non-JSON logs - show all non-JSON content
                        logger.info('🦀', line);
                    }
                } catch (e) {
                    // Not JSON, show it unless it's the old verbose [RUST LOG] format
                    if (line.includes('[RUST LOG]')) {
                        // Suppress add_debug_message noise
                        if (line.includes('add_debug_message command called') || 
                            line.includes('Debug message added. Total messages:')) {
                            return; // Skip these
                        }
                        // Skip the old verbose format, but keep important parts
                        if (line.includes('command called') || line.includes('emitted successfully') || line.includes('Failed to')) {
                            const cleanedLine = line.replace(/^\[RUST LOG\]:\s*/, '').replace(/^\s*-\s*/, '');
                            logger.info('🦀', cleanedLine);
                        }
                    } else if (line.trim()) {
                        // Show all other stderr content
                        logger.info('🦀', line);
                    }
                }
            }
            errorOutput += chunk;
        });

        tauriProcess.on('close', (code) => {
            logger.info('GUI process closed with code:', code);
            logger.info('Final stdout:', JSON.stringify(output));
            logger.info('Final stderr:', JSON.stringify(errorOutput));
            
            if (code === 0) {
                const trimmedOutput = output.trim();
                logger.info('Attempting to parse JSON:', JSON.stringify(trimmedOutput));
                _resolve(trimmedOutput || null);
            } else {
                reject(new Error(`Tauri app exited with code ${code}. stderr: ${errorOutput}`));
            }
        });

        tauriProcess.on('error', (err) => {
            reject(err);
        });
    });
}

export const imageCommand = async (argv: any) => {
    const logger = new Logger<ILogObj>({ minLevel: argv.logLevel || 2 });
    
    if (argv.gui) {
        try {
            const guiOutput = await launchGuiAndGetPrompt(argv);
            if (guiOutput) {
                const payload = JSON.parse(guiOutput);
                argv.prompt = payload.prompt;
                if (payload.files && payload.files.length > 0) {
                    argv.include = payload.files;
                }
                if (payload.dst) {
                    argv.dst = payload.dst;
                }
            } else {
                logger.info('GUI closed without providing a prompt.');
                return;
            }
        } catch (error) {
            logger.error('Failed to run GUI:', error.message);
            return;
        }
    }

    if (argv.include && isString(argv.include)) {
        argv.include = [argv.include];
    }

    try {
        const parsedOptions = ImageOptionsSchema().parse(argv);
        const { include, dst, ...rest } = parsedOptions;
        
        const promptMessage = await resolvePrompt(parsedOptions);
        const prompt = promptMessage?.content as string || '';

        if (!prompt && !include) {
            logger.error('Either --prompt (for image creation) or --include (for image editing) must be provided.');
            return;
        }
        
        if (!dst) {
            logger.error('--dst is required to specify the output file path.');
            return;
        }

        let imageBuffer: Buffer | null = null;

        if (include && isArray(include) && include.length > 0) {
            // Image editing
            for (const imagePath of include) {
                if (!exists(imagePath)) {
                    logger.error(`Input image not found at: ${imagePath}`);
                    return;
                }
            }
            if (!prompt) {
                logger.error('--prompt is required for image editing.');
                return;
            }
            logger.info(`Editing image(s) "${include.join(', ')}" with prompt: "${prompt}"`);
            imageBuffer = await editImage(prompt, include, parsedOptions);
        } else if (prompt) {
            // Image creation
            logger.info(`Creating image with prompt: "${prompt}"`);
            imageBuffer = await createImage(prompt, parsedOptions);
        }

        if (imageBuffer) {
            const vars = variables(parsedOptions);
            const dstPath = path.resolve(resolve(dst, parsedOptions.alt, vars));
            write(dstPath, imageBuffer);
            logger.info(`Image saved to: ${dstPath}`);
        } else {
            logger.error('Failed to generate image.');
        }

    } catch (error) {
        logger.error('Failed to parse options or generate image:', error.message, error.issues, error.stack);
    }
};
