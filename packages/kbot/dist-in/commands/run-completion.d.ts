import OpenAI from 'openai';
import { IKBotTask } from '../ai-tools/index.js';
export declare const onCompletion: (result: any, options: IKBotTask) => Promise<any>;
export declare const runCompletion: (client: OpenAI, params: any, options: IKBotTask) => Promise<string | false>;
