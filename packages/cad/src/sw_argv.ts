import * as CLI from 'yargs'
import * as path from 'path'

import { substitute } from "@polymech/core/strings"
import { resolve, forward_slash, pathInfo } from "@polymech/commons"
import { sync as read } from "@polymech/fs/read"
import { logger } from './index.js'
import { SolidworkOptions } from './index.js'
import { DEFAULT_REPORT } from './constants.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: './',
        describe: 'The source directory or source file. Glob patters are supported!',
        demandOption: true
    }).option('format', {
        describe: 'The target format. Multiple formats are allowed as well, use --format=pdf --format=jpg'
    }).option('dst', {
        describe: 'Destination folder or file'
    }).option('view', {
        default: 'Render',
        describe: 'Sets the target view'
    }).option('Report', {
        describe: 'Optional conversion report. Can be JSON, HTML, CSV or Markdown'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('report', {
        default: DEFAULT_REPORT,
        describe: '',
        type: 'string'
    }).option('configuration', {
        default: 'Default',
        describe: 'Set the Model Configuration to be used',
        type: 'string',
        alias: 'c'
    }).option('cache', {
        default: false,
        describe: 'Enable caching',
        type: 'boolean'
    }).option('hidden', {
        describe: 'Hide Solidworks window',
        type: 'string'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('verbose', {
        default: true,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('quality', {
        default: 2,
        describe: 'Raytrace quality',
        type: 'number'
    }).option('renderer', {
        default: 'Solidworks',
        describe: 'Renderer to be used: Solidworks or Photoview',
        type: 'string',
    }).option('sw', {
        describe: 'Set explicit the path to the Solidworks binaries & scripts.\
        Otherwise, set it to 2020, 2022 or 2023 to use the built-in binaries',
        default: 2025,
        type: 'number'
    }).option('swv', {
        describe: 'Internal Solidworks Version. Use \'30\' for 2022',
        default: 33,
        type: 'number'
    }).option('pack', {
        describe: 'Pack and Go an Assembly. The destination must be a folder',
        default: false,
        type: 'boolean'
    }).option('rebuild', {
        describe: 'Rebuild the assembly',
        default: false,
        type: 'boolean'
    }).option('save', {
        describe: 'Save the assembly or part',
        default: false,
        type: 'boolean'
    }).option('light', {
        describe: 'Open assembly in light mode',
        default: false,
        type: 'boolean'
    }).option('script', {
        describe: 'Set explicit the path to the Solidworks script',
        default: 'convert.exe'
    }).option('bom-config', {
        describe: 'Set the Model Configuration to be used',
        default: 'Default'
    }).option('bom-template', {
        describe: 'Path to the BOM template. Default is osr-cad/sw/bom-all.sldbomtbt'
    }).option('bom-type', {
        describe: 'Bom Type : default = 2 - PartsOnly = 1 | TopLevelOnly = 2 | Indented = 3',
        type: "number",
        default: 2
    }).option('bom-detail', {
        describe: 'Bom Numbering : default = 1 - Type_None = 0 |  Type_Detailed = 1 | Type_Flat = 2 | BOMNotSet = 3',
        type: "number",
        default: 1
    }).option('bom-images', {
        describe: 'Add an image in the first colum',
        type: 'boolean',
        default: false
    })
}

export const sanitizeSingle = (argv: CLI.Arguments): SolidworkOptions => {

    const src = forward_slash(path.resolve(resolve(argv.src as string)))
    const config: any = argv.config ? read(path.resolve('' + argv.config), 'json') : {}
    const extraVariables = {}
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key]
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
        cache: argv.cache,
        alt: argv.alt,
        quality: argv.quality,
        clear: argv.clear,
        renderer: argv.renderer || "solidworks",
        close: argv.close,
        width: argv.width || "1024",
        height: argv.height || "1024",
        hidden: argv.hidden || "true",
        configuration: argv.configuration || 'Default',
        script: argv.script || 'convert.exe',
        sw: argv.sw || 2024,
        swv: argv.swv || 32,
        view: argv.view || '*Render',
        pack: argv.pack,
        light: argv.light,
        rebuild: argv.rebuild,
        save: argv.save,
        write: argv.write,
        variables: { ...extraVariables },
        report: argv.report || DEFAULT_REPORT,
        args: argv.args || ''
    } as SolidworkOptions

    if (!args.src) {
        logger.error('Invalid source, abort')
        return process.exit()
    }
    args.srcInfo = pathInfo(argv.src as string)
    if (!args.srcInfo.FILES) {
        logger.error(`Invalid source files, abort`);
        return process.exit()
    }

    for (const key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key]
        }
    }

    if (argv.dst) {
        args.dst = path.resolve(args.dst)
        args.dstInfo = pathInfo(args.dst as string)
        args.dstInfo.PATH = path.resolve(argv.dst as string)

        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key]
            }
        }
    }
    return args
}

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

