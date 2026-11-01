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
import { E_AudioCodec, E_Codec, E_Format } from '../video'

const FfmpegCommand = require('fluent-ffmpeg')

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

export const frames = async (src, dst, onNode, options = { fps: 60 }): Promise<void> => {
    const outputDir = path.dirname(dst);
    if (!exists(outputDir)) {
        dir(outputDir)
    }
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(src)
        ff.outputOptions([`-vf fps=${options.fps}`])
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

//ffmpeg -r 30 -i tt-1-audio.mp3 -i tt-1-%03d.jpg out.mp4
export const merge = async (options: IConvertVideoOptions) => {
    let reports = []
    const onNode = (data) => { reports.push(data) }
    logger.info(`Merge ${options.srcInfo.FILES.length} files `)
    return await createVideoFromImages(options.srcInfo.PATH, options.dst, onNode, options.audio, {})
}

export interface VideoOptions {
    frameRate?: number;
    videoCodec?: keyof typeof E_Codec;
    audioCodec?: keyof typeof E_AudioCodec;
    format?: keyof typeof E_Format
}

export const createVideoFromImages = async (
    src: string,
    target,
    onNode,
    audio,
    {
        frameRate = 30,
        videoCodec = 'LIBX264',
        audioCodec = 'AAC',
        format = 'MP4',
    }: VideoOptions) => {

    return new Promise((resolve, reject) => {

        const dstParts = path.parse(target)
        if (!exists(dstParts.dir)) {
            dir(dstParts.dir)
        }
        const ff = new FfmpegCommand(src)
        //src.forEach((file) => ff.input(file))
        ff.inputOptions('-framerate', 24)
        ff.inputOptions('-pattern_type', 'glob')

        ff.on('progress', (err) => {
            logger.debug('progress:', err)
        }).on('error', (err) => {
            logger.error('Error:', err)
        }).on('end', () => {
            logger.info('Video has been created successfully.')
            resolve(ff)
        });
        audio && ff.addInput(audio)

        ff.videoCodec(E_Codec[videoCodec])
            .output(target)
            //.outputOptions(['-pix_fmt yuv420p'])
            //.audioCodec(E_AudioCodec[audioCodec])
            .format(E_Format[format])
            .run()
    })
}

