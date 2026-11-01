import type { WaitForOptions, Page, Browser } from "puppeteer";
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader, DocumentLoader } from "langchain/document_loaders/base";
export { Page, Browser };
export type PuppeteerGotoOptions = WaitForOptions & {
    referer?: string;
    referrerPolicy?: string;
};
/**
 * Type representing a function for evaluating JavaScript code on a web
 * page using Puppeteer. It takes a Page and Browser object as parameters
 * and returns a Promise that resolves to a string.
 */
export type PuppeteerEvaluate = (page: Page, browser: Browser) => Promise<string>;
export type PuppeteerWebBaseLoaderOptions = {
    launchOptions?: any;
    gotoOptions?: PuppeteerGotoOptions;
    evaluate?: PuppeteerEvaluate;
};
export declare const getBrowser: () => Promise<Browser>;
export declare const getPage: (browser: Browser) => Promise<Page>;
export declare class PuppeteerWebBaseLoader extends BaseDocumentLoader implements DocumentLoader {
    webPath: string;
    options: PuppeteerWebBaseLoaderOptions | undefined;
    constructor(webPath: string, options?: PuppeteerWebBaseLoaderOptions);
    static browser: Browser;
    static _scrape(url: string, options?: PuppeteerWebBaseLoaderOptions): Promise<string>;
    /**
     * Method that calls the _scrape method to perform the scraping of the web
     * page specified by the webPath property.
     * @returns Promise that resolves to the scraped HTML content of the web page.
     */
    scrape(): Promise<string>;
    /**
     * Method that calls the scrape method and returns the scraped HTML
     * content as a Document object.
     * @returns Promise that resolves to an array of Document objects.
     */
    load(): Promise<Document[]>;
    /**
     * Static class method used to screenshot a web page and return
     * it as a {@link Document} object where  the pageContent property
     * is the screenshot encoded in base64.
     *
     * @param {string} url
     * @param {PuppeteerWebBaseLoaderOptions} options
     * @returns {Document} A document object containing the screenshot of the page encoded in base64.
     */
    static _screenshot(url: string, options?: PuppeteerWebBaseLoaderOptions): Promise<Document>;
    /**
     * Screenshot a web page and return it as a {@link Document} object where
     * the pageContent property is the screenshot encoded in base64.
     *
     * @returns {Promise<Document>} A document object containing the screenshot of the page encoded in base64.
     */
    screenshot(): Promise<Document>;
}
