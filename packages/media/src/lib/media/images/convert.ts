import * as path from 'path'
import * as bluebird from 'bluebird'
import pMap from 'p-map'
import sharp from 'sharp'
import { logger } from '../../../index.js'
import { IOptions, IResizeOptions } from '../../../types.js'
import { OSR_CACHE } from '@polymech/commons'
import { sync as exists } from "@polymech/fs/exists"
import { sync as dir } from "@polymech/fs/dir"
import {
    get_cached
} from '@polymech/cache/lib'

import {
    targets
} from '../../index.js'

import {
    MODULE_NAME
} from '../../../constants.js'

export const convertFile = async (file, target, onNode: (data: any) => void = () => { }, options: IResizeOptions) => {
    const osr_cache = OSR_CACHE()
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))
    const cached = await get_cached(file, ca_options, MODULE_NAME)
    let image = sharp(file)
    const srcParts = path.parse(file)
    const dstParts = path.parse(target)
    if(!exists(dstParts.dir)){
        dir(dstParts.dir)
    }
    let ret = await image.withMetadata().toFile(target)
    return ret
}
export async function _convert(file, targets: string[], onNode: (data: any) => void = () => { }, options: IOptions) {
    return pMap(targets, async (target) => {
        logger.debug(`Convert ${file} to ${target}`);
        if (options.dry) {
            return bluebird.resolve();
        }
        return convertFile(file, target, onNode, options);
    }, { concurrency: 1 });
}

export const convert = async (options: IOptions) => {
    let reports = []
    const onNode = (data) => { reports.push(data) }
    logger.info(`Convert ${options.srcInfo.FILES.length} files `)
    await pMap(options.srcInfo.FILES,(f) => {
        const outputs = targets(f, options)
        options.verbose && logger.info(`Convert ${f} to `, outputs)
        return _convert(f, outputs, onNode, options)
    }, { concurrency: 1 })
}