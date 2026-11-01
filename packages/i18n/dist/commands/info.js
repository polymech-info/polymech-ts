import { CONFIG_DEFAULT } from '@polymech/commons';
import { logger } from '../index.js';
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
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, src.deepl);
        logger.info(`Supported languages \n
            | 'BG'
            | 'CS'
            | 'DA'
            | 'DE'
            | 'EL'
            | 'EN-GB'
            | 'EN-US'
            | 'EN'
            | 'ES'
            | 'ET'
            | 'FI'
            | 'FR'
            | 'HU'
            | 'IT'
            | 'JA'
            | 'LT'
            | 'LV'
            | 'NL'
            | 'PL'
            | 'PT-PT'
            | 'PT-BR'
            | 'PT'
            | 'RO'
            | 'RU'
            | 'SK'
            | 'SL'
            | 'SV'
            | 'ZH'
        `);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9pbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBRXBDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDdkMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUN6QixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsZ0JBQWdCO0tBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBQyxZQUFZO1FBQ3BCLFFBQVEsRUFBQyxvQ0FBb0M7S0FDaEQsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBRUQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUV4RCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQW1CLEVBQUUsRUFBRTtRQUN0RSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUFDLE9BQU07UUFBQyxDQUFDO1FBQ3pCLE1BQU0sSUFBSSxHQUFPLElBQUksQ0FBQTtRQUNyQixNQUFNLEdBQUcsR0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzVDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDeEUsTUFBTSxDQUFDLElBQUksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0E2QlgsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUEifQ==