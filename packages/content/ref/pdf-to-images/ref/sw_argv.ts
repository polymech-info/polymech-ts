import * as CLI from 'yargs'
import * as path from 'path'
import { resolve, forward_slash, pathInfo } from "@polymech/commons"

export const sanitize = (argv: any): SolidworkOptions => {
    const src = forward_slash(path.resolve(resolve(argv.src)))
    const config: any = argv.config ? read(path.resolve('' + argv.config), 'json') : {}
    const extraVariables = {}
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element
            }
        }
    }
    const args: SolidworkOptions = {
        src: src,
        dst: '' + argv.dst as string,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        onNode: argv.onNode,
        cache: argv.cache,
        hidden: argv.hidden || "true",
        renderer: argv.renderer || "solidworks",
        alt: argv.alt,
        quality: argv.quality,
        logLevel: argv.logLevel,
        close: argv.close,
        width: argv.width || "1024",
        height: argv.height || "1024",
        script: argv.script || 'convert.exe',
        sw: argv.sw || 2024,
        swv: argv.swv || 32,
        configuration: argv.configuration || 'Default',
        report: argv.report || DEFAULT_REPORT,
        pack: argv.pack,
        light: argv.light,
        rebuild: argv.rebuild,
        save: argv.save,
        write: argv.write,
        variables: { ...extraVariables },
        view: argv.view || 'Render',
        args: argv.args || '',
        "bom-config": argv['bom-config'],
        "bom-detail": argv['bom-detail'],
        "bom-template": argv['bom-template'],
        "bom-type": argv['bom-type'],
        "bom-images": argv['bom-images'],
    } as SolidworkOptions

    if (!args.src) {
        logger.error('Invalid source, abort')
        return process.exit()
    }

    args.srcInfo = pathInfo(src)

    if (!args.srcInfo.FILES) {
        logger.error(`Invalid source files, abort`, args.srcInfo)
        return process.exit()
    }

    for (const key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key]
        }
    }

    if (argv.dst) {
        args.dst = path.resolve(substitute(args.dst, args.variables))
        args.dstInfo = pathInfo(args.dst as string)
        args.dstInfo.PATH = argv.dst as string
        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key]
            }
        }
    }
    (args as SolidworkOptions).view = argv.view as string || "Render"
    return args
}

