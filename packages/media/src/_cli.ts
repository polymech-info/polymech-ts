import { IConvertVideoOptions, IResizeOptions } from './types.js'
import { forward_slash, pathInfo, pathInfoEx,substitute } from "@polymech/commons"
import { isFile, resolve, globBase } from "@polymech/commons"
import { sync as exists } from "@polymech/fs/exists"
import { GLOB_BASIC } from './lib/media/images/index.js'

export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason)
    })
}

export const sanitize = (argv: any): IResizeOptions  => {

    const options: IResizeOptions = {
        src: argv.src,
        dst: argv.dst,
        debug: argv.debug,
        dry: argv.dry,
        alt: argv.alt,
        percent: argv.percent,
        width: argv.width === false ? undefined : argv.width,
        height: argv.height === false ? undefined : argv.height,
        minWidth: argv.minWidth === false ? undefined : argv.minWidth,
        minHeight: argv.minHeight === false ? undefined : argv.minHeight,
        minSize: argv.minSize === false ? undefined : argv.minSize,
        fit: argv.fit,
        position: argv.position,
        logLevel: argv.logLevel,
        withoutEnlargement: argv.withoutEnlargement,
        withoutReduction: argv.withoutReduction,
        fastShrinkOnLoad: argv.fastShrinkOnLoad,
        background: argv.background,
        square: argv.square,
        fillColor: argv.fillColor,
        ...argv        
    } as IResizeOptions

    let srcInfo

    let variables = {
        IMAGES: GLOB_BASIC,
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
    options.dstInfo = pathInfoEx(options.dst || "")
    if (options.dstInfo && options.dst) {
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
