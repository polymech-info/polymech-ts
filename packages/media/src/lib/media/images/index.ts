export * from './resize.js'
export * from './convert.js'
// export * from './watermark.js' // Commented out to avoid naming conflicts with schemas/types functions
import pMap from 'p-map'
import * as path from 'path'
import * as fs from 'fs'
import sharp from 'sharp'
//@ts-ignore
import { files } from '@polymech/commons/glob'

import { sync as exists } from "@polymech/fs/exists"
import { sync as mkdir } from "@polymech/fs/dir"

import { glob } from 'glob'

import { IResizeOptions, logger } from '../../../index.js'
import { sanitize } from '../../../_cli.js'

//https://www.lightgalleryjs.com/demos/responsive/
export const GLOB_BASIC = 'png|jpg|tiff|jpeg|webp'

export const GLOB_MIN = '*.{png,jpg,jpeg,PNG,JPG,JPEG}'

import { resize as resizeDefault } from './resize.js'


export const getFormats = (src, folder) => {
    return [{
        src: `${src}/${folder}/${GLOB_MIN}`,
        dist: `${src}/${folder}/webp`,
        format: 'webp',
    }]
}

export const getThumbnailOptions = (src, format) => {
    return [{
        src: `${src}/${GLOB_MIN}`,
        dist: "${SRC_DIR}/${SRC_NAME}_thumb.${FORMAT}",
        format
    }]
}

export const thumbnails = async (options:IResizeOptions) => 
{
    options = sanitize(options)
    logger.settings.minLevel = options.logLevel as any
    return await resizeDefault(options)
}

export const meta = async (file) => {
    try {
        return await sharp(file).metadata()
    } catch (err) {
        logger.error(`Error retrieving meta data for ${file}`, err)
    }
}

export const format = async (formats, options = {
    cache: true,
    png: false
}) => {
    return await pMap(formats, async (format: any) => {
        mkdir(format.dist)
        let files = glob.sync(format.src)
        return await pMap(files, async (file: string) => {
            let fileParts = path.parse(file)
            const target = path.resolve(`${format.dist}/${fileParts.name}.${format.format}`)
            if (options.cache !== false && exists(target)) {
                return
            }
            const image = sharp(file).keepExif()
            const metadata = await image.metadata()
            if (options.png) {
                await image
                    .withMetadata()
                    .png()
                    .toFile(target)
                    .catch(logger.error)
            } else {
                await image
                    .withMetadata()
                    .rotate()
                    .toFile(target)
                    .catch(logger.error)
            }
            return metadata
        })
    })
}

export const getResizePatterns = (product, folder, percent = 20) => {
    return [
        {
            src: `${product}/${folder}/${GLOB_MIN}`,
            dist: `${product}/${folder}/${percent}`,
            percent
        }
    ]
}

export const resize = async (patterns, options: { cache: boolean } = { cache: true }) => {
    return pMap(patterns, async (resize: any) => {
        if (!fs.existsSync(resize.dist)) {
            mkdir(resize.dist)
        }
        let files = glob.sync(resize.src)
        return await pMap(files, async (file: string) => {
            let filename = path.basename(file);
            if (options.cache && exists(`${resize.dist}/${filename}`)) {
                return
            }
            try {
                const image = sharp(file).keepExif().withMetadata()
                const metadata = await image.metadata()
                await image
                    .resize(Math.round(metadata.width * (resize.percent / 100)))
                    .keepExif()
                    .withMetadata()
                    .toFile(`${resize.dist}/${filename}`)
            } catch (err) {
                logger.error(err)
            }
        })
    })
}

export const resizeSharp = async (patterns) => {
    return await pMap(patterns, async (resize: any) => {
        mkdir(resize.dist)
        let files = glob.sync(resize.src)
        return await pMap(files, async (file: string) => {
            let filename = path.basename(file)
            const image = sharp(file)
            const metadata = await image.metadata();
            if (exists(`${resize.dist}/${filename}`)) {
                return metadata
            }
            try {
                const metadata = await image.metadata();
                await image
                    .resize(Math.round(metadata.width * (resize.percent / 100)))
                    .toFile(`${resize.dist}/${filename}`)
                return metadata
            } catch (err) {
                console.error(err)
            }
        })
    })
}