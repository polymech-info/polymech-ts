import * as path from 'path'
import * as bluebird from 'bluebird'
import { Promise as BPromise } from 'bluebird'
import * as sharp from 'sharp'

import { logger } from '../../..'
import { IOptions, IResizeOptions } from '../../../types'
import { sync as exists } from "@polymech/fs/exists"
import { async as move } from "@polymech/fs/move"
import { sync as dir } from "@polymech/fs/dir"
import { createItem as toNode } from "@polymech/fs/inspect"

import {
    get_cached
} from '@polymech/cache/lib'

import {
    MODULE_NAME
} from '../../../constants'

import { OSR_CACHE } from '@polymech/commons'

import {
    targets
} from '../../'

export const meta = (file, image: sharp.Sharp): Promise<sharp.Metadata> => {
    return new Promise((resolve, reject) => {
        image.metadata().then((meta) => {
            resolve(meta)
        }).catch((e) => {
            logger.error(`Error creating meta data ${file}`)
            resolve(null)
        })
    })
}

export const resizeFile = async (file, target, onNode: (data: any) => void = () => { }, options: IResizeOptions): Promise<sharp.Sharp> => {

    const osr_cache = OSR_CACHE()
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))
    const cached = await get_cached(file, ca_options, MODULE_NAME)

    const targetOri = '' + target
    let inPlace = false

    if (path.resolve(file) === path.resolve(target)) {
        const parts = path.parse(target)
        target = path.join(parts.dir, parts.name + '_tmp' + parts.ext)
        inPlace = true
    }

    let image
    try {
        image = sharp(file)
    } catch (e) {
        logger.error(`Error reading file, ${file}`, e)
        return null
    }

    onNode(image)

    let metaData: any = await meta(file, image) || {}

    const percent = options.percent
    const srcParts = path.parse(file)
    const dstParts = path.parse(target)

    const node = toNode(file, {
        size: true,
        mime: true
    })


    if (!exists(dstParts.dir)) {
        dir(dstParts.dir)
    }

    if (options.width <= options.minWidth) {
        logger.error(`Error resizing : options.width <= options.minWidth`)
        return
    }

    if (metaData.width && options.width && options.minWidth) {
        if (metaData.width < options.minWidth) {
            return image
        }
    }

    if (metaData.height && options.height && options.minHeight) {
        if (metaData.height < options.minHeight) {
            return image
        }
    }

    if (options.minSize && options.minSize > node.size) {
        return image
    }
    
    if (percent && metaData.width) {
        image = image.resize({
            width: Math.round(metaData.width * (percent / 100)),
            fastShrinkOnLoad: options.fastShrinkOnLoad,
            withoutEnlargement: options.withoutEnlargement,
            withoutReduction: options.withoutReduction,
            fit: options.fit,
            position: options.position
        })

    } else if (options.width || options.height) {
        image = image.resize({
            width: options.width,
            height: options.height,
            fastShrinkOnLoad: options.fastShrinkOnLoad,
            withoutEnlargement: options.withoutEnlargement,
            withoutReduction: options.withoutReduction,
            fit: options.fit,
            position: options.position
        })
    } else {
        logger.error(`Error resizing, invalid options for ${file} - no width, height or percent`)
        return image
    }

    if (metaData.width) {
        await image.withMetadata().toFile(target)
    } else {
        try {
            await image.toFile(target)
        } catch (e) {
            logger.error(`Error writing file out, ${file}`, e)
            return null
        }
    }

    if (inPlace) {
        const timeout = async (retry) => new Promise((resolve) => {
            setTimeout(resolve, 500 * retry)
        })

        const moveRetry = async (src, dst, retry = 0) => {
            if (retry > 6) {
                logger.error(`Error moving file failed, max retries reached ${src}`)
                return
            }
            try {
                await move(target, targetOri)
            } catch (e) {
                if (e.code === 'EPERM') {
                    logger.warn(`Error moving file out, retry ${file}`, e)
                    await timeout(retry)
                    moveRetry(src, dst, retry + 1)
                }
            }
        }
        await moveRetry(file, targetOri)
    }

    options.debug && logger.debug(`Resized Image ${file} to ${targetOri}`)

    return image
}


export const _resize = async (file, targets: string[], onNode: (data: any) => void = () => { }, options: IOptions) => {
    return BPromise.resolve(targets).map((target) => {
        options.verbose && logger.debug(`Resizing ${file} to ${target}`)
        if (options.dry) {
            return bluebird.resolve()
        }
        return resizeFile(file, target, onNode, options);
    }, { concurrency: 1 })
}

export const resize = async (options: IOptions) => {
    let reports = []
    const onNode = (data) => { reports.push(data) }

    options.verbose && logger.info(`Convert ${options.srcInfo.FILES.length} files `)
    await BPromise.resolve(options.srcInfo.FILES).map((f) => {
        const outputs = targets(f, options)
        options.verbose && logger.info(`Convert ${f} to `, outputs)
        return _resize(f, outputs, onNode, options)
    }, { concurrency: 1 })
}