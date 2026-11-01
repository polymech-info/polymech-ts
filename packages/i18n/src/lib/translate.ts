import * as path from 'path'
import pMap from 'p-map'
import { globBase } from '@polymech/commons'

import { targets, parse as parseOptions } from '../options.js'
import { IOptions } from '../types.js'
import { translateMarkup } from './translate_markup.js'
import { translateJSON } from './translate_json.js'
import { translateTOML } from './translate_toml.js'
import { translateYAML } from './translate_yaml.js'
import { translateXLS } from './translate_xls.js'
import { translateText } from './translate_text.js'
import { extension, getTranslation, logger, translateDeepL } from './translate_commons.js'
import { translateDocument } from './translate_document.js'
import { translateMarkdown } from './translate_markdown.js'

export const translateFiles = async (
    file, targets: string[], options: IOptions) => {
    const translator = getTranslator(file, options)
    if (!translator) {
        logger.error(`Can't find a translator for ${file}`)
        return false
    }
    if (options.dry) {
        logger.info(`Abort translating, dry option is on!`);
        return Promise.resolve([])
    }
    return await pMap(targets, async (target) => getTranslator(file, options)!(file, target, options), { concurrency: 1 })
}

export const translate = async (opts: IOptions) => {
    opts = parseOptions(opts as any, {})
    if (!opts.api_key) {
        logger.error('i18n : No API key provided')
        throw new Error('No API key provided')
    }
    if (!opts.dstLang || !opts.srcLang) {
        logger.error('i18n : No source or destination language provided')
        throw new Error('No source or destination language provided')
    }
    if (opts.dstLang === opts.srcLang) {
        logger.info(`Source and destination language are the same : ${opts.dstLang}`)
        return
    }
    if (opts.srcInfo && opts.srcInfo.IS_GLOB) {
        const glob_base = globBase(opts.src)
        opts.pathVariables.ROOT = path.resolve(glob_base.base)
    } else {
        opts.pathVariables.ROOT = path.resolve(opts.cwd)
    }
    if (!opts.text && (opts.srcInfo && !opts.srcInfo.FILES)) {
        logger.info(`Nothing to translate, --text or --src required`)
        return
    }
    const translateLang = async (lang) => {
        opts.dstLang = lang
        opts.pathVariables['DST_LANG'] = opts.dstLang.toLowerCase()
        opts.pathVariables['SRC_LANG'] = opts.srcLang.toLowerCase()
        opts.pathVariables['CWD'] = path.resolve(opts.cwd)
        if (opts.text) {
            const ret = await translateDeepL(
                opts.text,
                opts.srcLang,
                lang,
                {
                    free_api: false,
                    auth_key: opts.api_key,
                    formality: opts.formality as any
                } as any, opts, "")

            const translations = getTranslation((ret as any), opts.all)
            process.stdout.write(opts.all ? JSON.stringify(translations, null, 2) : translations)
            logger.info(`Translated ${opts.text} to ${lang}`, translations)
            return ret
        }
        logger.debug(`Translate ${opts.src} to ${lang}`)
        return pMap(opts.srcInfo.FILES, async (f) => translateFiles(f, targets(f, opts), opts), { concurrency: 1 })
    }
    let languages = opts.dstLang.split(',')
    const translated = await pMap(languages, async (lang) => translateLang(lang), { concurrency: 1 })
    logger.debug(`Translated all: ${opts.text ? opts.text : opts.src} to ${languages}`)
    return translated
}

export const TRANSLATORS =
{
    '.md': translateMarkup,
    '.html': translateMarkup,
    '.json': translateJSON,
    '.toml': translateTOML,
    '.yaml': translateYAML,
    '.xlsx': translateXLS,
    '.xls': translateXLS,
    '.txt': translateText
}
export const getTranslator = (file: string, options?: IOptions) => {
    const ext = extension(file);
    const docExtensions = ['.docx', '.doc', '.pptx', '.pdf'];
    const hybridExtensions = ['.html', '.htm', '.xlsx', '.xls', '.txt'];
    
    if (docExtensions.includes(ext) || (options?.engine === 'document' && hybridExtensions.includes(ext))) {
        return translateDocument;
    }
    const markdownExtensions = ['.md', '.mdx'];
    if (options?.engine === 'markdown' && markdownExtensions.includes(ext)) {
        return translateMarkdown;
    }
    
    return TRANSLATORS[ext] || null;
}
