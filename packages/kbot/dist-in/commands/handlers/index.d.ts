import { IHandler } from './base-handler.js';
import { IKBotOptions } from '../../zod_types.js';
export declare function createHandlers(options: IKBotOptions): IHandler[];
export declare function detectAndHandle(content: Buffer | string, options: IKBotOptions): Promise<string>;
