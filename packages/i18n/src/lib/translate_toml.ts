import { OSR_CACHE } from '@polymech/commons'
import { get_cached, set_cached } from '@polymech/cache'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import * as TOML from 'smol-toml'
import { IOptions } from '../types.js'
import { MODULE_NAME } from '../constants.js'
import { translateObject } from './translate_commons.js'
import { createLogger } from '@polymech/log'

const logger = createLogger('i18n')

export const translateTOML = async (
    src: string,
    dst: string,
    options: IOptions) => {

    logger.info(`Translating ${src} to ${dst}`)
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys }, MODULE_NAME)
    if (osr_cache && cached && options.cache) {
        return cached
    }
    let srcContent = read(src) as string
    let toml = TOML.parse(srcContent)
    toml = await translateObject(toml, src, options)

    if (osr_cache && options.cache) {
        try {
            await set_cached(src, { keys: options.keys }, MODULE_NAME, TOML.stringify(toml))
        } catch (e) {
            logger.error(`Error caching ${src} TOML : ${e.message}`, toml);
        }
    }
    write(dst, TOML.stringify(toml))
}