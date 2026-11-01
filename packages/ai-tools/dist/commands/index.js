import { types } from './types.js';
import { list, options as listOptions } from './list.js';
import { invoke, invokeOptions } from './invoke.js';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index.js';
export const commands = (yargs) => {
    return yargs
        .command('types', 'Generate TypeScript interfaces from Zod schemas', {}, types)
        .command('list', 'List all available tools and their descriptions', listOptions, list)
        .command('invoke', 'Invoke a specific tool function', invokeOptions, invoke)
        .option('env_key', {
        type: 'string',
        description: 'Environment configuration key'
    })
        .middleware([(argv) => {
            const config = CONFIG_DEFAULT(argv.env_key);
            if (!config) {
                logger.warn('No config found!');
                return;
            }
            return config;
        }])
        .strict()
        .help();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tbWFuZHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNsQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sSUFBSSxXQUFXLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDeEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDbkQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFcEMsTUFBTSxDQUFDLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBVyxFQUFFLEVBQUU7SUFDcEMsT0FBTyxLQUFLO1NBQ1AsT0FBTyxDQUFDLE9BQU8sRUFBRSxpREFBaUQsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDO1NBQzlFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsaURBQWlELEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQztTQUNyRixPQUFPLENBQUMsUUFBUSxFQUFFLGlDQUFpQyxFQUFFLGFBQWEsRUFBRSxNQUFNLENBQUM7U0FDM0UsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNmLElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLCtCQUErQjtLQUMvQyxDQUFDO1NBQ0QsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNsQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBUSxDQUFDO1lBQ25ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDVixNQUFNLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ2hDLE9BQU87WUFDWCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7U0FDRixNQUFNLEVBQUU7U0FDUixJQUFJLEVBQUUsQ0FBQztBQUNoQixDQUFDLENBQUMifQ==