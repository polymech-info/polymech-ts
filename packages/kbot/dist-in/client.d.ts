import OpenAI from 'openai';
import { IKBotOptions } from './zod_types.js';
export declare const createClient: (options: IKBotOptions) => OpenAI;
