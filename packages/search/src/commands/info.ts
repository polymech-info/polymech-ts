import { logger } from '../index.js'
import { defaults } from '../_cli.js'

import * as CLI from 'yargs'
import * as path from 'path'


import { CONFIG_DEFAULT } from '@polymech/commons'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('verb', {
        description: 'search api: scaleserp',
        default: 'scaleserp'
    }).option('location', {
        description: 'location to be searched from',
        default: 'Berlin, Germany'
    }).option('query', {
        description: 'the query',
        default: 'Precious Plastic Munich'
    }).option('dst', {
        description: 'dst output path, supports XLS|CSV|HTML',
        default: './tests/data/serpwow.json'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    });
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);


export const register = (cli: CLI.Argv) => {
    return cli.command('search <verb>', 'Search', options, async (argv: CLI.Arguments) => {

        defaults();
        if (argv.help) { return; }
        const args: any = argv;

        const config = CONFIG_DEFAULT(args.env_key);

        const opts = {
            verb: argv.verb,
            query: argv.query,
            dst: path.resolve(args.dst)
        };

        if (!opts.verb) {
            logger.error('No verb specified');
            return;
        }

        if (opts.verb === 'scaleserp') {

            if (!opts.query) {
                logger.error('No query defined');
                return;
            }
        }

        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, opts);

    });
};
