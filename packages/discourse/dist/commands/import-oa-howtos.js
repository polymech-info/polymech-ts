import { defaults } from '../_cli';
import { logger } from '../index';
import { Instance } from '../lib/discourse';
import { read_howtos, filter_valid } from '../lib/oa/commons';
import { importHowtos, updateHowtos } from '../lib/oa/howtos';
import * as path from 'path';
import { resolve } from '@polymech/commons';
const KB_ROOT = '${KB_ROOT}';
import { OA_LATEST } from '@polymech/commons';
const defaultOptions = (yargs) => {
    return yargs.option('debug', {
        default: true,
        describe: 'debug messages',
        type: 'boolean'
    }).option('src', {
        default: OA_LATEST,
        type: 'string',
    }).option('track', {
        default: '${OA_ROOT}/oa-data/howtos/latest_track.json',
        type: 'string',
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('import-howtos', 'Import oa-howtos', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        let options = argv;
        if (!options) {
            return;
        }
        options.debug && logger.debug(`CLI Args In`, argv);
        const discourse = Instance();
        const _opts = {
            src: path.resolve(resolve(options.src)),
            track: path.resolve(resolve(options.track))
        };
        let howtos = read_howtos(_opts.src);
        howtos = filter_valid(howtos);
        await importHowtos(discourse, _opts, howtos);
        await updateHowtos(discourse, _opts, howtos);
    });
};
//# sourceMappingURL=import-oa-howtos.js.map