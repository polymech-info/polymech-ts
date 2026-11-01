import { IKBotOptions } from '../zod_types.js';
export declare const readStdin: (timeoutMs?: number) => Promise<Buffer>;
export declare const resolveQuery: (options: IKBotOptions) => Promise<string>;
