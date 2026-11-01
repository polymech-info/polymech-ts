import OpenAI from 'openai';
import { ICollector } from './ai-tools/index.js';
import { IKBotOptions } from './zod_types.js';
export declare const collector: (options: IKBotOptions, client: OpenAI) => ICollector;
