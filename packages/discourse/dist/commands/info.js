import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index';
const defaultOptions = (yargs) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('info', 'info', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const args = argv;
        const src = CONFIG_DEFAULT(args.env_key);
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, src);
    });
};
//# sourceMappingURL=info.js.map