import { MappingDocumentTransformer, Document } from "@langchain/core/documents";
import { LocalResult, Page } from './map_types.js';
export declare class HtmlToTextTransformer extends MappingDocumentTransformer {
    static lc_name(): string;
    constructor(options?: {});
    _transformDocument(document: Document): Promise<Document<{
        [x: string]: any;
    }>>;
}
export declare const cheerioLoader: (url: string) => Promise<unknown>;
export declare const puppeteerLoader: (url: string, headless: boolean, location: LocalResult, checkCancelled?: () => Promise<boolean>) => Promise<unknown>;
export declare const findEMail: (question: string, url: string, opts: {
    headless?: boolean;
    searchFrom?: string;
    [key: string]: any;
}, location: LocalResult) => Promise<false | string[]>;
export declare const findEmailEach: (location: LocalResult, opts: {
    headless?: boolean;
    searchFrom?: string;
    abortAfter?: number;
    checkCancelled?: () => Promise<boolean>;
    [key: string]: any;
}, onProgress?: (page: Page) => Promise<void>) => Promise<string[]>;
