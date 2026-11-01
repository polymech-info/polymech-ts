import { defaults, sanitize } from '../_cli';
import { logger } from '../index';
import { syncYAML } from '../lib/sync/file';
import { CAT_TEST, DEFAULT_IMPORT_OWNER } from '../lib/discourse/constants';
const defaultOptions = (yargs) => {
    return yargs
        .option('debug', { type: 'boolean', default: true, describe: 'debug messages' })
        .option('verbose', { type: 'boolean', default: true, describe: 'even more debug messages' })
        .option('yaml', { type: 'boolean', default: true, describe: 'Parse options from YAML header' })
        .option('alt', { type: 'boolean', default: false, describe: 'alt token (%)' })
        .option('uploadLocal', { type: 'boolean', default: true, describe: 'Upload local images to Discourse' })
        .option('uploadRemote', { type: 'boolean', default: true, describe: 'Upload remote images to Discourse' })
        .option('src', {
        default: './tests/**/*.md',
        type: 'string',
        describe: 'Source : Path|Glob. Supported: HTML|MD|OSR(Options via YAML header)'
    })
        .option('title', { type: 'string', default: 'Title of the Discourse post' })
        .option('config', { type: 'string', default: 'osr_admin' })
        .option('cat', { default: CAT_TEST, type: 'number' })
        .option('timestamp', { type: 'number', default: Date.now() })
        .option('owner', { type: 'number', default: DEFAULT_IMPORT_OWNER })
        .option('config', { type: 'string', default: 'discourse_admin' })
        .option('env', { type: 'string', default: 'test-import' })
        .option('profile', { type: 'string', default: "${OSR_ROOT}/osr-profiles/osr/base.json" })
        .option('format', { type: 'string', default: 'html' })
        .option('root', { type: 'string', default: process.cwd() })
        .option('cwd', { type: 'string', default: process.cwd() })
        .option('cache', { type: 'boolean', default: true })
        .option('env_key', { type: 'string', default: 'OSR-CONFIG', describe: 'Environment key to the config path.' });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('sync <verb>', 'Sync file', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        let options = sanitize(argv);
        if (!options) {
            return;
        }
        options.debug && logger.debug(`CLI Args In`, argv);
        if (!options.verb) {
            logger.error('No verb specified');
            return;
        }
        return syncYAML(options);
    });
};
//# sourceMappingURL=sync-file.js.map