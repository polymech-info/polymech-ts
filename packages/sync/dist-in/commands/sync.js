import { defaultOptions } from '../argv.js';
import { sync } from '../lib/sync.js';
import { cli } from '../cli.js';
const options = (yargs) => defaultOptions(yargs);
export const register = (yargs) => {
    return yargs.command('sync', 'Default Sync', options, async (argv) => {
        if (argv.help) {
            return 0;
        }
        return await sync(argv);
    });
};
register(cli);
