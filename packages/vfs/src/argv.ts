import * as CLI from 'yargs';
import * as path from 'path';

import {
    Options,
    logger
} from './';
import { pathInfo } from "@plastichub/osr-cli-commons"
import { sync as read } from "@plastichub/fs/read"


// default options for all commands
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
        default: 'Isometric',
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
    }).option('sw', {
        describe: 'Set explicit the path to the Solidworks binaries & scripts.\
        Otherwise, set it to 2020, 2022 or 2023 to use the built-in binaries',
        default :'2022'
    }).option('script', {
        describe: 'Set explicit the path to the Solidworks script'
    }).option('hash', {
        describe: 'To skip already converted files, this option will create a hash file with the extension .hash \
        using --skip==true will disable it again',
        default: true,
        type: 'boolean'
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
};

// Sanitizes faulty user argv options for all commands.
export const sanitizeSingle = (argv: CLI.Arguments): Options => {
    
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
    const args: Options = {
        src: src,
        dst: '' + argv.dst as string,
        report: argv.report ? path.resolve(argv.report as string) : null,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        skip: argv.skip,
        alt: argv.alt,
        glob: argv.glob as string,
        sw: argv.sw,
        script: argv.script || 'pack.exe',
        variables: {
            ...extraVariables
        },
        args: argv.args || '',
        hash: argv.hash
    } as Options;

    if (!args.src) {
        logger.error('Invalid source, abort');
        return process.exit();
    }
    
    args.srcInfo = pathInfo(argv.src as string);

    if (!args.srcInfo.FILES) {
        logger.error(`Invalid source files, abort`);
        return process.exit();
    }

    for (const key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key];
        }
    }

    if (argv.dst) {
        args.dst = path.resolve(args.dst);
        args.dstInfo = pathInfo(args.dst as string);
        args.dstInfo.PATH = path.resolve(argv.dst as string);

        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key];
            }
        }
    }

    // check for single file direct conversion
    if (!args.dstInfo.IS_GLOB && !args.format && args.dstInfo.IS_GLOB) {
        // args.format = [dstParts.ext.replace('*', '')]
    }
    return args;
};

// Sanitizes faulty user argv options for all commands.
export const sanitize = (argv: CLI.Arguments): any => {

    const src = path.resolve('' + argv.src);

    const config: any = argv.config ? read(path.resolve('' + argv.config), 'json') : {};
    /*

    const extraVariables = {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }    
    const args: Options = {
        src: src,
        dst: '' + argv.dst as string,
        report: argv.report ? path.resolve(argv.report as string) : null,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        skip: argv.skip,
        alt: argv.alt,
        glob: argv.glob as string,
        script: argv.script || 'export.cmd',
        sw: argv.sw || 2022,
        variables: {
            ...extraVariables
        },
        args: argv.args || '',
        hash: argv.hash,
        "bom-config": argv['bom-config'],
        "bom-detail": argv['bom-detail'],
        "bom-template": argv['bom-template'],
        "bom-type": argv['bom-type'],
        "bom-images": argv['bom-images'],
    } as Options;


    if (!args.src) {
        logger.error('Invalid source, abort');
        return process.exit();
    }

    if (argv.format) {
        if (typeof argv.format === 'string') {
            args.format = [argv.format];
        } else if (argv.source && isArray(argv.format)) {
            args.format = argv.format;
        }
    }

    args.srcInfo = pathInfo(argv.src as string);

    if (!args.srcInfo.FILES) {
        logger.error(`Invalid source files, abort`, args.srcInfo);
        return process.exit();
    }

    for (const key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key];
        }
    }

    if (argv.dst) {
        args.dst = path.resolve(substitute(args.dst, args.variables));
        args.dstInfo = pathInfo(args.dst as string);
        args.dstInfo.PATH = argv.dst as string;

        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key];
            }
        }
    }

    (args as SolidworkOptions).view = argv.view as string || "Isometric";

    // check for single file direct conversion
    if (!args.dstInfo.IS_GLOB && !args.format && args.dstInfo.IS_GLOB) {
        // args.format = [dstParts.ext.replace('*', '')]
    }
    */
    // return args;
};

