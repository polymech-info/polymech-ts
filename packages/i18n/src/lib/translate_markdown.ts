import { OSR_CACHE } from '@polymech/commons'
import { get_cached, set_cached } from '@polymech/cache'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { IOptions } from '../types.js'
import { MODULE_NAME } from '../constants.js'
import { translate } from '@polymech/deepl-mark'
import { update as updateGlossary } from './glossary.js'
import { logger } from './translate_commons.js'

export const translateMarkdown = async (
    src: string,
    dst: string,
    options: IOptions) => {
    
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME);
    if (osr_cache && cached && options.cache) {
        return cached
    }
    
    const srcContent = read(src) as string

    // Fetch glossary if enabled
    let glossaryId: string | undefined;
    if (options.glossary !== false) {
        try {
            const glossary = await updateGlossary(
                (options.srcLang || 'EN').toLowerCase(), 
                (options.dstLang || 'DE').toLowerCase(), 
                options
            )
            if (glossary && glossary.glossaryId) {
                glossaryId = glossary.glossaryId
            }
        } catch (e: any) {
            logger.warn('Error updating glossary', e.message)
        }
    }

    try {
        const apiKey = options.config?.deepl?.auth_key || options.api_key;
        if (!apiKey) {
            throw new Error('DeepL API key is missing.');
        }

        const translations = await translate(srcContent, 
            (options.srcLang || 'EN').toUpperCase() as any, 
            (options.dstLang || 'DE').toUpperCase() as any, 
            {
                apiKey,
                deeplOptions: {
                    formality: options.formality && options.formality !== 'default' ? options.formality as any : undefined,
                    glossary: glossaryId
                }
            }
        )

        if (osr_cache && options.cache) {
            await set_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME, translations)
        }
        
        if (translations) {
            write(dst, translations)
        } else {
            return false
        }
        return translations

    } catch (e) {
        logger.error(`Error translating markdown file ${src}`, e)
        return false
    }
}
