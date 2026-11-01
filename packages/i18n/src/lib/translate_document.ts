import { IOptions } from '../types.js'
import {
    upload_document,
    check_document_status,
    download_document,
    IDeepLOptions
} from './deepl.js'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '../index.js'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const translateDocument = async (
    src: string,
    dst: string,
    options: IOptions
) => {
    const api_key = options.config?.deepl?.auth_key || options.api_key;
    const is_free = options.config?.deepl?.free_api || false;

    if (!api_key) {
        throw new Error('DeepL auth_key is missing.');
    }

    if (!src) {
        throw new Error('Source file missing for document translation.');
    }

    if (options.cache === false && fs.existsSync(dst)) {
        logger.info(`Destination document ${dst} already exists. Skipping DeepL translation based on cache=false.`);
        return fs.readFileSync(dst);
    }

    const targetLangMatch = (options.dstLang || '').toUpperCase();
    if (!targetLangMatch) {
        throw new Error('Target language missing for document translation.');
    }

    // Structure DeepL Options
    const deepLOptions: IDeepLOptions = {
        free_api: is_free,
        auth_key: api_key,
        target_lang: targetLangMatch as any,
        text: ''
    };

    if (options.srcLang) {
        deepLOptions.source_lang = options.srcLang.toUpperCase() as any;
    }
    if (options.formality && options.formality !== 'default') {
        deepLOptions.formality = options.formality as any;
    }

    try {
        logger.info(`Uploading document for translation: ${src}`);
        const { document_id, document_key } = await upload_document(deepLOptions, src);

        let isDone = false;
        let pollInterval = 1500;
        const startTime = Date.now();
        const timeoutMs = 300000; // 5 minutes

        while (!isDone) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Document translation timed out after ${timeoutMs / 60000} minutes.`);
            }

            logger.info(`Checking status for document_id: ${document_id}`);
            const statusRes = await check_document_status(api_key, document_id, document_key, is_free);

            if (statusRes.status === 'done') {
                isDone = true;
                logger.info(`Translation finished. Billed characters: ${statusRes.billed_characters}`);
            } else if (statusRes.status === 'error') {
                throw new Error(`DeepL Document Translation failed: ${statusRes.message}`);
            } else {
                const waitTime = Math.round(pollInterval);
                logger.info(`Status: ${statusRes.status}, waiting ${waitTime / 1000}s...`);
                await delay(waitTime);
                // Backoff slightly to ensure we don't spam
                pollInterval = Math.min(pollInterval * 1.5, 10000);
            }
        }
        logger.info(`Downloading translated document...`);
        const fileBuffer = await download_document(api_key, document_id, document_key, is_free);
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.writeFileSync(dst, Buffer.from(fileBuffer));
        return fileBuffer;

    } catch (err: any) {
        console.error(`Error during document translation: ${err.message}`);
        throw err;
    }
}
