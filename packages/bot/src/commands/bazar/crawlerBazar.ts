import { logger } from '../../index.js'

import * as path from 'path'
import * as url from 'url'
import { Actor } from 'apify';
import { PuppeteerCrawler,Configuration  } from 'crawlee';

import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'

import {  } from '@polymech/core/strings'

// v3.1 : https://docs.apify.com/sdk/js/docs/examples/puppeteer-crawler
    ;
import slugify from "slugify";
import * as download from 'download'
import pMap from 'p-map'
import { URL } from 'url'
import normalizeUrl from 'normalize-url';
import { sanitizeFilename as _sanitize } from '@polymech/fs/utils'
import filenamify from 'filenamify'
Configuration.set('systemInfoV2', true);
import { Md5 } from 'ts-md5';

const sanitize_ex = (f) => {
    let str: string = filenamify.default(_sanitize(f)).replace(/[^\x00-\x7F]/g, "");
    return str;
}


const topicFolder = (title, dst, prefix, suffix = '') => {
    dst = path.resolve(dst);
    if (!exists(dst)) {
        dir(dst);
    }
    const name = sanitize_ex(slugify.default(title))
    const folder = path.resolve(path.join(dst, prefix, name, suffix ));
    if (!exists(folder)) {
        dir(folder);
    }

    return folder;
}

async function downloadFiles(dst, urls) {
    return pMap(urls, async (i: any) => {
        if (!i || !i.substring) {
            return false;
        }

        const parsed = new URL(i);
        const parts = path.parse(parsed.pathname)

        let name = decodeURI(parts.name);
        if (name.length > 20) {
            name = Md5.hashStr(name)
        }

        const filename = sanitize_ex(name + parts.ext);
        const image_ex = path.resolve(`${dst}/${filename}`);
        if (!exists(image_ex)) {
            try {
                console.log(`download file ` + normalizeUrl(i));
                const reu = parsed.origin + parsed.pathname;
                return download(reu, dst, {
                    filename
                }) as any;
            } catch (e) {
                logger.error('error download step image', e);
            }
        }
    }, { concurrency: 1 });
}

export async function crawler(
    url: string = 'https://davehakkens.nl/community/forums/forum/precious-plastic/general/',
    dst,
    prefix,
    options: any = {

    }) {
    
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
            }

            const isIndex = await page.$$eval('return window', isIndexFn);

            const pageFunctionTopic = () => {

                let data: any = {};
                const $ = window['jQuery'];
                try {
                    data.title = $('.ty-product-block-title')[0].innerText;
                } catch (e) {
                    console.error('error parsing title');
                    debugger;
                }

                try {

                    data.price = $('.ty-price-num')[1].innerText;
                } catch (e) {
                    console.error('error parsing price');
                    debugger;
                }

                try {
                    data.storeName = $('.store-lnk')[0].innerText;
                } catch (e) {
                    console.error('error parsing store name');
                    debugger;
                }

                try {
                    data.storeLink = $('.store-lnk').attr('href')
                } catch (e) {
                    console.error('error parsing store link');
                    debugger;
                }

                try {
                    data.mediaHTML = $('.ty-product-block__img')[0].innerHTML;
                } catch (e) {
                    console.error('error parsing image block');
                    debugger;
                }

                try {
                    data.description = $('.content-description')[0].innerHTML;
                } catch (e) {
                    console.error('error parsing store description');
                    debugger;
                }

                try {
                    data.features = $('.content-features')[0].innerHTML;
                } catch (e) {
                    console.error('error parsing features');
                    debugger;
                }

                try {
                    data.options = $("div.ty-product-block.ty-product-detail > div > div.ty-product-block__left.ec-sticky-block > form")[0].innerHTML;
                } catch (e) {
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
                }
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
                    let u: any = new URL(i)
                    let parts: any = u.pathname.split('/')
                    parts[2] = ''
                    parts[3] = ''
                    parts[4] = ''

                    parts = parts.join('/')

                    u = u.protocol + '//' + u.host + '/' + parts + ''
                    return {
                        order: ind,
                        url: u
                    }
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
                    }
                }

                if (!index[data.storeName].paths) {
                    index[data.storeName].paths = []
                }

                if (!index[data.storeName].products.includes(data.url)) {
                    index[data.storeName].products.push(data.url)
                    index[data.storeName].paths.push(dataPath)
                }

                write(indexPath, index);

            } else {
                const data = await page.$$eval('return window', pageFunctionIndex);
                const content = await page.content();
                const indexPath = path.join(dst, prefix, 'index.html')
                write(indexPath, content)
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
};
