import { IKBotOptions } from "../zod_types.js";
export declare const createImage: (prompt: string, options: IKBotOptions) => Promise<Buffer | null>;
export declare const editImage: (prompt: string, imagePaths: string[], options: IKBotOptions) => Promise<Buffer | null>;
