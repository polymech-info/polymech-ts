import { IHandlerResult } from './mime-handlers.js';
/**
 * Process HTML content into markdown
 */
export declare function processHtml(html: string): string;
/**
 * Fetch web content with caching
 */
export declare function fetchUrl(url: string): Promise<{
    content: string;
    contentType: string;
    isProcessed: boolean;
}>;
/**
 * Handle a web URL and return it in a format compatible with the get() function
 */
export declare function handleWebUrl(url: string): Promise<IHandlerResult>;
