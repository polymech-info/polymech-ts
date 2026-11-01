import { IKBotTask } from './ai-tools/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
export declare const prompt: (opts: IKBotTask) => Promise<ChatCompletionMessageParam | undefined>;
export declare const preferences: (opts: IKBotTask) => Promise<ChatCompletionMessageParam | undefined>;
