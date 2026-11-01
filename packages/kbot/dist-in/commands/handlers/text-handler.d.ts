import { BaseHandler } from './base-handler.js';
export declare class TextHandler extends BaseHandler {
    canHandle(content: Buffer | string, isPath: boolean): Promise<boolean>;
    handle(content: Buffer | string, isPath: boolean): Promise<string>;
}
