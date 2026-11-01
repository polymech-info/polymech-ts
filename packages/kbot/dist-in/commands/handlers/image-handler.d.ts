import { BaseHandler } from './base-handler.js';
import { IKBotOptions } from '../../zod_types.js';
export declare const getImageType: (filePath: string | Buffer) => {
    fileName: string;
    mimeType: string;
};
export declare class ImageHandler extends BaseHandler {
    private options;
    constructor(options: IKBotOptions);
    canHandle(content: Buffer | string, isPath: boolean): Promise<boolean>;
    handle(content: Buffer | string, isPath: boolean): Promise<string>;
}
