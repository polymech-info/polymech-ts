import { ChatCompletionUserMessageParam } from 'openai/resources/index.mjs';
export type IHandlerResult = ChatCompletionUserMessageParam & {
    path?: string;
};
export interface IMimeHandler {
    handle(filePath: string, relativePath: string): IHandlerResult;
}
export declare class ImageHandler implements IMimeHandler {
    handle(filePath: string, relativePath: string): IHandlerResult;
}
export declare class PDFHandler implements IMimeHandler {
    handle(filePath: string, relativePath: string): IHandlerResult;
}
export declare class TextHandler implements IMimeHandler {
    handle(filePath: string, relativePath: string): IHandlerResult;
}
export declare class MimeHandlerRegistry {
    private handlers;
    registerHandler(mimeType: string, handler: IMimeHandler): void;
    getHandler(mimeType: string): IMimeHandler | null;
}
export declare const defaultMimeRegistry: MimeHandlerRegistry;
