import puppeteer from 'puppeteer';
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "langchain/document_loaders/base";
import pLimit from "p-limit";
/**
 * Class that extends the BaseDocumentLoader class and implements the
 * DocumentLoader interface. It represents a document loader for scraping
 * web pages using Puppeteer.
 * @example
 * ```typescript
 * const loader = new PuppeteerWebBaseLoader("https:exampleurl.com", {
 *   launchOptions: {
 *     headless: true,
 *   },
 *   gotoOptions: {
 *     waitUntil: "domcontentloaded",
 *   },
 * });
 * const screenshot = await loader.screenshot();
 * ```
 */
import { logger } from '../index.js';
// Singleton browser promise to prevent race conditions
let browserPromise = null;
let idleTimer = null;
const limit = pLimit(parseInt(process.env.EMAIL_SEARCH_MAX_PUPETEER_PAGES || '10'));
const IDLE_TIMEOUT_SECONDS = parseInt(process.env.EMAIL_SEARCH_PUPETEER_IDLE_TIMEOUT_SECONDS || '60');
const resetIdleTimer = () => {
    if (idleTimer)
        clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
        if (browserPromise) {
            logger.info(`[Puppeteer] Browser idle timeout (${IDLE_TIMEOUT_SECONDS}s) reached, closing browser`);
            const browser = await browserPromise;
            await browser.close();
            browserPromise = null;
        }
    }, IDLE_TIMEOUT_SECONDS * 1000);
};
const launchBrowser = async (options) => {
    resetIdleTimer();
    if (browserPromise)
        return browserPromise;
    logger.info('[Puppeteer] Launching browser...');
    browserPromise = (async () => {
        try {
            // Static import used above
            logger.debug('[Puppeteer] Imports resolved. Starting launch...');
            const { launch } = puppeteer;
            const headlessEnv = process.env.EMAIL_SEARCH_HEADLESS;
            // Use 'new' for headless:true to avoid deprecation warning. Respect 'false' for debugging.
            const headlessMode = headlessEnv === 'false' ? false : 'new';
            // Wrap launch in a timeout to prevent infinite hangs
            const launchPromise = launch({
                headless: headlessMode, // Use user config or default to 'new'
                defaultViewport: null,
                args: ['--no-sandbox', '--disable-setuid-sandbox'], // CRITICAL: Prevent OS-level hangs
                ignoreDefaultArgs: ["--disable-extensions"],
                ...options?.launchOptions,
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Browser Launch Timeout (30s)')), 30000));
            const b = await Promise.race([launchPromise, timeoutPromise]);
            logger.info('[Puppeteer] Browser launched successfully');
            return b;
        }
        catch (e) {
            logger.error('[Puppeteer] Failed to launch browser', e);
            browserPromise = null; // CRITICAL: Reset promise so next attempt can retry
            throw e;
        }
    })();
    return browserPromise;
};
export const getBrowser = () => browserPromise;
export const getPage = async (browser) => {
    // Always create a new page for concurrency
    logger.debug('[Puppeteer] Creating new page');
    const page = await browser.newPage();
    logger.debug('[Puppeteer] New page created');
    return page;
};
export class PuppeteerWebBaseLoader extends BaseDocumentLoader {
    webPath;
    options;
    constructor(webPath, options) {
        super();
        this.webPath = webPath;
        this.options = options ?? undefined;
    }
    static browser;
    static async _scrape(url, options) {
        const browser = await launchBrowser(options);
        // PuppeteerWebBaseLoader.browser = browser // Static property usage is deprecated/incorrect with this pattern
        return limit(async () => {
            logger.debug(`[Puppeteer] Entering limit (Active: ${limit.activeCount}, Pending: ${limit.pendingCount}) for ${url}`);
            try {
                const page = await getPage(browser);
                try {
                    logger.debug(`[Puppeteer] Navigating to ${url}`);
                    await page.goto(url, {
                        timeout: 5000,
                        waitUntil: "domcontentloaded",
                        ...options?.gotoOptions,
                    });
                    logger.debug(`[Puppeteer] Navigated to ${url}, evaluating...`);
                    const bodyHTML = options?.evaluate
                        ? await options?.evaluate(page, browser)
                        : await page.evaluate(() => document.body.innerHTML);
                    logger.debug(`[Puppeteer] Evaluated ${url}`);
                    return bodyHTML;
                }
                finally {
                    await page.close();
                }
            }
            finally {
                logger.debug(`[Puppeteer] Exiting limit (Active: ${limit.activeCount}, Pending: ${limit.pendingCount}) for ${url}`);
                resetIdleTimer();
            }
        });
    }
    /**
     * Method that calls the _scrape method to perform the scraping of the web
     * page specified by the webPath property.
     * @returns Promise that resolves to the scraped HTML content of the web page.
     */
    async scrape() {
        return PuppeteerWebBaseLoader._scrape(this.webPath, this.options);
    }
    /**
     * Method that calls the scrape method and returns the scraped HTML
     * content as a Document object.
     * @returns Promise that resolves to an array of Document objects.
     */
    async load() {
        const text = await this.scrape();
        const metadata = { source: this.webPath };
        return [new Document({ pageContent: text, metadata })];
    }
    /**
     * Static class method used to screenshot a web page and return
     * it as a {@link Document} object where  the pageContent property
     * is the screenshot encoded in base64.
     *
     * @param {string} url
     * @param {PuppeteerWebBaseLoaderOptions} options
     * @returns {Document} A document object containing the screenshot of the page encoded in base64.
     */
    static async _screenshot(url, options) {
        const { launch } = puppeteer;
        const browser = await launch({
            headless: "new",
            defaultViewport: null,
            args: ["--no-screenshot"],
            ignoreDefaultArgs: ["--disable-extensions"],
            ...options?.launchOptions,
        });
        const page = await browser.newPage();
        await page.goto(url, {
            timeout: 180000,
            waitUntil: "domcontentloaded",
            ...options?.gotoOptions,
        });
        const screenshot = await page.screenshot();
        const base64 = screenshot.toString();
        const metadata = { source: url };
        return new Document({ pageContent: base64, metadata });
    }
    /**
     * Screenshot a web page and return it as a {@link Document} object where
     * the pageContent property is the screenshot encoded in base64.
     *
     * @returns {Promise<Document>} A document object containing the screenshot of the page encoded in base64.
     */
    async screenshot() {
        return PuppeteerWebBaseLoader._screenshot(this.webPath, this.options);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVwZXRlZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3B1cGV0ZWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU1BLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUVsQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDcEQsT0FBTyxFQUFFLGtCQUFrQixFQUFrQixNQUFNLGlDQUFpQyxDQUFBO0FBQ3BGLE9BQU8sTUFBTSxNQUFNLFNBQVMsQ0FBQTtBQXdCNUI7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBRXBDLHVEQUF1RDtBQUN2RCxJQUFJLGNBQWMsR0FBNEIsSUFBSSxDQUFDO0FBQ25ELElBQUksU0FBUyxHQUEwQixJQUFJLENBQUM7QUFDNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDbkYsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUV0RyxNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUU7SUFDMUIsSUFBSSxTQUFTO1FBQUUsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEMsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxvQkFBb0IsNkJBQTZCLENBQUMsQ0FBQztZQUNwRyxNQUFNLE9BQU8sR0FBRyxNQUFNLGNBQWMsQ0FBQztZQUNyQyxNQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN0QixjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLENBQUM7SUFDSCxDQUFD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