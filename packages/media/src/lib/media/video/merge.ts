import * as path from 'path'
import * as pMap from 'p-map'
import { OSR_CACHE } from '@polymech/commons'
import { sync as exists } from "@polymech/fs/exists"
import { sync as dir } from "@polymech/fs/dir"
import { get_cached } from '@polymech/cache/lib'


import { targets } from '../../'
import { logger } from '../../..'
import { MODULE_NAME } from '../../../constants'
import { IConvertVideoOptions } from '../../../types'
import { FfprobeData } from 'fluent-ffmpeg'

const FfmpegCommand = require('fluent-ffmpeg')

const meta = (src: string): Promise<FfprobeData> => {
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(src)
        ff.ffprobe(src, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata)
            }
        })
    })
}

const extension = (file: string) => path.parse(file).ext
const mp3 = async (inputPath: string, outputPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(inputPath)
        ff.noVideo()
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('end', () => {
                resolve()
            })
            .on('error', (error) => {
                reject(error)
            })
            .save(outputPath)
    })
}


export const frames = async (src, dst, onNode, options = { interval: 1 }): Promise<void> => {
    const outputDir = path.dirname(dst);
    if (!exists(outputDir)) {
        dir(outputDir)
    }
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(src)
        ff.outputOptions([`-vf fps=1/${options.interval}`])
            .output(dst)
            .on('end', () => {
                resolve()
            })
            .on('error', (err) => {
                reject(err)
            })
            .run()
    })
}

export const CONVERTERS =
{
    '.mp3': mp3,
    '.jpg': frames,
}
export const converter = (file: string) => CONVERTERS[extension(file)]
export const convertFile = async (file, target, onNode: (data: any) => void = () => { }, options: IConvertVideoOptions) => {
    const osr_cache = OSR_CACHE()
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))
    const cached = await get_cached(file, ca_options, MODULE_NAME)
    const conv = converter(target)
    if (!conv) {
        logger.error(`No converter found for ${file}`)
        return
    }
    const dstParts = path.parse(target)
    if (!exists(dstParts.dir)) {
        dir(dstParts.dir)
    }
    const ret = await conv(file, target, onNode, options)
    return ret
}

export async function _convert(file, targets: string[], onNode: (data: any) => void = () => { }, options: IConvertVideoOptions) {
    return pMap(targets, (target) => {
        options.verbose && logger.debug(`Convert ${file} to ${target}`)
        if (options.dry) {
            return
        }
        return convertFile(file, target, onNode, options);
    }, { concurrency: 1 })
}

export const convert = async (options: IConvertVideoOptions) => {
    let reports = []
    const onNode = (data) => { reports.push(data) }
    options.verbose && logger.info(`Convert ${options.srcInfo.FILES.length} files `)
    await pMap(options.srcInfo.FILES, (f) => {
        const outputs = targets(f, options)
        options.verbose && logger.info(`Convert ${f} to `, outputs)
        return _convert(f, outputs, onNode, options)
    }, { concurrency: 1 })
}