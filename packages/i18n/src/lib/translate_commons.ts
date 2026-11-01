import * as path from 'path'
import { isString, isArray, isObject, isNumber } from '@polymech/core/primitives'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { minify as minify_html } from 'html-minifier-terser'

import { IOptions, TranslateFilter } from '../types.js'
import { store, get } from './store.js'
import * as deepl from './deepl.js'

const minify = false

import {
    defaultFilters,
    defaultOptions,
    transformObject,
    TransformOptions,
    testFilters
} from './async-iterator.js'

import { update } from './glossary.js'

import { createLogger } from '@polymech/log'
export let logger = createLogger('i18n')

export const clean = (text: string = "") => text.trim()
export const extension = (file: string) => path.parse(file).ext

export const getTranslation = (translations: any, all: boolean = false) => {
    if (!all) {
        if (translations && translations[0] && translations[0].text) {
            return translations[0].text
        }
    } else {
        return translations
    }
    return false
}
export const storeSet = (storePath: string, text: string, translation: string, file: string = '') => {
    const store = read(storePath, 'json') || {}
    store[text] = clean(translation)
    write(storePath, store)
}
export const storeGet = (storePath: string, text: string, file: string = '') => {
    const db = read(storePath, 'json') || {}
    if (db[text]) {
        return db[text]
    }
}
export const translateObjectAIT = async (obj: any, src: string, options: IOptions) => {
    const opts: TransformOptions = defaultOptions({
        throttleDelay: 100,
        concurrentTasks: 1,
        path: options.query,
        filterCallback: testFilters(
            defaultFilters([
                async (input) => !options.keys.includes(input)
            ])
        ),
        transform: async (input: string, path: string) => {
            if ((isNumber(input) || parseInt(input))) {
                return input
            }
            const stored = get(options.store, input as string, options)
            if (stored) {
                return stored
            }
            const translated = await _translate(input, src, options)
            if (translated) {
                if (options.store) {
                    store(options.store, input, translated, options)
                }
                return translated
            }
            return input
        },
        errorCallback: (path: string, value: string, error: any) => {
            logger.error(`Error at path: ${path}, value: ${value}, error: ${error}`)
            return value
        }
    } as TransformOptions)
    try {
        await transformObject(obj, opts.transform, opts.path, opts.throttleDelay, opts.concurrentTasks, opts.errorCallback, opts.filterCallback)
        return obj
    } catch (error) {
        logger.error('Translation failed:', error)
    }
}
export const translateDeepL = async (
    text: string,
    srcLang: string = 'EN',
    dstLang: string = 'DE',
    dOptions: deepl.IDeepLOptions,
    options: IOptions = {},
    file: string = '') => {

    if (minify) {
        text = await minify_html(text, {
            collapseWhitespace: true
        })
    }
    let glossary
    try {
        glossary = await update(srcLang.toLowerCase(), dstLang.toLowerCase(), options)
    } catch (e) {
        logger.warn('Error updating glossary', e.message)
    }
    const deeplOptions = {
        preserve_formatting: '1',
        tag_handling: ["xml"],
        ...dOptions,
        text: text,
        target_lang: dstLang as deepl.DeepLLanguages,
        source_lang: srcLang as deepl.DeepLLanguages,
        formality: options.formality || 'default',
    } as deepl.IDeepLOptions

    if (glossary && glossary.glossaryId) {
        deeplOptions.glossary_id = glossary.glossaryId
    }
    // logger.info('Translate:', deeplOptions)
    let ret: any = await deepl.translate_deepl(deeplOptions) as deepl.IDeepLResponse
    if (!ret) {
        logger.error('Translate failed : ' + text, file)
        return false
    }
    ret = ret?.data
    if (options.filters) {
        (ret.translations).forEach((t, i) => {
            (options.filters as TranslateFilter[]).forEach((f) => {
                ret.translations[i].text = f(text, t.text, file)
            })
        })
    }
    return ret.translations
}
const _translate = async (value: string, src: string, options: IOptions) => {

    const translations = await translateDeepL(value as string, options.srcLang, options.dstLang,
        {
            auth_key: options.api_key,
            formality: options.formality || 'default',
            free_api: false
        } as any, options, src)

    return getTranslation(translations)
}
export const translateObject = async (obj: any, src: string, options: IOptions) => {
    if (isNumber(obj)) {
        return obj
    }
    if (isString(obj) && !obj.trim().length) {
        return obj
    }

    if (isString(obj) && options.store) {
        const stored = get(options.store, obj as string, options)
        if (stored && options.cache) {
            return stored
        }
        const ret = await _translate(obj as string, src, options)
        if (ret && options.store) {
            store(options.store, obj, ret, options)
            return ret
        } else {
            console.error('Error translating : ', obj)
        }
        return obj
    }
    if (isObject(obj) || isArray(obj)) {
        for await (const [key, value] of Object.entries(obj)) {
            if (!obj[key]) {
                continue
            }
            if (!isString(key)) {
                continue
            }
            if (isString(value) && options.keys && !options.keys.includes(key)) {
                continue
            }
            if (isString(value)) {
                const stored = get(options.store, value as string, options)
                if (stored && options.cache) {
                    obj[key] = stored
                } else {
                    obj[key] = await _translate(value as string, src, options)
                    if (options.store) {
                        store(options.store, value, obj[key], options)
                    }
                }
            } else if (isObject(value)) {
                obj[key] = await translateObject(value, src, options)
            } else if (isArray(value)) {
                let i = 0
                for await (const v of value) {
                    if (!v) continue
                    value[i] = await translateObject(v, src, options)
                    i++
                }
            }
        }
    }
    return obj
}
