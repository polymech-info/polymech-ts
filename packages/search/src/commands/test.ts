import * as CLI from 'yargs'
import * as path from 'path'

import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'

import { substitute } from '@polymech/commons'

import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@polymech/commons'

import { logger } from '../index.js'
import { defaults } from '../_cli.js'

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

        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, argv);
    });
};
