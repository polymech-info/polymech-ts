import * as path from 'path';
import { substitute } from "@polymech/core/strings";
import { resolve, forward_slash, pathInfo } from "@polymech/commons";
import { sync as read } from "@polymech/fs/read";
import { logger } from './index.js';
import { DEFAULT_REPORT } from './constants.js';
export const defaultOptions = (yargs) => {
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
    });
};
export const sanitizeSingle = (argv) => {
    const src = forward_slash(path.resolve(resolve(argv.src)));
    const config = argv.config ? read(path.resolve('' + argv.config), 'json') : {};
    const extraVariables = {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }
    const args = {
        src: src,
        dst: '' + argv.dst,
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
    };
    if (!args.src) {
        logger.error('Invalid source, abort');
        return process.exit();
    }
    args.srcInfo = pathInfo(argv.src);
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
        args.dstInfo = pathInfo(args.dst);
        args.dstInfo.PATH = path.resolve(argv.dst);
        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key];
            }
        }
    }
    return args;
};
export const sanitize = (argv) => {
    const src = forward_slash(path.resolve(resolve(argv.src)));
    const config = argv.config ? read(path.resolve('' + argv.config), 'json') : {};
    const extraVariables = {};
    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }
    const args = {
        src: src,
        dst: '' + argv.dst,
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
    };
    if (!args.src) {
        logger.error('Invalid source, abort');
        return process.exit();
    }
    args.srcInfo = pathInfo(src);
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
        args.dstInfo = pathInfo(args.dst);
        args.dstInfo.PATH = argv.dst;
        for (const key in args.dstInfo) {
            if (Object.prototype.hasOwnProperty.call(args.dstInfo, key)) {
                args.variables['DST_' + key] = args.dstInfo[key];
            }
        }
    }
    args.view = argv.view || "Render";
    return args;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3dfYXJndi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zd19hcmd2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBRTVCLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQUNuRCxPQUFPLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNwRSxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFbkMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRS9DLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQzlDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDdkIsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsa0VBQWtFO1FBQzVFLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ2hCLFFBQVEsRUFBRSx3RkFBd0Y7S0FDckcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsNEJBQTRCO0tBQ3pDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLFFBQVE7UUFDakIsUUFBUSxFQUFFLHNCQUFzQjtLQUNuQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNoQixRQUFRLEVBQUUsZ0VBQWdFO0tBQzdFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENB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