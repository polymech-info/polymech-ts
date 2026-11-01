import { logger } from '../../index.js';
import * as path from 'path';
import { Actor } from 'apify';
import { PuppeteerCrawler } from 'crawlee';
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/read';
import { sync as dir } from '@polymech/fs/dir';
import { sync as exists } from '@polymech/fs/exists';
import slugify from "slugify";
import * as download from 'download';
import pMap from 'p-map';
import { URL } from 'url';
import normalizeUrl from 'normalize-url';
import { sanitizeFilename as _sanitize } from '@polymech/fs/utils';
import filenamify from 'filenamify';
import { Md5 } from 'ts-md5';
const sanitize_ex = (f) => {
    let str = filenamify.default(_sanitize(f)).replace(/[^\x00-\x7F]/g, "");
    return str;
};
const topicFolder = (title, dst, prefix, suffix = '') => {
    dst = path.resolve(dst);
    if (!exists(dst)) {
        dir(dst);
    }
    const name = sanitize_ex(slugify.default(title));
    const folder = path.resolve(path.join(dst, prefix, name, suffix));
    if (!exists(folder)) {
        dir(folder);
    }
    return folder;
};
async function downloadFiles(dst, urls) {
    return pMap(urls, async (i) => {
        if (!i || !i.substring) {
            return false;
        }
        const parsed = new URL(i);
        const parts = path.parse(parsed.pathname);
        let name = decodeURI(parts.name);
        if (name.length > 20) {
            name = Md5.hashStr(name);
        }
        const filename = sanitize_ex(name + parts.ext);
        const image_ex = path.resolve(`${dst}/${filename}`);
        if (!exists(image_ex)) {
            try {
                console.log(`download file ` + normalizeUrl(i));
                const reu = parsed.origin + parsed.pathname;
                return download(reu, dst, {
                    filename
                });
            }
            catch (e) {
                logger.error('error download step image', e);
            }
        }
    }, { concurrency: 1 });
}
export async function crawler(url = 'https://davehakkens.nl/community/forums/forum/precious-plastic/general/', dst, prefix, options = {}) {
    // Initialize Actor and open request queue
    await Actor.init();
    const requestQueue = await Actor.openRequestQueue();
    await requestQueue.addRequest({ url: url });
    // Create an instance of the PuppeteerCrawler class - a crawler
    // that automatically loads the URLs in headless Chrome / Puppeteer.
    const crawler = new PuppeteerCrawler({
        requestQueue,
        // Here you can set options that are passed to the launchPuppeteer() function.
        launchContext: {
            launchOptions: {
                headless: true,
                devtools: true
            }
        },
        // Stop crawling after several pages
        maxRequestsPerCrawl: 50000,
        maxConcurrency: 2,
        // This function will be called for each URL to crawl.
        // Here you can write the Puppeteer scripts you are familiar with,
        // with the exception that browsers and pages are automatically managed by the Apify SDK.
        // The function accepts a single parameter, which is an object with the following fields:
        // - request: an instance of the Request class with information such as URL and HTTP method
        // - page: Puppeteer's Page object (see https://pptr.dev/#show=api-class-page)
        handlePageFunction: async ({ request, page }) => {
            console.log(`Processing ${request.url}`);
            const isIndexFn = () => {
                const $ = window['jQuery'];
                return $.find('.ty-product-block-title').length === 0;
            };
            const isIndex = await page.$$eval('return window', isIndexFn);
            const pageFunctionTopic = () => {
                let data = {};
                const $ = window['jQuery'];
                try {
                    data.title = $('.ty-product-block-title')[0].innerText;
                }
                catch (e) {
                    console.error('error parsing title');
                    debugger;
                }
                try {
                    data.price = $('.ty-price-num')[1].innerText;
                }
                catch (e) {
                    console.error('error parsing price');
                    debugger;
                }
                try {
                    data.storeName = $('.store-lnk')[0].innerText;
                }
                catch (e) {
                    console.error('error parsing store name');
                    debugger;
                }
                try {
                    data.storeLink = $('.store-lnk').attr('href');
                }
                catch (e) {
                    console.error('error parsing store link');
                    debugger;
                }
                try {
                    data.mediaHTML = $('.ty-product-block__img')[0].innerHTML;
                }
                catch (e) {
                    console.error('error parsing image block');
                    debugger;
                }
                try {
                    data.description = $('.content-description')[0].innerHTML;
                }
                catch (e) {
                    console.error('error parsing store description');
                    debugger;
                }
                try {
                    data.features = $('.content-features')[0].innerHTML;
                }
                catch (e) {
                    console.error('error parsing features');
                    debugger;
                }
                try {
                    data.options = $("div.ty-product-block.ty-product-detail > div > div.ty-product-block__left.ec-sticky-block > form")[0].innerHTML;
                }
                catch (e) {
                    console.error('error parsing features');
                }
                data.authorImage = $('.logo-container').find('img').attr('src');
                let images = $($('.owl-wrapper')[0]).find('.ty-pict');
                data.images = images.map((e, d) => {
                    return $(d).attr('src');
                }).toArray();
                return data;
            };
            const pageFunctionIndex = () => {
                let data = {};
                const $ = window['jQuery'];
                const jQuery = $;
                let nextPages = [];
                jQuery('.product-title').each((i, e) => {
                    nextPages.push(jQuery(e).attr("href"));
                });
                let pagination = jQuery('.ty-pagination__items');
                if (pagination && pagination.children()) {
                    let c = pagination.children();
                    for (let i = 0; i < c.length; i++) {
                        let b = $(c[i]);
                        if (b.attr("href") && b.attr("href").length) {
                            nextPages.push(b.attr("href"));
                        }
                    }
                }
                data = {
                    nextPages: [...new Set(nextPages)]
                };
                return data;
            };
            if (!isIndex) {
                const data = await page.$$eval('return window', pageFunctionTopic);
                console.log('Process Product : ', data.title);
                if (data.title === 'Sheetpress V4.x - USA and North America') {
                    //debugger;
                }
                if (!exists(dst)) {
                    dir(dst);
                }
                const folder = topicFolder(data.title, dst, prefix);
                let fileName = 'data';
                if (request.url.split('page').length == 2) {
                    fileName = fileName + "-" + parseInt(request.url.split('page')[1].replace('/', ''));
                }
                fileName = fileName + ".json";
                let dataPath = path.resolve(`${folder}/${fileName}`);
                logger.info("write to ", dataPath);
                const content = data.description;
                data.content = null;
                data.url = request.url;
                data.prefix = prefix;
                write(dataPath, data, { jsonIndent: 1 });
                write(dataPath.replace('.json', '.html'), content);
                await downloadFiles(topicFolder(data.title, dst, prefix), data.images);
                data.imagesHR = data.images.map((i, ind) => {
                    let u = new URL(i);
                    let parts = u.pathname.split('/');
                    parts[2] = '';
                    parts[3] = '';
                    parts[4] = '';
                    parts = parts.join('/');
                    u = u.protocol + '//' + u.host + '/' + parts + '';
                    return {
                        order: ind,
                        url: u
                    };
                });
                options.hq && await downloadFiles(topicFolder(data.title, dst, prefix, 'images'), data.imagesHR.map((i) => i.url));
                if (data.authorImage) {
                    await downloadFiles(path.resolve(dst + '/authors'), [data.authorImage]);
                }
                const indexPath = path.resolve(dst + "/index_bazar.json");
                let index = read(indexPath, 'json') || {};
                if (!index[data.storeName]) {
                    index[data.storeName] = {
                        url: data.storeLink,
                        products: [],
                        paths: []
                    };
                }
                if (!index[data.storeName].paths) {
                    index[data.storeName].paths = [];
                }
                if (!index[data.storeName].products.includes(data.url)) {
                    index[data.storeName].products.push(data.url);
                    index[data.storeName].paths.push(dataPath);
                }
                write(indexPath, index);
            }
            else {
                const data = await page.$$eval('return window', pageFunctionIndex);
                const content = await page.content();
                const indexPath = path.join(dst, prefix, 'index.html');
                write(indexPath, content);
                if (data.nextPages && data.nextPages.length) {
                    let q = [];
                    data.nextPages.forEach(element => {
                        if (element !== url) {
                            q.push(requestQueue.addRequest({ url: element }));
                        }
                    });
                    await Promise.all(q);
                }
                console.log('got forum index : ', data);
            }
        },
        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
            await Actor.pushData({
                url: request.url,
                retryCount: request.retryCount,
                errorMessages: request.errorMessages,
            });
        }
    });
    // Run the crawler and wait for it to finish.
    await crawler.run();
    await Actor.exit();
}
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Jhd2xlckJhemFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1hbmRzL2JhemFyL2NyYXdsZXJCYXphci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFdkMsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUE7QUFFNUIsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUM5QixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFM0MsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFDOUMsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQU1wRCxPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFDOUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxVQUFVLENBQUE7QUFDcEMsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxLQUFLLENBQUE7QUFDekIsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxnQkFBZ0IsSUFBSSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNsRSxPQUFPLFVBQVUsTUFBTSxZQUFZLENBQUE7QUFFbkMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUU3QixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3RCLElBQUksR0FBRyxHQUFXLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQTtBQUdELE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLEVBQUUsRUFBRSxFQUFFO0lBQ3BELEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNmLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7SUFDRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUUsQ0FBQyxDQUFDO0lBQ25FLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNsQixHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQTtBQUVELEtBQUssVUFBVSxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUk7SUFDbEMsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFNLEVBQUUsRUFBRTtRQUMvQixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JCLE9BQU8sS0FBSyxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUV6QyxJQUFJLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLEVBQUUsQ0FBQztZQUNuQixJQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1QixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUM1QyxPQUFPLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO29CQUN0QixRQUFRO2lCQUNYLENBQVEsQ0FBQztZQUNkLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULE1BQU0sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBRUQsTUFBTSxDQUFDLEtBQUssVUFBVSxPQUFPLENBQ3pCLE1BQWMseUVBQXlFLEVBQ3ZGLEdBQUcsRUFDSCxNQUFNLEVBQ04sVUFBZSxFQUVkO0lBRUQsMENBQTBDO0lBQzFDLE1BQU0sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ25CLE1BQU0sWUFBWSxHQUFHLE1BQU0sS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDcEQsTUFBTSxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFNUMsK0RBQStEO0lBQy9ELG9FQUFvRTtJQUNwRSxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFnQixDQUFDO1FBQ2pDLFlBQVk7UUFDWiw4RUFBOEU7UUFDOUUsYUFBYSxFQUFFO1lBQ1gsYUFBYSxFQUFFO2dCQUNYLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFFBQVEsRUFBRSxJQUFJO2FBQ2pCO1NBQ0o7UUFFRCxvQ0FBb0M7UUFDcEMsbUJBQW1CLEVBQUUsS0FBSztRQUMxQixjQUFjLEVBQUUsQ0FBQztRQUVqQixzREFBc0Q7UUFDdEQsa0VBQWtFO1FBQ2xFLHlGQUF5RjtRQUN6Rix5RkFBeUY7UUFDekYsMkZBQTJGO1FBQzNGLDhFQUE4RTtRQUU5RSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTtZQUU1QyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFFekMsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO2dCQUNuQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDMUQsQ0FBQyxDQUFBO1lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUU5RCxNQUFNLGlCQUFpQixHQUFHLEdBQUcsRUFBRTtnQkFFM0IsSUFBSSxJQUFJLEdBQVEsRUFBRSxDQUFDO2dCQUNuQixNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQztvQkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDM0QsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDckMsUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDakQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDckMsUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDbEQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztvQkFDMUMsUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDakQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztvQkFDMUMsUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUM5RCxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO29CQUMzQyxRQUFRLENBQUM7Z0JBQ2IsQ0FBQztnQkFFRCxJQUFJLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBQzlELENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7b0JBQ2pELFFBQVEsQ0FBQztnQkFDYixDQUFDO2dCQUVELElBQUksQ0FBQztvQkFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDeEQsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztvQkFDeEMsUUFBUSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLGtHQUFrRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUN0SSxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUU1QyxDQUFDO2dCQUdELElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM5QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVCLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUViLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUMsQ0FBQztZQUVGLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxFQUFFO2dCQUMzQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2pCLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNuQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBQ2pELElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUN0QyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzlCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDaEIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7NEJBQzFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNuQyxDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztnQkFDRCxJQUFJLEdBQUc7b0JBQ0gsU0FBUyxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDckMsQ0FBQTtnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDLENBQUM7WUFFRixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRVgsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2dCQUVuRSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLHlDQUF5QyxFQUFFLENBQUM7b0JBQzNELFdBQVc7Z0JBQ2YsQ0FBQztnQkFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUVwRCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUM7Z0JBQ3RCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QyxRQUFRLEdBQUcsUUFBUSxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RixDQUFDO2dCQUVELFFBQVEsR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFDO2dCQUU5QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsTUFBTSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUVuQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNqQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztnQkFDcEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDckIsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUVuRCxNQUFNLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUV2RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUN2QyxJQUFJLENBQUMsR0FBUSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDdkIsSUFBSSxLQUFLLEdBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBQ3RDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7b0JBQ2IsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtvQkFDYixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO29CQUViLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO29CQUV2QixDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQTtvQkFDakQsT0FBTzt3QkFDSCxLQUFLLEVBQUUsR0FBRzt3QkFDVixHQUFHLEVBQUUsQ0FBQztxQkFDVCxDQUFBO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQyxFQUFFLElBQUksTUFBTSxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRW5ILElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNuQixNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUM1RSxDQUFDO2dCQUdELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLG1CQUFtQixDQUFDLENBQUM7Z0JBRTFELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUN6QixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHO3dCQUNwQixHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVM7d0JBQ25CLFFBQVEsRUFBRSxFQUFFO3dCQUNaLEtBQUssRUFBRSxFQUFFO3FCQUNaLENBQUE7Z0JBQ0wsQ0FBQztnQkFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBO2dCQUNwQyxDQUFDO2dCQUVELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3JELEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBQzdDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtnQkFDOUMsQ0FBQztnQkFFRCxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTVCLENBQUM7aUJBQU0sQ0FBQztnQkFDSixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25FLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQ3RELEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ3pCLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7d0JBQzdCLElBQUksT0FBTyxLQUFLLEdBQUcsRUFBRSxDQUFDOzRCQUNsQixDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN0RCxDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNILE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsQ0FBQztnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDTCxDQUFDO1FBRUQsNkZBQTZGO1FBQzdGLDJCQUEyQixFQUFFLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7WUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLE9BQU8sQ0FBQyxHQUFHLHdCQUF3QixDQUFDLENBQUM7WUFDNUQsTUFBTSxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUNqQixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7Z0JBQ2hCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtnQkFDOUIsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO2FBQ3ZDLENBQUMsQ0FBQztRQUNQLENBQUM7S0FDSixDQUFDLENBQUM7SUFFSCw2Q0FBNkM7SUFDN0MsTUFBTSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFcEIsTUFBTSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsQ0FBQztBQUFBLENBQUMifQ==