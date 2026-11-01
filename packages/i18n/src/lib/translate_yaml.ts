import { OSR_CACHE } from '@polymech/commons'
import { get_cached, set_cached } from '@polymech/cache'
import { sync as read } from "@polymech/fs/read"
import { sync as write } from "@polymech/fs/write"
import { parse, stringify } from 'yaml'
import { IOptions } from '../types.js'
import { MODULE_NAME } from '../constants.js'
import { translateObject, logger } from './translate_commons.js'
import * as TOML from 'smol-toml'

export const translateYAML = async (src: string, dst: string, options: IOptions) => {
    const osr_cache = OSR_CACHE()
    const cached = await get_cached(src, { keys: options.keys }, MODULE_NAME)
    if (osr_cache && cached && options.cache) {
        return TOML.parse(cached.translations)
    }
    let srcContent = read(src) as string
    let yaml = parse(srcContent)
    yaml = await translateObject(yaml, src, options)
    if (osr_cache && options.cache) {
        try {
            await set_cached(src, { keys: options.keys }, MODULE_NAME, TOML.stringify({ translations: yaml }))
        } catch (e) {
            logger.error(`Error caching YAML ${src} : ${e.message}`, yaml);
        }
    }
    const ret = stringify(yaml)
    write(dst, ret)
    options.stdout && process.stdout.write(ret)
    return ret
}