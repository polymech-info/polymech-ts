import OpenAI from 'openai';
import { IKBotTask } from '../ai-tools/index.js';
export declare const supported: Record<string, string>;
export declare const createOpenAIFile: (client: OpenAI, filePath: string, purpose?: string) => Promise<OpenAI.Files.FileObject & {
    _request_id?: string | null;
}>;
export declare const runAssistant: (client: OpenAI, params: any, options: IKBotTask) => Promise<any>;
