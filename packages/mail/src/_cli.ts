import { IOptions } from './types.js'
import { forward_slash, pathInfo, substitute, globBase } from "@polymech/commons"
import { isFile, resolve } from "@polymech/commons"
import { sync as exists } from "@polymech/fs/exists"

export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason)
    })
}

export const sanitize = (argv: any): IOptions | boolean => {

    const options: IOptions = {
        src: argv.src,
        dry: argv.dry,
        alt: argv.alt,
        logLevel: argv.logLevel,
        transport: argv.transport,
        ...argv
    } as IOptions

    let srcInfo

    let variables = {
        ...options.variables
    }

    if (options.src) {
        const srcIn = resolve(options.src, options.alt, variables)
        options.src = forward_slash(substitute(options.alt, srcIn, variables))
        // in case a file with a glob pattern is provided, strip the glob
        // this is a special case, enabling shared scripts in Alt-Tap Salamand
        const glob_base = globBase(options.src)
        const file = options.src.replace(glob_base.glob, '').replace(/\/$/, '')
        if (exists(file) && isFile(file)) {
            options.src = file
        }
        srcInfo = pathInfo(resolve(options.src, options.alt, variables))
        if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
            options.srcInfo = srcInfo
            for (const key in srcInfo) {
                if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                    variables['SRC_' + key] = srcInfo[key];
                }
            }
        } else {
            options.src = resolve(options.src, options.alt, variables)
        }
    }

    const out = resolve(options.dst || "", options.alt, variables)
    options.dstInfo = pathInfo(out)
    if (options.dst) {
        if (options.srcInfo && options.dstInfo) {
            options.dstInfo.PATH = options.dst as string
            for (const key in options.dstInfo) {
                if (Object.prototype.hasOwnProperty.call(options.dstInfo, key)) {
                    variables['DST_' + key] = options.dstInfo[key]
                }
            }
        } else {
            options.dst = resolve(options.dst || '', options.alt, variables)
        }
    }

    options.variables = variables

    return options
}
