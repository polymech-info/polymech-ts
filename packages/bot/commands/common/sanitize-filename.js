"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const path = require("path");
const fs_1 = require("fs");
const fs_2 = require("../../lib/fs");
const __1 = require("../..");
const sanitize = require("sanitize-filename");
const filenamify = require('filenamify');
const slugify = require('slugify');
const defaultOptions = (yargs) => {
    return yargs.option('input', {
        default: './',
        describe: 'The sources'
    }).option('slugify', {
        default: 'false',
        describe: 'convert whitespaces to dashes, remove special ASCIs'
    }).option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('dry', {
        default: 'false',
        describe: 'dry run, dont modify'
    });
};
let options = (yargs) => defaultOptions(yargs);
const prep = (file) => {
    const parts = path.parse(file);
    const stats = (0, fs_1.lstatSync)(file);
    if (stats.isFile()) {
        console.log('p', parts);
        //        return parts.name.trim() + parts.ext.trim().split('.')[1].trim();
        return filenamify(parts.name + parts.ext);
    }
    return prep;
};
// npm run build ; node ./build/main.js sanitize-filenames --input=.
const register = (cli) => {
    return cli.command('sanitize-filename', 'Removes invalid chars in filenames', options, (argv) => __awaiter(void 0, void 0, void 0, function* () {
        if (argv.help) {
            return;
        }
        const _debug = argv.debug === 'true';
        const _dry = argv.dry === 'true';
        const src = path.resolve('' + argv.input);
        _debug && __1.logger.info(`sanitize ${src}`);
        if ((0, fs_1.existsSync)(src)) {
            !_dry && sanitize(src);
            if (argv.slugify === 'true') {
                let _files = (0, fs_2.files)(src, '**/**').map(prep).map(slugify);
                __1.logger.info('files', _files);
            }
        }
        else {
            _debug && __1.logger.error(`doesnt exists : ${src} `);
        }
    }));
};
exports.register = register;
//# sourceMappingURL=sanitize-filename.js.map