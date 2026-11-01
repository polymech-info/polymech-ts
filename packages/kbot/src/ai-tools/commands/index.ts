import type { Argv } from 'yargs'
import { types } from './types.js'
import { list, options as listOptions } from './list.js'
import { invoke, invokeOptions } from './invoke.js'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { logger } from '../index.js'

export const commands = (yargs: Argv) => {
    return yargs
        .command('types', 'Generate TypeScript interfaces from Zod schemas', {}, types)
        .command('list', 'List all available tools and their descriptions', listOptions, list)
        .command('invoke', 'Invoke a specific tool function', invokeOptions, invoke)
        .option('env_key', {
            type: 'string',
            description: 'Environment configuration key'
        })
        .middleware([(argv) => {
            const config = CONFIG_DEFAULT(argv.env_key) as any;
            if (!config) {
                logger.warn('No config found!');
                return;
            }
            return config;
        }])
        .strict()
        .help();
};