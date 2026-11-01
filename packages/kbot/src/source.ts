import * as path from 'node:path'
import * as fs from 'node:fs'
import { sync as exists } from '@polymech/fs/exists' // Still needed for vectorize
import { isFile, forward_slash, resolve as resolvePath } from '@polymech/commons' // Renamed resolve to resolvePath to avoid conflict
import { logger } from './index.js'
import { lookup } from 'mime-types'
import { defaultMimeRegistry, IHandlerResult } from './mime-handlers.js'
import { ChatCompletionContentPartImage } from 'openai/resources/index.mjs'
import { IKBotTask } from './ai-tools/index.js'
import { supported } from './commands/run-assistant.js'
import { handleWebUrl } from './http.js'
import { glob } from './glob.js' // Import glob from glob.ts
import { sourceVariables } from './variables.js' // Import for dynamic exclusion
import { E_Mode } from './zod_schema.js' // Import E_Mode for the check

/**
 * @todos
 * - add support for vector stores : https://platform.openai.com/docs/assistants/tools/file-search?lang=node.js
 */

// default_filters moved to glob.ts
// isPathInside moved to glob.ts
// isWebUrl moved to glob.ts (or handled by handleWebUrl directly)

export const isPathOutsideSafe = (pathA: string, pathB: string): boolean => {
  const realA = fs.realpathSync(pathA);
  const realB = fs.realpathSync(pathB);
  // Assuming isPathInside was a local helper, if it's broadly used, it should be in commons or imported
  // For now, this might break if isPathInside is not accessible. 
  // Let's assume for now it was only for the old glob. If not, this needs to be addressed.
  const relation = path.relative(realB, realA); // Corrected order for typical usage
  return Boolean(
    relation &&
    !relation.startsWith('..') &&
    !relation.startsWith('..' + path.sep)
  );
};

export const base64 = (filePath: string): string | null => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = lookup(filePath);
    if (!mimeType) {
      throw new Error('Unable to determine MIME type.');
    }
    const base64Data = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    logger.error('fileToBase64 : Error reading file:', error);
    return null;
  }
};

export const images = (files: string[]): ChatCompletionContentPartImage[] => {
  return files.map((f) => ({
    type: "image_url",
    image_url: { url: base64(f) }
  }))
}

// glob function definition removed from here

export async function get(
  projectPath: string, // This is already an absolute path from processRun/complete_messages
  include: string[] = [],
  options: IKBotTask
): Promise<Array<IHandlerResult>> {
  const { files: initialAbsoluteFilePaths, webUrls } = glob(projectPath, include, options.exclude, options)
  
  let filesToProcess = initialAbsoluteFilePaths;

  // --- Dynamic Exclusion based on --dst existence (for completion mode) ---
  if (options.dst && options.mode === E_Mode.COMPLETION && filesToProcess.length > 0) {
    const filesToKeepAfterDstCheck = [];
    for (const absoluteSrcFilePath of filesToProcess) {
      // No need to check fileObj.path, as these are already absolute string paths
      const fileSpecificVars = sourceVariables(absoluteSrcFilePath, projectPath)      
      const fullVarsForDst = { 
        ...options.variables, // Global variables from complete_options
        ...fileSpecificVars,  // File-specific variables
        MODEL: options.model ? path.parse(options.model).name : 'unknown_model',
        ROUTER: options.router || 'unknown_router'
      }
      const potentialDstPath = path.resolve(resolvePath(options.dst, false, fullVarsForDst));
      if (exists(potentialDstPath) && options.append !== 'replace') {
        options.logger?.info(`Skipping source file ${path.relative(projectPath, absoluteSrcFilePath)} as output ${potentialDstPath} already exists.`);
      } else {
        filesToKeepAfterDstCheck.push(absoluteSrcFilePath);
      }
    }
    filesToProcess = filesToKeepAfterDstCheck;
  }
  // --- End Dynamic Exclusion ---
  
  // Process file contents from the final list of files
  const fileResults = filesToProcess.map((fullPath) => { // fullPath is an absolute path
    try {
      const relativePath = forward_slash(path.relative(projectPath, fullPath)) // This is correct for mime handlers and message construction
      if (isFile(fullPath) && exists(fullPath)) {
        const mimeType = lookup(fullPath) || 'text/plain' // Use fullPath for lookup
        const handler = defaultMimeRegistry.getHandler(mimeType)
        if (handler) {
          return handler.handle(fullPath, relativePath) // Pass absolute and relative paths to handler
        }
        // Fallback for text/* if specific handler not found
        return defaultMimeRegistry.getHandler('text/*')?.handle(fullPath, relativePath) || null
      }
      return null
    } catch (error) {
      logger.error(`Error reading file ${fullPath}:`, error)
      return null
    }
  })

  // Reinstantiate web URL processing
  const webUrlPromises = Array.from(webUrls).map(async (url: string) => {
    try {
      return await handleWebUrl(url);
    } catch (error) {
      logger.error(`Error processing web URL ${url}:`, error);
      return null;
    }
  });

  const webResults = await Promise.all(webUrlPromises);
  
  // Combine and filter results
  const results = [...fileResults, ...webResults].filter((r) => r !== null);
  return results;
}

export async function vectorize(file: string, options: IKBotTask): Promise<string> {
  if (!options.client) {
    throw new Error('OpenAI client is required for vectorization')
  }

  const ext = path.extname(file).toLowerCase()
  if (!(ext in supported)) {
    throw new Error(`Unsupported file format: ${ext}. Supported formats: ${Object.keys(supported).join(', ')}`)
  }

  try {
    // Create a vector store
    const vectorStore = await options.client.vectorStores.create({
      name: path.basename(file)
    })

    // Upload file to vector store
    const fileStream = fs.createReadStream(file)
    await options.client.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
      files: [fileStream]
    })

    // Create meta file path by appending .meta.json to the original file path
    const metaPath = `${file}.meta.json`
    const metaData = {
      vectorStoreId: vectorStore.id,
      vectorizedAt: new Date().toISOString(),
      originalPath: file,
      mimeType: supported[ext]
    }

    // Write meta data to file
    fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2))

    return vectorStore.id
  } catch (error) {
    logger.error(`Failed to vectorize file ${file}:`, error)
    throw error
  }
}