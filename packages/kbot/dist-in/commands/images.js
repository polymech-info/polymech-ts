import { z } from 'zod';
import * as path from 'node:path';
import { sync as write } from '@polymech/fs/write';
import { sync as exists } from '@polymech/fs/exists';
import { readFileSync, statSync, unlinkSync } from 'node:fs';
import { Logger } from 'tslog';
import { variables } from '../variables.js';
import { resolve } from '@polymech/commons';
import { isArray, isString } from '@polymech/core/primitives';
import { OptionsSchema } from '../zod_schema.js';
import { createImage, editImage } from '../lib/images-google.js';
import { prompt as resolvePrompt } from '../prompt.js';
import { spawn } from 'node:child_process';
import { loadConfig } from '../config.js';
function generateUniqueFilename(dst, genFiles) {
    let dstDir;
    if (dst) {
        const absoluteDst = path.resolve(dst);
        const dstStat = exists(absoluteDst) ? statSync(absoluteDst) : null;
        if (dstStat && dstStat.isDirectory()) {
            dstDir = absoluteDst;
        }
        else {
            dstDir = path.dirname(absoluteDst);
        }
    }
    else if (genFiles.length > 0) {
        dstDir = path.dirname(genFiles[0]);
    }
    else {
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
        }
        else {
            baseFileName = originalBaseName;
        }
    }
    else {
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
function getGuiAppPath() {
    // Get the directory of this script file, then navigate to the GUI app
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    // On Windows, URL.pathname can have an extra leading slash, so we need to handle it
    const cleanScriptDir = process.platform === 'win32' && scriptDir.startsWith('/')
        ? scriptDir.substring(1)
        : scriptDir;
    const packageRoot = path.resolve(cleanScriptDir, '..', '..');
    // Determine platform-specific subdirectory and executable name
    let platformDir;
    let executableName;
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
};
async function launchGuiAndGetPrompt(argv) {
    const logger = new Logger({
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
        const args = [];
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
                                    logger.info(`📤 Sent image data: ${filename} (${Math.round(base64.length / 1024)}KB)`);
                                }
                            }
                            catch (error) {
                                logger.error(`Failed to send image: ${imagePath}`, error.message);
                            }
                        }
                    }
                    else if (message.type === 'delete_request') {
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
                                }
                                else {
                                    logger.warn(`⚠️ File not found for deletion: ${pathToDelete}`);
                                    const errorResponse = {
                                        cmd: 'file_deletion_error',
                                        path: pathToDelete,
                                        error: 'File not found on server.'
                                    };
                                    tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                                }
                            }
                            catch (error) {
                                logger.error(`❌ Failed to delete file: ${pathToDelete}`, error.message);
                                const errorResponse = {
                                    cmd: 'file_deletion_error',
                                    path: pathToDelete,
                                    error: error.message
                                };
                                tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                            }
                        }
                        else {
                            logger.error('Invalid delete request from GUI, path is missing.');
                        }
                    }
                    else if (message.type === 'generate_request') {
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
                            let imageBuffer = null;
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
                            }
                            else {
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
                            }
                            else {
                                logger.error('❌ Failed to generate image');
                                // Send error back to GUI
                                const errorResponse = {
                                    cmd: 'generation_error',
                                    error: 'Failed to generate image'
                                };
                                tauriProcess.stdin?.write(JSON.stringify(errorResponse) + '\n');
                            }
                        }
                        catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            const errorStack = error instanceof Error ? error.stack : undefined;
                            console.log('🔴 Generation error:', error, errorMessage);
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
                }
                catch (e) {
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
                            }
                            catch (e) {
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
                    }
                    else {
                        // Fallback for non-JSON logs - show all non-JSON content
                        logger.info('🦀', line);
                    }
                }
                catch (e) {
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
                    }
                    else if (line.trim()) {
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
            }
            else {
                reject(new Error(`Tauri app exited with code ${code}. stderr: ${errorOutput}`));
            }
        });
        tauriProcess.on('error', (err) => {
            reject(err);
        });
    });
}
export const imageCommand = async (argv) => {
    const logger = new Logger({ minLevel: argv.logLevel || 2 });
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
            }
            else {
                logger.info('GUI closed without providing a prompt.');
                return;
            }
        }
        catch (error) {
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
        const prompt = promptMessage?.content || '';
        if (!prompt && !include) {
            logger.error('Either --prompt (for image creation) or --include (for image editing) must be provided.');
            return;
        }
        if (!dst) {
            logger.error('--dst is required to specify the output file path.');
            return;
        }
        let imageBuffer = null;
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
        }
        else if (prompt) {
            // Image creation
            logger.info(`Creating image with prompt: "${prompt}"`);
            imageBuffer = await createImage(prompt, parsedOptions);
        }
        if (imageBuffer) {
            const vars = variables(parsedOptions);
            const dstPath = path.resolve(resolve(dst, parsedOptions.alt, vars));
            write(dstPath, imageBuffer);
            logger.info(`Image saved to: ${dstPath}`);
        }
        else {
            logger.error('Failed to generate image.');
        }
    }
    catch (error) {
        logger.error('Failed to parse options or generate image:', error.message, error.issues, error.stack);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2ltYWdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ3hCLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQ0gsWUFBWSxFQUNaLFFBQVEsRUFDUixVQUFVLEVBQ2IsTUFBTSxTQUFTLENBQUM7QUFDakIsT0FBTyxFQUFXLE1BQU0sRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUN4QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFOUQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDakUsT0FBTyxFQUFFLE1BQU0sSUFBSSxhQUFhLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFMUMsU0FBUyxzQkFBc0IsQ0FBQyxHQUF1QixFQUFFLFFBQWtCO0lBQ3ZFLElBQUksTUFBYyxDQUFDO0lBRW5CLElBQUksR0FBRyxFQUFFLENBQUM7UUFDTixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcs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