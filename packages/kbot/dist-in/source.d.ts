import { IHandlerResult } from './mime-handlers.js';
import { ChatCompletionContentPartImage } from 'openai/resources/index.mjs';
import { IKBotTask } from './ai-tools/index.js';
/**
 * @todos
 * - add support for vector stores : https://platform.openai.com/docs/assistants/tools/file-search?lang=node.js
 */
export declare const isPathOutsideSafe: (pathA: string, pathB: string) => boolean;
export declare const base64: (filePath: string) => string | null;
export declare const images: (files: string[]) => ChatCompletionContentPartImage[];
export declare function get(projectPath: string, // This is already an absolute path from processRun/complete_messages
include: string[], options: IKBotTask): Promise<Array<IHandlerResult>>;
export declare function vectorize(file: string, options: IKBotTask): Promise<string>;
