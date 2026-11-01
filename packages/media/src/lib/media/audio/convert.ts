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

import { meta } from '../ffmpeg'



const FfmpegCommand = require('fluent-ffmpeg')

const extension = (file: string) => path.parse(file).ext

export const split = async (src: string, dst: string, onNode, options: { interval: number }): Promise<void> => {
    try {
        const metadata = await meta(src)
        const duration = metadata.format.duration
        if (!duration) {
            logger.error('Unable to determine duration of the audio file.');
            return;
        }

        let startTime = 0
        let segmentIndex = 1

        while (startTime < duration) {
            const outputFile = `${dst}/segment_${segmentIndex}.mp3`;

            await new Promise<void>((resolve, reject) => {
                const ff = new FfmpegCommand(src)
                    .setStartTime(startTime)
                    .setDuration(options.interval)
                    .output(outputFile)
                    .on('end', () => {
                        logger.info(`Segment ${segmentIndex} finished.`);
                        resolve();
                    })
                    .on('error', (error) => {
                        logger.error(`Error while processing segment ${segmentIndex}:`, error.message);
                        reject(error);
                    })
                    .run();
            });

            startTime += options.interval;
            segmentIndex++;
        }
    } catch (error) {
        logger.error('Error splitting audio file:', error)
    }
}
export const CONVERTERS =
{
    '.mp3': split
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

