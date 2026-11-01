import OpenAI from 'openai';
import { IKBotTask } from '../ai-tools/index.js';
export declare const runResponses: (client: OpenAI, params: any, options: IKBotTask) => Promise<any>;
