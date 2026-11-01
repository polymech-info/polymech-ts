import * as CLI from 'yargs'
import * as path from 'path'

import {
    SolidworkOptions,
    SlicerOptions
} from './types.js'

import { pathInfo, resolve } from "@polymech/commons"
import { sync as read } from "@polymech/fs/read"
import { sync as exists } from "@polymech/fs/exists"

import { substitute, logger } from './index.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        default: './',
        describe: 'The source directory or source file. Glob patters are supported!',
        demandOption: true
    }).option('dst', {
        describe: 'Destination folder or file'
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
    }).option('skip', {
        default: true,
        describe: 'Skip existing files',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('verbose', {
        default: true,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('saveArgs', {
        describe: 'Save command line options to a file',
        type: 'string'
    }).option('saveAsProfile', {
        describe: 'Save command line options to a json file. To be loaded via --profile=file.json',
        type: 'string'
    }).option('profile', {
        describe: 'Load options from a json file',
        type: 'string'
    }).option('log', {
        describe: 'Save Slic3r output to a file',
        type: 'string'
    })
}

// Sanitizes faulty user argv options for all commands.
export const sanitizeSingle = (argv: CLI.Arguments): SolidworkOptions => {

    const src = path.resolve('' + argv.src);
    const config: any = argv.config ? read(path.resolve('' + argv.config), 'json') : {};
    const extraVariables = {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }
    const args: any = {
        src: src,
        dst: '' + argv.dst as string,
        report: argv.report ? path.resolve(argv.report as string) : null,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        cache: argv.skip,
        alt: argv.alt,
        // glob: argv.glob as string,
        variables: { ...extraVariables },
        args: argv.args || ''
    } as any

    if (!args.src) {
        logger.error('Invalid source, abort');
        return process.exit()
    }

    args.srcInfo = pathInfo(argv.src as string);

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
    return args as any
}

export const sanitize = (argv: any): SlicerOptions => {
    const src = path.resolve('' + argv.src)
    const config: any = argv.config ? read(path.resolve('' + argv.config), 'json') : {}
    const extraVariables = {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }

    let args = {
        src: src,
        dst: '' + argv.dst as string,
        report: argv.report,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        onNode: argv.onNode,
        cache: argv.skip,
        alt: argv.alt,
        variables: {
            ...extraVariables
        },
        ...argv
    } as SlicerOptions


    args.extruderOffset = args.extruderOffset ? args.extruderOffset : { x: 0, y: 0 }


    if (!args.src) {
        logger.error('Invalid source, abort')
        return
    }

    args.srcInfo = pathInfo(argv.src as string)

    if (!args.srcInfo.FILES) {
        logger.error(`Invalid source files, abort`, args.srcInfo)
        return process.exit()
    }

    for (const key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key]
        }
    }

    if (argv.saveAsProfile) {
        args.saveAsProfile = path.resolve(resolve(args.saveAsProfile, args.alt, args.variables))
    }

    if (argv.saveArgs) {
        args.saveArgs = path.resolve(resolve(args.saveArgs, args.alt, args.variables))
    }

    if (argv.report) {
        args.report = path.resolve(resolve(args.report, args.alt, args.variables))
    }

    if (argv.profile) {
        args.profile = path.resolve(resolve(args.profile, args.alt, args.variables))
    }

    if (argv.dst) {
        args.dst = path.resolve(resolve(args.dst, args.alt, args.variables))
        args.dstInfo = pathInfo(args.dst as string)
        args.dstInfo.PATH = argv.dst as string

        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key]
            }
        }
    }

    if (argv.profile) {
        args.profile = path.resolve(resolve(args.profile, args.alt, args.variables))
        if (exists(args.profile)) {
            const profile = read(args.profile, 'json') as SlicerOptions
            if (profile) {
                args = {
                    ...args,
                    ...profile
                }
            }
        }
    }
    if (argv.log) {
        args.log = path.resolve(substitute(args.log, args.alt, args.variables))
    }
    return args
}

