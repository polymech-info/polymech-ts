import * as path from 'path'
import { JSONPath } from 'jsonpath-plus'
import { get_cached, set_cached } from '@polymech/cache'
import XLSX from 'xlsx'
import { OSR_CACHE } from '@polymech/commons'
import { sync as read } from "@polymech/fs/read"
import { sync as exists } from "@polymech/fs/exists"
import { sync as mkdir } from "@polymech/fs/dir"
import { MODULE_NAME } from '../constants.js'
import { IOptions } from '../types.js'
import { logger, translateObjectAIT } from './translate_commons.js'

export const translateXLS = async (src: string, dst: string, options: IOptions) => {
    logger.debug(`Translating ${src} to ${dst}`)
    if (!exists(src)) {
        logger.error(`Translating ${src} : not found`)
        return
    }
    const dstDir = path.parse(dst).dir
    mkdir(dstDir)
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys }, MODULE_NAME)
    if (osr_cache && cached && options.cache && exists(dst)) {
        return cached
    }
    const data = read(src, 'buffer') as Buffer
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw_data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, raw: false, skipHidden: true });
    const queryResult = JSONPath(
        {
            path: options.query,
            json: raw_data,

        })
    let translated
    try {
        translated = await translateObjectAIT(raw_data, src, {
            ...options,
            keys: queryResult
        })
    } catch (error) {
        logger.error(`Error translating XLSX ${src}`, error)
        return
    }
    if (!translated) {
        logger.error(`Error translating XLSX ${src}`)
        return
    }
    const sheetOut = XLSX.utils.json_to_sheet(translated, { skipHeader: true })
    const workbookOut = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbookOut, sheetOut, workbook.SheetNames[0])
    XLSX.writeFileXLSX(workbookOut, dst)
    osr_cache && options.cache && await set_cached(src, { keys: options.keys }, MODULE_NAME, translated)
    return dst
}
