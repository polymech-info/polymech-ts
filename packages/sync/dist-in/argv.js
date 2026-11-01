import * as path from 'path';
import { isArray, isString, isObject } from '@polymech/core/primitives';
import { resolve } from '@polymech/commons';
import { sync as exists } from '@polymech/fs/exists';
import { sync as read } from '@polymech/fs/read';
import { logger } from './logger.js';
export const default_profile = {
    debug: false,
    verbose: false,
    matching: ['**']
};
const _resolvePath = (_path, alt = false, vars = {}) => path.resolve(resolve(_path, alt, vars));
export const sanitize = (argv) => {
    argv = argv;
    const resolvePath = (_path) => _resolvePath(_path, argv.alt, argv.var);
    try {
        if (!argv.source) {
            logger.error('You must specify a source location!');
            return argv;
        }
        if (isString(argv.source)) {
            argv.source = [resolvePath(argv.source)];
        }
        else if (argv.source && isArray(argv.source)) {
            argv.source = argv.source.map(resolvePath);
        }
    }
    catch (e) {
        logger.error('e', e);
    }
    argv.root = resolvePath(argv.root || '');
    if (argv.cwd) {
        argv.cwd = resolvePath(argv.cwd);
    }
    // try profile file
    if (argv.profile) {
        if (isString(argv.profile)) {
            const profilePath = resolvePath(argv.profile || '');
            if (exists(profilePath)) {
                try {
                    logger.debug(`Using profile ${profilePath}`);
                    argv.profile = read(profilePath, 'json');
                }
                catch (e) {
                    logger.error(`Error reading profile ${profilePath}`);
                    argv.profile = default_profile;
                }
            }
            else {
                argv.profile = default_profile;
            }
        }
        else if (isObject(argv.profile)) {
            // validate
        }
    }
    else {
        argv.profile = default_profile;
    }
    argv.filter = argv.filter || '';
    argv.logLevel = argv.logLevel || 'warn';
    return argv;
};
export const defaultOptions = (yargs) => {
    return yargs
        .option('target', {
        describe: 'Destination directory - back-compat'
    })
        .option('source', {
        describe: 'Source directory'
    })
        .option('profile', {
        describe: 'Profile with glob patterns',
        default: './.osr-sync.json'
    })
        .option('clear', {
        describe: 'Erase the target directory before',
        default: false,
        type: 'boolean'
    })
        .option('debug', {
        describe: 'show debug infos',
        default: false,
        type: 'boolean'
    })
        .option('logLevel', {
        describe: 'Log level',
        default: 'warn',
        type: 'string'
    })
        .option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    })
        .option('renamer', {
        describe: 'path to a relative script file which returns a new file or directory name for a given input path (one argument). For instance : \n' +
            "\t exports.default = function (from, to) {\
            \t }"
    });
};
