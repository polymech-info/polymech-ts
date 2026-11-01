import { OSR_CACHE } from '@polymech/commons'
import { get_cached, set_cached } from '@polymech/cache'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { IOptions } from '../types.js'
import { MODULE_NAME } from '../constants.js'
import { translateDeepL, getTranslation } from './translate_commons.js'

export const translateMarkup = async (
    src: string,
    dst: string,
    options: IOptions) => {
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME);
    if (osr_cache && cached && options.cache) {
        return cached
    }
    const srcContent = read(src) as string
    let translations = await translateDeepL(srcContent,
        options.srcLang,
        options.dstLang,
        {
            free_api: false,
            auth_key: options.api_key
        } as any, options, src) as any

    translations = getTranslation(translations)
    if (osr_cache && options.cache) {
        await set_cached(src, { keys: options.keys, filters: options.filters }, MODULE_NAME, translations)
    }
    if (translations) {
        write(dst, translations)
    } else {
        return false
    }
    return translations
}