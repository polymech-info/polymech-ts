import * as path from 'path';
import { forward_slash, pathInfo } from "@polymech/commons";
import { resolve, isFile } from '@polymech/commons';
import { sync as exists } from '@polymech/fs/exists';
import { CAT_TEST, DEFAULT_IMPORT_OWNER } from '../lib/discourse/constants';
import { defaults } from '../_cli';
import { logger } from '../index';
import { syncComponent } from '../lib/sync/component';
import { PFilterValid } from '@plastichub/osr-fs-utils';
const globBase = require('glob-base');
export const parse = (argv) => {
    let ret = {
        ...argv
    };
    let srcInfo;
    let variables = {};
    ret.src = argv.src;
    ret.source = resolve(forward_slash(ret.source), ret.alt, variables);
    ret.root = resolve(forward_slash(ret.root), ret.alt, variables);
    ret.product_root = resolve(forward_slash(ret.product_root), ret.alt, variables);
    if (ret.src) {
        ret.src = resolve(ret.src, ret.alt, variables);
        // in case a file with a glob pattern is provided, strip the glob
        // this is a special case, enabling shared scripts in Alt-Tap Salamand
        const glob_base = globBase(ret.src);
        const file = ret.src.replace(glob_base.glob, '').replace(/\/$/, '');
        // case : single file
        if (exists(file) && isFile(file)) {
            ret.src = file;
        }
        const src = resolve(forward_slash(ret.src), ret.alt, variables);
        srcInfo = pathInfo(src);
        // case : glob pattern
        if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
            ret.srcInfo = srcInfo;
            for (const key in srcInfo) {
                if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                    variables['SRC_' + key] = srcInfo[key];
                }
            }
        }
        else {
            ret.src = resolve(ret.src, ret.alt, variables);
        }
    }
    if (argv.cwd) {
        ret.cwd = path.resolve(argv.cwd);
        if (!exists((ret.cwd))) {
            logger.error(`Invalid working directory ${argv.cwd}`);
        }
    }
    else {
        ret.cwd = process.cwd();
    }
    ret = {
        ...ret,
        variables,
        srcInfo
    };
    return ret;
};
const defaultOptions = (yargs) => {
    return yargs
        //standard options
        .option('alt', { type: 'boolean', default: false, describe: 'alt token (%)' })
        //discourse
        .option('yaml', { type: 'boolean', default: false, describe: 'Parse options from YAML header' })
        .option('skip', { type: 'boolean', default: true, describe: 'Skip existing' })
        .option('uploadLocal', { type: 'boolean', default: true, describe: 'Upload local images to Discourse' })
        .option('uploadRemote', { type: 'boolean', default: true, describe: 'Upload remote images to Discourse' })
        .option('title', { type: 'string', default: 'Title of the Discourse post' })
        .option('cat', { default: CAT_TEST, type: 'number' })
        .option('timestamp', { type: 'number', default: Date.now() })
        .option('owner', { type: 'number', default: DEFAULT_IMPORT_OWNER })
        .option('config', { type: 'string', default: 'discourse_admin' })
        //osrl
        .option('src', {
        default: '${OSR_ROOT}/osr-machines/injection/**/config.json',
        type: 'string',
        describe: 'Source : Path|Glob. Supported: HTML|MD|OSR(Options via YAML header)'
    })
        .option('src2', {
        default: '${OSR_ROOT}/osr-machines/sheetpress/cassandra-light/config.json',
        type: 'string',
        describe: 'Source : Path|Glob. Supported: HTML|MD|OSR(Options via YAML header)'
    })
        .option('env', { type: 'string', default: 'forum' })
        .option('profile', { type: 'string', default: "${OSR_ROOT}/osr-templates/discourse/base.json" })
        .option('format', { type: 'string', default: 'md' })
        .option('source', { type: 'string', default: "${OSR_ROOT}/osr-templates/discourse/root.html" })
        .option('language', { type: 'string', default: 'osr' })
        .option('plugins', { type: 'string', default: '${root}/osr/plugins' })
        .option('root', { type: 'string', default: process.cwd() })
        .option('product_root', { type: 'string', default: '${PRODUCT_ROOT}/products' })
        .option('cwd', { type: 'string', default: process.cwd() })
        .option('module', { type: 'string', default: 'osr-lib-components' })
        .option('filter', { type: 'string', default: PFilterValid.library_component })
        .option('cache', { type: 'boolean', default: true })
        .option('env_key', { type: 'string', default: 'OSR-CONFIG', describe: 'Environment key to the config path.' });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('sync-component', 'Sync OSR Component', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        let options = parse(argv);
        if (!options) {
            return;
        }
        logger.setSettings({ minLevel: argv.logLevel });
        // options.debug && logger.debug(`CLI Args In`, argv)
        logger.debug('Options', options);
        let ret = syncComponent(options);
        return ret;
    });
};
//# sourceMappingURL=sync-component.js.map