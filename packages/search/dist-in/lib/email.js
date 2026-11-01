import { logger } from '../index.js';
import pMap from 'p-map';
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { htmlToText } from "html-to-text";
import { MappingDocumentTransformer, Document } from "@langchain/core/documents";
import { isValidUrl } from './html.js';
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const mailtoRegex = /^mailto:([^\s@]+@[^\s@]+\.[^\s@]+)$/i;
import { PuppeteerWebBaseLoader as loader, getBrowser } from './pupeteer.js';
export class HtmlToTextTransformer extends MappingDocumentTransformer {
    static lc_name() {
        return "HtmlToTextTransformer";
    }
    constructor(options = {}) {
        super(options);
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: options
        });
    }
    async _transformDocument(document) {
        const extractedContent = htmlToText(document.pageContent, this['options']);
        return new Document({
            pageContent: extractedContent,
            metadata: { ...document.metadata },
        });
    }
}
export const cheerioLoader = async (url) => {
    const loader = new CheerioWebBaseLoader(url);
    const docs = await loader.load();
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("html");
    const transformer = new HtmlToTextTransformer();
    const sequence = splitter.pipe(transformer);
    const ret = await sequence.invoke(docs);
    return ret;
};
export const puppeteerLoader = async (url, headless, location, checkCancelled) => {
    if (isValidUrl(url) === false || url.indexOf('mailto') !== -1) {
        return [];
    }
    if (checkCancelled && await checkCancelled()) {
        logger.info('Cancelled before loading ' + url);
        return [];
    }
    let loaderWithOptions;
    try { // Function to detect a valid URL
        loaderWithOptions = new loader(url, {
            launchOptions: {
                headless,
                ignoreHTTPSErrors: true
            },
            gotoOptions: {
                timeout: location.pageTimeout || 15000,
                waitUntil: "networkidle0",
            },
            async evaluate(page, browser) {
                if (checkCancelled && await checkCancelled()) {
                    const pid = browser.process()?.pid;
                    logger.warn(`Cancellation requested inside evaluate for process ${pid}`);
                    // Do not close browser, it is shared. Page will be closed by finally block in pupeteer.ts
                    throw new Error('CancelledByUser');
                }
                const result = await page.evaluate(() => document.body.innerHTML);
                // await browser.close()
                return result;
            }
        });
        // Race load against cancellation
        let isFinished = false;
        const loadPromise = loaderWithOptions.load().finally(() => {
            isFinished = true;
        });
        const cancelPromise = new Promise(async (_, reject) => {
            if (!checkCancelled)
                return;
            // Poll for cancellation
            while (!isFinished) {
                await new Promise(r => setTimeout(r, 1000));
                if (await checkCancelled()) {
                    const browser = await getBrowser();
                    if (browser) {
                        const pid = browser.process()?.pid;
                        logger.info(`Cancellation confirmed for process ${pid}`);
                    }
                    reject(new Error('CancelledByUser'));
                    break;
                }
            }
        });
        const docs = await Promise.race([loadPromise, cancelPromise]);
        const splitter = RecursiveCharacterTextSplitter.fromLanguage("html");
        const transformer = new HtmlToTextTransformer();
        const sequence = splitter.pipe(transformer);
        const ret = await sequence.invoke(docs);
        return ret;
    }
    catch (error) {
        if (error instanceof Error && error.message === 'CancelledByUser') {
            throw error;
        }
        logger.warn('Error loading page: ' + url, error instanceof Error ? error.message : String(error));
        location.rejected = true;
        // loader.browser && loader.browser.close()
        return [];
    }
};
const extractEmailAddresses = (text) => {
    const lines = text.split(/\r?\n/);
    const emailAddresses = [];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'];
    for (const line of lines) {
        const matches = line.match(emailRegex);
        if (matches) {
            for (const match of matches) {
                // Filter out image filenames often found in srcset (e.g. image@2x.png)
                const lowerMatch = match.toLowerCase();
                const isImage = imageExtensions.some(ext => lowerMatch.endsWith(ext));
                if (!isImage) {
                    emailAddresses.push(match);
                }
            }
        }
    }
    return emailAddresses;
};
export const findEMail = async (question, url, opts, location) => {
    // for some weird reason only the user knows :)
    if (url.match(emailRegex) || url.match(mailtoRegex) || url.indexOf('mailto') !== -1) {
        logger.warn('Email found in URL', url);
        return false;
    }
    let pageUrl = url;
    let docs = await puppeteerLoader(pageUrl, opts.headless, { ...location, pageTimeout: opts.pageTimeout }, opts.checkCancelled);
    let emails = [];
    docs.forEach((d) => {
        if (d.pageContent && d.pageContent.indexOf('@') !== -1) {
            const mails = extractEmailAddresses(d.pageContent);
            if (mails) {
                emails.push(...mails);
            }
        }
    });
    emails = [...new Set(emails)];
    location.emails = emails;
    if (emails.length) {
        location.email = emails[0];
    }
    location.email && logger.debug(`Found email for ${url} / ${location.title} : ${location.type} : ${location.email} : ${opts.searchFrom}`);
    return emails;
};
export const findEmailEach = async (location, opts, onProgress) => {
    if (!location.meta || !location.meta.pages) {
        return [];
    }
    const emails = [];
    const abortAfter = opts.abortAfter ?? 1;
    const concurrency = opts.concurrency || 2;
    const maxPages = opts.maxPages || 15;
    const contactKeywords = ['contact', 'kontakt', 'contacto', 'contatto', 'info', 'imprint', 'impressum', 'help', 'support', 'about'];
    // Sort pages: prioritize contact pages
    const pagesToSearch = location.meta.pages.sort((a, b) => {
        const urlA = a.url.toLowerCase();
        const urlB = b.url.toLowerCase();
        const scoreA = contactKeywords.some(k => urlA.includes(k)) ? 1 : 0;
        const scoreB = contactKeywords.some(k => urlB.includes(k)) ? 1 : 0;
        return scoreB - scoreA; // Descending order (contact pages first)
    }).slice(0, maxPages);
    await pMap(pagesToSearch, async (page) => {
        logger.debug(`[findEmailEach] Processing page: ${page.url}`);
        if (opts.checkCancelled && await opts.checkCancelled()) {
            logger.info(`[findEmailEach] Cancellation requested for ${location.title}`);
            return;
        }
        if (emails.length >= abortAfter) {
            return;
        }
        if (page.status !== 'PENDING') {
            return;
        }
        page.status = 'SEARCHING_EMAIL';
        try {
            const pageEmails = await findEMail('find email', page.url, opts, location);
            if (pageEmails && Array.isArray(pageEmails)) {
                emails.push(...pageEmails);
            }
            page.status = 'SEARCHED_EMAIL';
            logger.debug(`[findEmailEach] Finished page: ${page.url}`);
        }
        catch (error) {
            if (error.message === 'CancelledByUser') {
                throw error;
            }
            page.status = 'FAILED';
            page.error = error.message;
            logger.error(`Error scraping email from ${page.url}:`, error);
        }
        if (onProgress) {
            logger.info(`[findEmailEach] Progress for ${location.title}`);
            await onProgress(page);
        }
    }, { concurrency, stopOnError: false });
    // Update location emails
    if (emails.length > 0) {
        const uniqueEmails = [...new Set([...(location.emails || []), ...emails])];
        location.emails = uniqueEmails;
        if (uniqueEmails.length > 0) {
            location.email = uniqueEmails[0];
        }
    }
    return emails;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2VtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHdDQUF3QyxDQUFBO0FBQzdFLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxNQUFNLHlCQUF5QixDQUFBO0FBQ3hFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxjQUFjLENBQUE7QUFDekMsT0FBTyxFQUFFLDBCQUEwQixFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBRWhGLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFFdEMsTUFBTSxVQUFVLEdBQUcsaURBQWlELENBQUE7QUFDcEUsTUFBTSxXQUFXLEdBQUcsc0NBQXNDLENBQUE7QUFFMUQsT0FBTyxFQUFFLHNCQUFzQixJQUFJLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFNUUsTUFBTSxPQUFPLHFCQUFzQixTQUFRLDBCQUEwQjtJQUNqRSxNQUFNLENBQUMsT0FBTztRQUNWLE9BQU8sdUJBQXVCLENBQUE7SUFDbEMsQ0FBQztJQUNELFlBQVksT0FBTyxHQUFHLEVBQUU7UUFDcEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ25DLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsS0FBSyxFQUFFLE9BQU87U0FDakIsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUNELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFrQjtRQUN2QyxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxR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