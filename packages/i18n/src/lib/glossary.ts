import * as path from 'path'
import * as deeplN from 'deepl-node'

import { isFile, resolve } from "@polymech/commons"
import { sync as read } from "@polymech/fs/read"
import { sync as exists } from "@polymech/fs/exists"
import * as deepl from './deepl.js'
import { sync as write } from "@polymech/fs/write"

import {
    GLOSSARY_INFO_FILE,
    GLOSSARY_FILE_NAME
} from '../constants.js'

import { IOptions } from '../types.js'
import { hash as md5 } from './strings.js'
import { logger } from '../index.js'

export const name = (srcLang, dstLang) => `OSR-${srcLang}-${dstLang}`

export const glossaryMetaPath = (storeRoot, srcLang, dstLang) =>
    path.resolve(resolve(`${storeRoot}/glossary/${srcLang}/${dstLang}/${GLOSSARY_INFO_FILE}`))

export const glossaryPath = (storeRoot, srcLang, dstLang) =>
    path.resolve(resolve(`${storeRoot}/glossary/${srcLang}/${dstLang}/${GLOSSARY_FILE_NAME}`))

export const meta = (storeRoot: string, srcLang: string, dstLang: string): deepl.IGlossary | null => {
    
    const filePath = glossaryMetaPath(storeRoot, srcLang, dstLang)
    if (exists(filePath)) {
        return (read(filePath, 'json') as deepl.IGlossary)
    }
    return null
}
export const data = (storeRoot: string, srcLang: string, dstLang: string): string | null => {
    const filePath = glossaryPath(storeRoot, srcLang, dstLang)
    if (exists(filePath)) {
        return read(filePath, 'string') as string
    }
    return null
}
export const hash = (storeRoot: string, srcLang: string, dstLang: string) => {
    const _data = data(storeRoot, srcLang, dstLang)
    return _data ? md5(JSON.stringify(_data)) : null
}

export const update_hash = (storeRoot: string, srcLang: string, dstLang: string) => {
    const glossary_meta = glossaryMetaPath(storeRoot, srcLang, dstLang)
    const glossary = meta(storeRoot, srcLang, dstLang)
    if (glossary) {
        glossary.hash = hash(storeRoot, srcLang, dstLang)
        write(glossary_meta, glossary)
    }
}

export const create = async (
    srcLang: string = 'EN',
    dstLang: string = 'DE',
    options: IOptions
): Promise<deepl.IGlossary> => {
    
    const _name = name(srcLang, dstLang)
    const translator = new deeplN.Translator(options.api_key)
    
    const glossary_meta_path = glossaryMetaPath(options.storeRoot, srcLang, dstLang)
    const glossary_data_path = glossaryPath(options.storeRoot, srcLang, dstLang)
    const glossary_meta = meta(options.storeRoot, srcLang, dstLang)
    if (!exists(glossary_data_path)) {
        write(glossary_data_path, 'TEST,TEST')
    }
    if (exists(glossary_meta_path) && glossary_meta && glossary_meta.glossaryId) {
        try {
            await translator.deleteGlossary(glossary_meta.glossaryId)
        } catch (e) {
            logger.warn('Delete glossary failed:', _name, e.message)
        }
    }
    const ret: any = await translator.createGlossaryWithCsv(
        _name,
        srcLang as deeplN.SourceGlossaryLanguageCode,
        dstLang as deeplN.TargetGlossaryLanguageCode,
        glossary_data_path)

    if (!ret) {
        logger.error('Create glossary failed', glossary_data_path, options)
        return null
    }
    write(glossary_meta_path, ret)
    update_hash(options.storeRoot, srcLang, dstLang)
    return ret
}
export const pairs = async (
    dOptions: deepl.IDeepLOptions,
    file: string
) => {
    const translator = new deeplN.Translator(dOptions.auth_key)
    const ret = await translator.getGlossaryLanguagePairs()
    logger.info('Supported glossary pairs', ret)
    write(file, ret)
    return ret
}
export const update = async (srcLang: string, dstLang: string, options: IOptions): Promise<deepl.IGlossary> => {
    const metaPath = glossaryMetaPath(options.storeRoot, srcLang, dstLang)
    const dataPath = glossaryPath(options.storeRoot, srcLang, dstLang)
    let glossaryMeta = meta(options.storeRoot, srcLang, dstLang)
    if (!glossaryMeta || !exists(metaPath) || !exists(dataPath)) {
        glossaryMeta = await create(srcLang, dstLang, options)
        return glossaryMeta
    }
    if (glossaryMeta.hash !== hash(options.storeRoot, srcLang, dstLang)) {
        glossaryMeta = await create(srcLang, dstLang, options)
    }
    return glossaryMeta
}
export const id = (root: string) => {
    root = path.resolve(resolve(root))
    if (exists(root) && isFile(root)) {
        return (read(root, 'json') as deeplN.GlossaryInfo || {}).glossaryId
    }
}
export const _data = (storeRoot: string, srcLang: string, dstLang: string): any => {
    storeRoot = path.resolve(resolve(storeRoot))
    if (!id(storeRoot)) {
        const filePath = glossaryMetaPath(storeRoot, srcLang, dstLang)
        return read(filePath, 'string')
    }
}