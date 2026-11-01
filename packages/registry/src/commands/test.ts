import * as CLI from 'yargs'
import * as path from 'path'

import { sync as write } from '@plastichub/fs/write'
import { sync as read } from '@plastichub/fs/read'

import { substitute } from '@plastichub/core'

import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@plastichub/osr-commons'

import { logger } from '../'
import { defaults } from '../_cli'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('verb', {
        description: 'test verb : file|folder'
    }).option('src', {
        description: 'raw source file',
        default: './tests/src.json'
    }).option('dst', {
        description: 'dst output path, supports XLS|CSV|HTML',
        default: './tests/dst.json'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    });
};

let options = (yargs: CLI.Argv) => defaultOptions(yargs);


export const register = (cli: CLI.Argv) => {
    return cli.command('test <verb>', 'Test commands', options, async (argv: CLI.Arguments) => {

        defaults();

        if (argv.help) { return; }
        const args: any = argv;

        const config = CONFIG_DEFAULT(args.env_key);

        const opts = {
            verb: argv.verb,
            src: path.resolve(substitute(args.src, DEFAULT_ROOTS)),
            dst: path.resolve(substitute(args.dst, DEFAULT_ROOTS))
        };

        if (!opts.verb) {
            logger.error('No verb specified');
            return;
        }

        if (opts.verb === 'file') {

            const src = read(opts.src, 'json');
            /*
            const hashed = await get_cached(opts.src, { a: 1 }, 'tests')
            const shashed = await set_cached(opts.src, { a: 1 }, 'tests', src)
            */
        }
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, opts);
    });
};
