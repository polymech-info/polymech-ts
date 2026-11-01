"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.sanitizeSingle = exports.defaultOptions = void 0;
var path = require("path");
var _1 = require("./");
var osr_cli_commons_1 = require("@plastichub/osr-cli-commons");
var read_1 = require("@plastichub/fs/read");
// default options for all commands
exports.defaultOptions = function (yargs) {
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
        default: '2022'
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
    });
};
// Sanitizes faulty user argv options for all commands.
exports.sanitizeSingle = function (argv) {
    var src = path.resolve('' + argv.src);
    var config = argv.config ? read_1.sync(path.resolve('' + argv.config), 'json') : {};
    var extraVariables = {};
    for (var key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            var element = config[key];
            if (typeof element === 'string') {
                extraVariables[key] = element;
            }
        }
    }
    var args = {
        src: src,
        dst: '' + argv.dst,
        report: argv.report ? path.resolve(argv.report) : null,
        debug: argv.debug,
        verbose: argv.verbose,
        dry: argv.dry,
        skip: argv.skip,
        alt: argv.alt,
        glob: argv.glob,
        sw: argv.sw,
        script: argv.script || 'pack.exe',
        variables: __assign({}, extraVariables),
        args: argv.args || '',
        hash: argv.hash
    };
    if (!args.src) {
        _1.logger.error('Invalid source, abort');
        return process.exit();
    }
    args.srcInfo = osr_cli_commons_1.pathInfo(argv.src);
    if (!args.srcInfo.FILES) {
        _1.logger.error("Invalid source files, abort");
        return process.exit();
    }
    for (var key in args.srcInfo) {
        if (Object.prototype.hasOwnProperty.call(args.srcInfo, key)) {
            args.variables['SRC_' + key] = args.srcInfo[key];
        }
    }
    if (argv.dst) {
        args.dst = path.resolve(args.dst);
        args.dstInfo = osr_cli_commons_1.pathInfo(args.dst);
        args.dstInfo.PATH = path.resolve(argv.dst);
        for (var key in args.dstInfo) {
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
exports.sanitize = function (argv) {
    var src = path.resolve('' + argv.src);
    var config = argv.config ? read_1.sync(path.resolve('' + argv.config), 'json') : {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJndi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9hcmd2LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkJBQTZCO0FBRTdCLHVCQUdZO0FBQ1osK0RBQXNEO0FBQ3RELDRDQUFrRDtBQUdsRCxtQ0FBbUM7QUFDdEIsUUFBQSxjQUFjLEdBQUcsVUFBQyxLQUFlO0lBQzFDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDdkIsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsa0VBQWtFO1FBQzVFLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ2hCLFFBQVEsRUFBRSx3RkFBd0Y7S0FDckcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsNEJBQTRCO0tBQ3pDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLFdBQVc7UUFDcEIsUUFBUSxFQUFFLHNCQUFzQjtLQUNuQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNoQixRQUFRLEVBQUUsZ0VBQWdFO0tBQzdFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2Is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