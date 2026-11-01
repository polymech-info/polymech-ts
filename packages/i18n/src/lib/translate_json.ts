import { OSR_CACHE } from '@polymech/commons'
import { get_cached, set_cached } from '@polymech/cache'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { IOptions } from '../types.js'
import { MODULE_NAME } from '../constants.js'
import { translateObject, logger } from './translate_commons.js'

export const translateJSON = async (
    src: string,
    dst: string,
    options: IOptions) => {
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys }, MODULE_NAME)
    if (osr_cache && cached && options.cache) {
        return cached
    }

    let object = read(src, 'json') as any
    object = await translateObject(object, src, options)

    if (osr_cache && options.cache) {
        await set_cached(src, { keys: options.keys }, MODULE_NAME, object)
    }
    write(dst, object)
    return object
}