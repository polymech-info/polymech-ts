import { upload_document, check_document_status, download_document } from './deepl.js';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../index.js';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const translateDocument = async (src, dst, options) => {
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
    const deepLOptions = {
        free_api: is_free,
        auth_key: api_key,
        target_lang: targetLangMatch,
        text: ''
    };
    if (options.srcLang) {
        deepLOptions.source_lang = options.srcLang.toUpperCase();
    }
    if (options.formality && options.formality !== 'default') {
        deepLOptions.formality = options.formality;
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
            }
            else if (statusRes.status === 'error') {
                throw new Error(`DeepL Document Translation failed: ${statusRes.message}`);
            }
            else {
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
    }
    catch (err) {
        console.error(`Error during document translation: ${err.message}`);
        throw err;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlX2RvY3VtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi90cmFuc2xhdGVfZG9jdW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUNILGVBQWUsRUFDZixxQkFBcUIsRUFDckIsaUJBQWlCLEVBRXBCLE1BQU0sWUFBWSxDQUFBO0FBQ25CLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3hCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFcEMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRTlFLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLEtBQUssRUFDbEMsR0FBVyxFQUNYLEdBQVcsRUFDWCxPQUFpQixFQUNuQixFQUFFO0lBQ0EsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUM7SUFDbkUsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxJQUFJLEtBQUssQ0FBQztJQUV6RCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FB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