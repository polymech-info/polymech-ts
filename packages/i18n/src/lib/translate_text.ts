import * as path from 'path'
import { resolve, CONFIG_DEFAULT } from '@polymech/commons'
import { sync as exists } from "@polymech/fs/exists"
import { sync as write } from "@polymech/fs/write"
import { IOptions } from '../types.js'
import { logger, clean, storeGet, storeSet, translateDeepL, getTranslation  } from './translate_commons.js'

export const translateText = async (text: string, srcLang: string, dstLang: string, options: IOptions = {}) => {
    
    text = clean(text)
    if (!text || text.length === 0) {
        return ""
    }
    if (srcLang === dstLang) {
        return text
    }
    if (!options.store) {
        logger.error('No store provided')
        return text
    }
    const store = path.resolve(resolve(options.store, false))
    if (!exists(store)) {
        logger.warn(`Invalid store root : ${store}`)
        write(store, {})
    }
    const config: any = CONFIG_DEFAULT()
    if (exists(options.store)) {
        const stored = storeGet(options.store, text)
        if (stored) {
            return stored
        }
    }
    if(!options.storeRoot){
        options.storeRoot = "${OSR_ROOT}/i18n-store"
    }
    if(!options.api_key){
        if(!config || !config.deepl || !config.deepl.auth_key){
            logger.error('i18n:translateText: No API key provided')
            return text
        }
        options.api_key = config.deepl.auth_key
    }
    const out: string[] = await translateDeepL(text, srcLang, dstLang,
        {
            ...config.deepl
        }, options, "")

    const translation = getTranslation(out, false)
    if (translation) {
        storeSet(options.store, text, translation)
        return translation
    } else {
        logger.warn('Error translating : ', text)
    }
    
    return text
}