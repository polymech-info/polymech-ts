import * as path from 'node:path';
import * as fs from 'node:fs';
import { sync as exists } from '@polymech/fs/exists'; // Still needed for vectorize
import { isFile, forward_slash, resolve as resolvePath } from '@polymech/commons'; // Renamed resolve to resolvePath to avoid conflict
import { logger } from './index.js';
import { lookup } from 'mime-types';
import { defaultMimeRegistry } from './mime-handlers.js';
import { supported } from './commands/run-assistant.js';
import { handleWebUrl } from './http.js';
import { glob } from './glob.js'; // Import glob from glob.ts
import { sourceVariables } from './variables.js'; // Import for dynamic exclusion
import { E_Mode } from './zod_schema.js'; // Import E_Mode for the check
/**
 * @todos
 * - add support for vector stores : https://platform.openai.com/docs/assistants/tools/file-search?lang=node.js
 */
// default_filters moved to glob.ts
// isPathInside moved to glob.ts
// isWebUrl moved to glob.ts (or handled by handleWebUrl directly)
export const isPathOutsideSafe = (pathA, pathB) => {
    const realA = fs.realpathSync(pathA);
    const realB = fs.realpathSync(pathB);
    // Assuming isPathInside was a local helper, if it's broadly used, it should be in commons or imported
    // For now, this might break if isPathInside is not accessible. 
    // Let's assume for now it was only for the old glob. If not, this needs to be addressed.
    const relation = path.relative(realB, realA); // Corrected order for typical usage
    return Boolean(relation &&
        !relation.startsWith('..') &&
        !relation.startsWith('..' + path.sep));
};
export const base64 = (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = lookup(filePath);
        if (!mimeType) {
            throw new Error('Unable to determine MIME type.');
        }
        const base64Data = fileBuffer.toString('base64');
        return `data:${mimeType};base64,${base64Data}`;
    }
    catch (error) {
        logger.error('fileToBase64 : Error reading file:', error);
        return null;
    }
};
export const images = (files) => {
    return files.map((f) => ({
        type: "image_url",
        image_url: { url: base64(f) }
    }));
};
// glob function definition removed from here
export async function get(projectPath, // This is already an absolute path from processRun/complete_messages
include = [], options) {
    const { files: initialAbsoluteFilePaths, webUrls } = glob(projectPath, include, options.exclude, options);
    let filesToProcess = initialAbsoluteFilePaths;
    // --- Dynamic Exclusion based on --dst existence (for completion mode) ---
    if (options.dst && options.mode === E_Mode.COMPLETION && filesToProcess.length > 0) {
        const filesToKeepAfterDstCheck = [];
        for (const absoluteSrcFilePath of filesToProcess) {
            // No need to check fileObj.path, as these are already absolute string paths
            const fileSpecificVars = sourceVariables(absoluteSrcFilePath, projectPath);
            const fullVarsForDst = {
                ...options.variables, // Global variables from complete_options
                ...fileSpecificVars, // File-specific variables
                MODEL: options.model ? path.parse(options.model).name : 'unknown_model',
                ROUTER: options.router || 'unknown_router'
            };
            const potentialDstPath = path.resolve(resolvePath(options.dst, false, fullVarsForDst));
            if (exists(potentialDstPath) && options.append !== 'replace') {
                options.logger?.info(`Skipping source file ${path.relative(projectPath, absoluteSrcFilePath)} as output ${potentialDstPath} already exists.`);
            }
            else {
                filesToKeepAfterDstCheck.push(absoluteSrcFilePath);
            }
        }
        filesToProcess = filesToKeepAfterDstCheck;
    }
    // --- End Dynamic Exclusion ---
    // Process file contents from the final list of files
    const fileResults = filesToProcess.map((fullPath) => {
        try {
            const relativePath = forward_slash(path.relative(projectPath, fullPath)); // This is correct for mime handlers and message construction
            if (isFile(fullPath) && exists(fullPath)) {
                const mimeType = lookup(fullPath) || 'text/plain'; // Use fullPath for lookup
                const handler = defaultMimeRegistry.getHandler(mimeType);
                if (handler) {
                    return handler.handle(fullPath, relativePath); // Pass absolute and relative paths to handler
                }
                // Fallback for text/* if specific handler not found
                return defaultMimeRegistry.getHandler('text/*')?.handle(fullPath, relativePath) || null;
            }
            return null;
        }
        catch (error) {
            logger.error(`Error reading file ${fullPath}:`, error);
            return null;
        }
    });
    // Reinstantiate web URL processing
    const webUrlPromises = Array.from(webUrls).map(async (url) => {
        try {
            return await handleWebUrl(url);
        }
        catch (error) {
            logger.error(`Error processing web URL ${url}:`, error);
            return null;
        }
    });
    const webResults = await Promise.all(webUrlPromises);
    // Combine and filter results
    const results = [...fileResults, ...webResults].filter((r) => r !== null);
    return results;
}
export async function vectorize(file, options) {
    if (!options.client) {
        throw new Error('OpenAI client is required for vectorization');
    }
    const ext = path.extname(file).toLowerCase();
    if (!(ext in supported)) {
        throw new Error(`Unsupported file format: ${ext}. Supported formats: ${Object.keys(supported).join(', ')}`);
    }
    try {
        // Create a vector store
        const vectorStore = await options.client.vectorStores.create({
            name: path.basename(file)
        });
        // Upload file to vector store
        const fileStream = fs.createReadStream(file);
        await options.client.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
            files: [fileStream]
        });
        // Create meta file path by appending .meta.json to the original file path
        const metaPath = `${file}.meta.json`;
        const metaData = {
            vectorStoreId: vectorStore.id,
            vectorizedAt: new Date().toISOString(),
            originalPath: file,
            mimeType: supported[ext]
        };
        // Write meta data to file
        fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
        return vectorStore.id;
    }
    catch (error) {
        logger.error(`Failed to vectorize file ${file}:`, error);
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NvdXJjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLFdBQVcsQ0FBQTtBQUNqQyxPQUFPLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQUM3QixPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBLENBQUMsNkJBQTZCO0FBQ2xGLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE9BQU8sSUFBSSxXQUFXLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQSxDQUFDLG1EQUFtRDtBQUNySSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBQ25DLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDbkMsT0FBTyxFQUFFLG1CQUFtQixFQUFrQixNQUFNLG9CQUFvQixDQUFBO0FBR3hFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQTtBQUN2RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBQ3hDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUEsQ0FBQywyQkFBMkI7QUFDNUQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGdCQUFnQixDQUFBLENBQUMsK0JBQStCO0FBQ2hGLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQSxDQUFDLDhCQUE4QjtBQUV2RTs7O0dBR0c7QUFFSCxtQ0FBbUM7QUFDbkMsZ0NBQWdDO0FBQ2hDLGtFQUFrRTtBQUVsRSxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQVcsRUFBRTtJQUN6RSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxZ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