import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@polymech/commons';
import { logger } from '../logger.js';
import { cli } from '../cli.js';
const defaultOptions = (yargs) => {
    return yargs
        .option('debug', {
        default: 'false',
        describe: 'debug messages'
    })
        .option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    });
};
const options = (yargs) => defaultOptions(yargs);
export const register = (yargs) => {
    return yargs.command('info', 'info', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const args = argv;
        const src = CONFIG_DEFAULT(args.env_key);
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, src);
        const roots = DEFAULT_ROOTS;
        logger.debug('Printing OSR paths ----');
        logger.info('\n ', Object.keys(roots)
            .map((p) => `\t OSR Path : ${p} resolves to ${roots[p]}\n`)
            .join('\n'));
    });
};
register(cli);
