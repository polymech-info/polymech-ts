import { logger } from '../logger.js';
import { defaultOptions, sanitize } from '../argv.js';
import { sync as exists } from '@polymech/fs/exists';
import { sync as remove } from '@polymech/fs/remove';
import * as fs from 'fs';
import * as path from 'path';
import { resolve } from '@polymech/commons';
import { cli } from '../cli.js';
import archiver from 'archiver';
const options = (yargs) => defaultOptions(yargs);
const defaultProduct_public_folders = [
    'cad',
    'media/gallery',
    'resources',
    'drawings',
    'vendor',
    'resources',
    'laser',
    'howto',
    'renderings'
];
const defaultProduct_public_files = ['*.json', '*.md', '*.yaml', '*.csv', '*.xls'];
const profiles = {
    product: {
        matching: [...defaultProduct_public_files, ...defaultProduct_public_folders.map((e) => `${e}/**`)]
    }
};
// node ./node_modules/osr-sync/dist/main.js zip --clear=true --source='./products/lydia-v4' --target='../out.zip' --debug=true --profile=product
// node ./node_modules/osr-sync/dist/main.js zip --clear=true --source='./products/lydia-v4' --target='../out.zip' --debug=true --profile='./osr-sync-zip.json'
// node ./node_modules/osr-sync/dist/main.js zip --clear=true --source='./products/lydia-v4' --source='./products/components/hal' --cwd="./" --target='../out.zip'  --debug=true --profile='./.osr-sync-zip.json'
export const register = (yargs) => {
    return yargs.command('zip', 'Zip', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const args = sanitize(argv);
        logger.setSettings({
            minLevel: args.logLevel ? 'trace' : 'info'
        });
        const target = path.resolve(resolve(args.target));
        if (exists(target) && args.clear) {
            logger.trace(`Deleting ${target}`);
            remove(target);
        }
        let optionsArg = {};
        if (typeof args.profile === 'string') {
            const profile = args.profile ? profiles[args.profile] : {};
            optionsArg = {
                ...profile
            };
        }
        else if (Object.keys(args.profile)) {
            optionsArg = args.profile;
        }
        logger.info('options', args.profile);
        const file = fs.createWriteStream(args.target);
        const archive = archiver('zip', {
            zlib: {
                level: 9
            }
        });
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                logger.warn('archive warning', err);
            }
            else {
                throw err;
            }
        });
        archive.on('error', (err) => {
            logger.error('archive error', err);
            return;
        });
        archive.pipe(file);
        if (optionsArg.matching) {
            if (argv.cwd) {
                args.source.forEach((source) => {
                    optionsArg.matching.forEach((_glob) => {
                        const rel = path.relative(args.cwd, source);
                        logger.info(`Archiving src=${source} : glob=${_glob} : rel=${rel} cwd=${args.cwd}`);
                        archive.glob(_glob, { cwd: source, ignore: [] }, { prefix: rel });
                    });
                });
            }
            else {
                args.source.forEach((s) => {
                    logger.info(`Archiving ${s}`);
                    optionsArg.matching.forEach((e) => {
                        archive.glob(e, { cwd: s, ignore: [] });
                    });
                });
            }
        }
        await archive.finalize();
        logger.info(`Did create archive at ${args.target}`);
    });
};
register(cli);
