import { logger } from '../../'
import * as path from 'path'
import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { sync as dir } from '@polymech/fs/dir'
import { replaceAll } from '@polymech/core/utils'
import { sync as exists } from '@polymech/fs/exists'

import { resolve } from '@polymech/osr-cli-commons/fs';

import slugify from "slugify"
import * as download from 'download'
var sanitize = require("sanitize-filename")
const normalizeUrl = require('normalize-url')
import pMap from 'p-map'

import { URL } from 'url';

const filenamify = require('filenamify');
const _sanitize = require("sanitize-filename");

const md5 = require('md5');

const sanitize_ex = (f) => {
    let str: string = filenamify(_sanitize(f)).replace(/[^\x00-\x7F]/g, "");
    return replaceAll(',', '_', str);
}

const vendorFolder = (title, dst) => {

    if (!exists(dst)) {
        dir(dst);
    }

    const folder = path.resolve(dst + '/' + sanitize(slugify(title)));
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
            name = md5(name)
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

const Apify = require('apify');

export async function crawler(
    url: string = 'https://davehakkens.nl/community/forums/forum/precious-plastic/general/',
    dst,
    prefix,
    index_bazar) {
    // Apify.openRequestQueue() is a factory to get a preconfigured RequestQueue instance.
    // We add our first request to it - the initial page the crawler will visit.
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest({ url: url });

    // Create an instance of the PuppeteerCrawler class - a crawler
    // that automatically loads the URLs in headless Chrome / Puppeteer.
    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,

        // Here you can set options that are passed to the Apify.launchPuppeteer() function.
        launchPuppeteerOptions: {
            // For example, by adding "slowMo" you'll slow down Puppeteer operations to simplify debugging
            //slowMo: 500,
            headless: true,
            devtools: false

        },

        // Stop crawling after several pages
        maxRequestsPerCrawl: 50000,
        maxConcurrency: 1,
        // This function will be called for each URL to crawl.
        // Here you can write the Puppeteer scripts you are familiar with,
        // with the exception that browsers and pages are automatically managed by the Apify SDK.
        // The function accepts a single parameter, which is an object with the following fields:
        // - request: an instance of the Request class with information such as URL and HTTP method
        // - page: Puppeteer's Page object (see https://pptr.dev/#show=api-class-page)
        handlePageTimeoutSecs: 8000,
        gotoTimeoutSecs: 8000,
        handlePageFunction: async ({ request, page }) => {

            console.log(`Processing ${request.url}`);

            const pageFunctionTopic = () => {

                let data: any = {};
                const $ = window['jQuery'];
                try {
                    data.title = $('.vendor-name')[0].innerText;
                } catch (e) {
                    console.error('error parsing title');
                    data.title = "Error - Title"
                }

                try {
                    data.storeName = $('.store-lnk')[0].innerText;
                } catch (e) {
                    console.error('error parsing store name');
                    data.store = "Error - Storename"
                }

                try {
                    data.storeLink = $('.store-lnk').attr('href')
                } catch (e) {
                    console.error('error parsing store link');
                    data.storeLink = "Error - Storelink"
                }


                try {
                    data.address = $('.ty-company-detail__info-list')[0].innerText;
                } catch (e) {
                    console.error('error parsing store description');
                    data.address = "Error - Store Address"
                }

                try {
                    data.description = $('.main-content-grid')[0].innerHTML;
                } catch (e) {
                    console.error('error parsing features');
                    data.description = "Error - Description"
                }

                try {
                    let vendor_address = Array.from($('.ty-company-detail__control-group'))
                    data.vendor_address = []
                    vendor_address.forEach((el) => {
                        data.vendor_address.push($(el).text())
                    })

                } catch (e) {
                    console.error('error parsing features');
                    data.description = "Error - Description"
                }


                data.authorImage = $('.ty-logo-container-vendor').find('img').attr('src');

                return data;
            };

            const data = await page.$$eval('return window', pageFunctionTopic);

            console.log('Process Vendor : ', data.title);

            if (!exists(dst)) {
                dir(dst);
            }


            const folder = vendorFolder(data.title, dst);

            let fileName = 'data';
            if (request.url.split('page').length == 2) {
                fileName = fileName + "-" + parseInt(request.url.split('page')[1].replace('/', ''));
            }

            fileName = fileName + ".json";

            let dataPath = path.resolve(`${folder}/${fileName}`);
            logger.info("write to ", dataPath);

            const content = data.description;

            data.description = null;
            data.url = request.url;
            data.prefix = prefix;

            write(dataPath, data, { jsonIndent: 1 });

            write(dataPath.replace('.json', '.html'), content)
            

            const ind = read(index_bazar, 'json')
            ind[data.title]['address'] = data.vendor_address

            write(index_bazar, ind)

            if (data.authorImage) {
                await downloadFiles(folder, [data.authorImage]);
            }
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
            await Apify.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
        gotoFunction: async ({ page, request }) => {
            return page.goto(request.url, {
                waitUntil: 'domcontentloaded'
            });
        }
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();
};
