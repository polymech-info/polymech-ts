import * as path from 'path'
import pMap from 'p-map'
import { logger } from '../index.js'
import { SolidworkOptions } from '../types.js'
import { Helper } from '../lib/process/index.js'
import { sync as exists } from "@polymech/fs/exists"
import { dirname, getSWBin } from './sw-util.js'

export async function packFile(file, onNode: (data: any) => void = () => { }, options: SolidworkOptions) {
    if (options.dry) {
        return Promise.resolve();
    }
    const target = options.dst;
    if (options.cache && exists(target)) {
        onNode({
            src: file,
            target
        });
        return Promise.resolve();
    }
    let exe = '' + options.script;
    let args = [
        `"${file}"`,
        `"${target}"`
    ]


    const cwd = getSWBin(options.sw);
    const bin = path.resolve(`${cwd}/${exe}`);
    if (!exists(bin)) {
        logger.error(`${bin} doesnt exists in ${cwd}`)
        logger.error('__dirname:' + dirname())
        logger.error('options.sw ' + options.sw)
        return
    }

    options.debug && logger.debug(`Running ${cwd}/${exe} with`, args)
    const promise = Helper.run(cwd, exe, args, options.debug)
    promise.then((d) => {
        onNode({
            ...d,
            src: file,
            target
        })
    })
    return promise
}

export async function pack(options: SolidworkOptions) {
    let reports = []
    const onNode = (data) => { reports.push(data) }
    options.verbose && logger.info(`Pack ${options.srcInfo.FILES.length} files `)
    const ret = await pMap(options.srcInfo.FILES, async (f) => {
        logger.debug(`Convert ${f} to `, options.dst)
        return packFile(f, onNode, options)
    }, { concurrency: 1 })
    return ret
}
