import * as path from 'path'
import pMap from 'p-map'
import sharp from 'sharp'
import { z } from 'zod'

import { sync as exists } from "@polymech/fs/exists"
import { async as move } from "@polymech/fs/move"
import { sync as dir } from "@polymech/fs/dir"
import { createItem as toNode } from "@polymech/fs/inspect"
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons'

import {
    logger,
    ERR_PERM_RETRY_DELAY,
    ERR_PERM_RETRY_MAX,
    IOptions,
    IResizeOptions
} from '../../../index.js'

import {
    targetsNext
} from '../../index.js'

import {
    meta
} from './lib.js'

// Zod Schema for resize options
let schemaMap

export const ResizeOptionsSchema = (opts?: any): any => {
    schemaMap = ZodMetaMap.create()
    
    schemaMap.add(
        'src',
        z.string()
            .min(1)
            .describe('FILE|FOLDER|GLOB - Source file(s) to resize')
    )
    .add(
        'dst',
        z.string()
            .optional()
            .describe('FILE|FOLDER|GLOB - Destination for resized files')
    )
    .add(
        'debug',
        z.boolean()
            .default(false)
            .describe('Enable internal debug messages')
    )
    .add(
        'alt',
        z.boolean()
            .default(false)
            .describe('Use alternate tokenizer, & instead of $')
    )
    .add(
        'dry',
        z.boolean()
            .default(false)
            .describe('Run without conversion')
    )
    .add(
        'verbose',
        z.boolean()
            .default(false)
            .describe('Show internal messages')
    )
    .add(
        'width',
        z.number()
            .positive()
            .optional()
            .describe('Resize image width')
    )
    .add(
        'height',
        z.number()
            .positive()
            .optional()
            .describe('Resize image height')
    )
    .add(
        'minHeight',
        z.number()
            .positive()
            .optional()
            .describe('Resize image minimum height')
    )
    .add(
        'minWidth',
        z.number()
            .positive()
            .optional()
            .describe('Resize image minimum width')
    )
    .add(
        'minSize',
        z.number()
            .positive()
            .optional()
            .describe('Resize image size (bytes)')
    )
    .add(
        'percent',
        z.number()
            .positive()
            .max(1000)
            .optional()
            .describe('Resize image in percent (width)')
    )
    .add(
        'square',
        z.boolean()
            .default(false)
            .describe('Fit image within width for 1:1 aspect ratio without cropping')
    )
    .add(
        'fillColor',
        z.string()
            .default('white')
            .describe('Fill color for square backgrounds (default: white)')
    )
    .add(
        'logLevel',
        z.enum(['warn', 'info', 'debug', 'error'])
            .default('info')
            .describe('Log level: warn, info, debug, error')
    )
    .add(
        'fit',
        z.enum(['cover', 'contain', 'fill', 'inside', 'outside'])
            .optional()
            .describe('How the image should be resized to fit both provided dimensions')
    )
    .add(
        'position',
        z.union([z.number(), z.string()])
            .optional()
            .describe('Position, gravity or strategy to use when fit is cover or contain')
    )
    .add(
        'background',
        z.union([z.string(), z.object({
            r: z.number().min(0).max(255),
            g: z.number().min(0).max(255),
            b: z.number().min(0).max(255),
            alpha: z.number().min(0).max(1).optional()
        })])
            .optional()
            .describe('Background color when using a fit of contain')
    )
    .add(
        'kernel',
        z.enum(['nearest', 'cubic', 'mitchell', 'lanczos2', 'lanczos3'])
            .optional()
            .describe('The kernel to use for image reduction')
    )
    .add(
        'withoutEnlargement',
        z.boolean()
            .default(false)
            .describe('Do not enlarge if the width or height are already less than the specified dimensions')
    )
    .add(
        'withoutReduction',
        z.boolean()
            .default(false)
            .describe('Do not reduce if the width or height are already greater than the specified dimensions')
    )
    .add(
        'fastShrinkOnLoad',
        z.boolean()
            .default(true)
            .describe('Take greater advantage of the JPEG and WebP shrink-on-load feature')
    )

    return schemaMap.root()
        .passthrough()
        .describe('IResizeOptions')
}

export const types = () => {
    generate_interfaces([ResizeOptionsSchema()], 'src/zod_types_resize.ts')
    schemas()
}

export const schemas = () => {
    const schema = ResizeOptionsSchema()
    write([schema], 'schemas_resize.json', 'resize', {})
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_resize.json', JSON.stringify(schemaMap.getUISchema(), null, 2))
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message)
        })
    }
}

export const resizeFile = async (source: string, target: string, onNode: (data: sharp.Sharp) => void = () => { }, options: IResizeOptions): Promise<sharp.Sharp | undefined> => {
    //const osr_cache = OSR_CACHE()
    //const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))
    //const cached = await get_cached(file, ca_options, MODULE_NAME)
    const targetOri = '' + target
    let inPlace = false
    if (path.resolve(source) === path.resolve(target)) {
        const parts = path.parse(target)
        target = path.join(parts.dir, parts.name + '_tmp' + parts.ext)
        inPlace = true
    }

    let image: sharp.Sharp
    try {
        image = sharp(source)
    } catch (e) {
        logger.error(`Error reading file, ${source}`, e)
        return
    }

    onNode(image)
    let metaData: any = await meta(source, image) || {}
    const percent = options.percent
    
    const dstParts = path.parse(target)
    const node = toNode(source, {
        size: true,
        mime: true
    })
    if (!exists(dstParts.dir)) {
        dir(dstParts.dir)
    }
    if (options.width && options.minWidth && options.width <= options.minWidth) {
        logger.error(`Error resizing : options.width <= options.minWidth`)
        return
    }
    if (metaData.width && options.width && options.minWidth) {
        if (metaData.width <= options.minWidth) {
            return image
        }
    }
    if (metaData.height && options.height && options.minHeight) {
        if (metaData.height <= options.minHeight) {
            return image
        }
    }
    if (options.minSize && node.size && options.minSize >= node.size) {
        return image
    }
    const resizeOptions = {
        height: options.height,
            fastShrinkOnLoad: options.fastShrinkOnLoad,
            withoutEnlargement: options.withoutEnlargement,
            withoutReduction: options.withoutReduction,
            fit: options.fit,
            position: options.position,
            background: options.background || 'white'
    }
    if (percent && metaData.width) {
        image = image.resize({
            width: Math.round(metaData.width * (percent / 100)),
            ...resizeOptions

        })

    } else if (options.width || options.height) {
        if (options.square && options.width) {
            // For square mode, fit image within width maintaining aspect ratio
            // then center on square canvas with fill color
            const squareSize = options.width
            const fillColor = options.fillColor || 'white'
            
            // First resize to fit within the square while maintaining aspect ratio
            image = image.resize({
                width: squareSize,
                height: squareSize,
                fit: 'inside', // Fit within bounds without cropping
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background initially
            })
            
            // Then extend to exact square size with fill color background
            image = image.extend({
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: fillColor
            }).resize({
                width: squareSize,
                height: squareSize,
                fit: 'contain', // Center the image
                background: fillColor
            })
        } else {
            image = image.resize({
                width: options.width,            
                ...resizeOptions
            })
        }
    } else {
        logger.error(`Error resizing, invalid options for ${source} - no width, height or percent`)
        return image
    }

    if(dstParts.ext.toLowerCase() === '.webp' ||
        dstParts.ext.toLowerCase() === '.png') {
        image = image.rotate()
    }

    if (metaData.width) {
        await image.withMetadata().toFile(target)
    } else {
        try {
            await image.toFile(target)
        } catch (e) {
            logger.error(`Error writing file out, ${source}`, e)
            return
        }
    }

    if (inPlace) {
        const timeout = async (retry) => new Promise((resolve) =>
            setTimeout(resolve, ERR_PERM_RETRY_DELAY * retry)
        )
        const moveRetry = async (src, dst, retry = 0) => {
            if (retry > ERR_PERM_RETRY_MAX) {
                logger.error(`Error moving file failed, max retries reached ${src}`)
                return
            }
            try {
                await move(target, targetOri)
            } catch (e) {
                if (e.code === 'EPERM') {
                    logger.warn(`Error moving file out, retry ${source}`, e)
                    await timeout(retry)
                    moveRetry(src, dst, retry + 1)
                }
            }
        }
        await moveRetry(source, targetOri)
    }
    logger.debug(`Resized Image ${source} to ${targetOri}`)
    return image
}
export const _resize = async (file, targets: string[], onNode: (data: any) => void = () => { }, options: IOptions) => {
    return pMap(targets, async (target) => {
        logger.debug(`Resizing ${file} to ${target}`)
        if (options.dry) {
            return Promise.resolve()
        }
        return resizeFile(file, target, onNode, options);
    }, { concurrency: 1 })
}
export const resize = async (options: IResizeOptions) => {
    let reports: any = []
    logger.settings.minLevel = options.logLevel || 'info' as any
    const onNode = (data: any) => reports.push(data)
    if (options.srcInfo) {
        logger.debug(`Convert ${options.srcInfo.FILES.length} files`)
        return await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = targetsNext(f, options)
            logger.debug(`Convert ${f} to `, outputs)
            return _resize(f, outputs, onNode, options)
        }, { concurrency: 1 })
    } else {
        logger.error(`Invalid source info`)
    }
    return reports
}