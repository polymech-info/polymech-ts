import * as path from 'path';
import pMap from 'p-map';
import { pathToFileURL } from 'node:url';
import { logger } from '../logger.js';
import { default_profile, sanitize } from '../argv.js';
import { makeDefaultSyncPathFilter } from '../exclude-default.js';
import { sync as exists } from '@polymech/fs/exists';
import { sync as remove } from '@polymech/fs/remove';
import { sync as copy } from '@polymech/fs/copy';
import { resolve } from '@polymech/commons';
/** Pass only @polymech/fs copy options through; ignore CLI-only fields on profile JSON. */
const copyOptionKeys = [
    'overwrite',
    'matching',
    'filter',
    'progress',
    'writeProgress',
    'content',
    'conflictCallback',
    'renameCallback',
    'conflictSettings',
    'throttel',
    'debug',
    'flags'
];
function copyOptionsFromLoadedProfile(profile, copyProfiles) {
    if (typeof profile === 'string') {
        const named = copyProfiles[profile];
        if (named && typeof named === 'object') {
            return { ...named };
        }
        return {};
    }
    if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
        const p = profile;
        const o = {};
        for (const k of copyOptionKeys) {
            if (k in p) {
                ;
                o[k] = p[k];
            }
        }
        return o;
    }
    return {};
}
const default_ignored_folders = ['.git', 'node_modules', '_MACOSX', 'production', 'templates', '.*'];
const default_ignored_files = ['!./**/*.zip', '!./**/*.tar'];
const defaultProduct_public_folders = [
    'cad',
    'media/gallery',
    'resources',
    'drawings',
    'vendor',
    'resources',
    'laser',
    'bazar',
    'howto',
    'renderings'
];
const defaultProduct_public_files = ['*.json', '*.md', '*.yaml', '*.csv', '*.xls'];
const profiles = {
    product: {
        matching: [
            ...defaultProduct_public_files,
            ...defaultProduct_public_folders.map((e) => `${e}/**`),
            ...default_ignored_folders.map((e) => `!./${e}/**`),
            ...default_ignored_files
        ]
    }
};
const resolvePath = (_path, alt = false, vars = {}) => path.resolve(resolve(_path, alt, vars));
export const sync = async (argv) => {
    logger.setSettings({ minLevel: argv.logLevel || 'warn' });
    const args = sanitize(argv);
    const _target = path.resolve(resolve(args.target, args.alt));
    const _source = path.resolve(resolve(args.source[0], args.alt));
    logger.trace(`Syncing ${_source} to ${_target} | `, args);
    if (!exists(args.source[0])) {
        logger.error(`Source directory doesnt exists ${_source}`);
        return false;
    }
    if (exists(_target) && args.clear) {
        logger.info(`Clearing target directory ${_target}`);
        remove(_target);
    }
    let count = 0;
    const progress = (path, current, total, item, dst) => {
        count++;
        logger.trace(`\tCopied ${path} to ${dst}`);
        return true;
    };
    let copyOptions = copyOptionsFromLoadedProfile(args.profile, profiles);
    if (args.profile === default_profile) {
        copyOptions = {
            ...copyOptions,
            filter: makeDefaultSyncPathFilter(args.source[0])
        };
    }
    copyOptions = {
        ...copyOptions,
        ...{ progress: progress }
    };
    copyOptions.overwrite = true;
    copyOptions.content = args.content;
    if (args.renamer) {
        if (typeof args.renamer == 'string') {
            const script = path.resolve(args.renamer);
            if (!exists(script)) {
                logger.warn(`Renamer script '${args.renamer}' doesn't exists at ${script}`);
            }
            else {
                try {
                    const renamerMod = await import(pathToFileURL(script).href);
                    const rename = renamerMod.default;
                    copyOptions.renameCallback = rename;
                    if (typeof copyOptions.renameCallback === 'function') {
                    }
                    else {
                        logger.warn('invalid  rename script ' + args.renamer);
                    }
                }
                catch (e) {
                    logger.error(`Error loading rename script ${script}`, e);
                }
            }
        }
        else if (typeof args.renamer === 'function') {
            copyOptions.renameCallback = args.renamer;
        }
    }
    return pMap(args.source, async (source) => {
        try {
            const vars = {
                PARENT: path.basename(path.dirname(source)),
                DIR_NAME: path.parse(source).name,
                ROOT_REL: path.relative(argv.root, source)
            };
            const target = resolvePath(args.target, args.alt, vars);
            await copy(source, target, copyOptions);
            logger.info(`Copied ${count} files from ${source} to ${target}`);
        }
        catch (error) {
            const err = error;
            logger.error(`Error copying files from ${source} to ${argv.target} : ${err.message}`, copyOptions);
        }
    }, { concurrency: 1 });
};
