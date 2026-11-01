import { logger } from '../index.js';
import { defaults } from '../_cli.js';
const defaultOptions = (yargs) => {
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
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('test <verb>', 'Test commands', options, async (argv) => {
        defaults();
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, argv);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUVyQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQ3ZDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxFQUFFLE9BQU87UUFDaEIsUUFBUSxFQUFFLGdCQUFnQjtLQUM3QixDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUNkLFdBQVcsRUFBRSx5QkFBeUI7S0FDekMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixXQUFXLEVBQUUsaUJBQWlCO1FBQzlCLE9BQU8sRUFBRSxrQkFBa0I7S0FDOUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixXQUFXLEVBQUUsd0NBQXdDO1FBQ3JELE9BQU8sRUFBRSxrQkFBa0I7S0FDOUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsT0FBTyxFQUFFLFlBQVk7UUFDckIsUUFBUSxFQUFFLG9DQUFvQztLQUNqRCxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRixJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBR3pELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBRXRGLFFBQVEsRUFBRSxDQUFDO1FBRVgsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hFLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDIn0=