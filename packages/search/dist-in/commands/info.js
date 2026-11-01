import { logger } from '../index.js';
import { defaults } from '../_cli.js';
import * as path from 'path';
import { CONFIG_DEFAULT } from '@polymech/commons';
const defaultOptions = (yargs) => {
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
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('search <verb>', 'Search', options, async (argv) => {
        defaults();
        if (argv.help) {
            return;
        }
        const args = argv;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUdyQyxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUc1QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFbEQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFFBQVEsRUFBRSxnQkFBZ0I7S0FDN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDZCxXQUFXLEVBQUUsdUJBQXVCO1FBQ3BDLE9BQU8sRUFBRSxXQUFXO0tBQ3ZCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFdBQVcsRUFBRSw4QkFBOEI7UUFDM0MsT0FBTyxFQUFFLGlCQUFpQjtLQUM3QixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNmLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLE9BQU8sRUFBRSx5QkFBeUI7S0FDckMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixXQUFXLEVBQUUsd0NBQXdDO1FBQ3JELE9BQU8sRUFBRSwyQkFBMkI7S0FDdkMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsT0FBTyxFQUFFLFlBQVk7UUFDckIsUUFBUSxFQUFFLG9DQUFvQztLQUNqRCxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRixJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBR3pELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBRWpGLFFBQVEsRUFBRSxDQUFDO1FBQ1gsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFBQyxPQUFPO1FBQUMsQ0FBQztRQUMxQixNQUFNLElBQUksR0FBUSxJQUFJLENBQUM7UUFFdkIsTUFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU1QyxNQUFNLElBQUksR0FBRztZQUNULElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1NBQzlCLENBQUM7UUFFRixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2xDLE9BQU87UUFDWCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRSxDQUFDO1lBRTVCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNqQyxPQUFPO1lBQ1gsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFeEUsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMifQ==