import { logger } from '../index.js';
import { sanitizeSingle } from '../sw_argv.js';
import { pack } from '../cad/index.js';
export const defaultOptions = (yargs) => {
    return yargs.option('src', {
        default: './',
        describe: 'The source directory or source file. Glob patters are supported!',
        demandOption: true
    }).option('dst', {
        describe: 'Destination folder or file'
    }).option('view', {
        default: 'Isometric',
        describe: 'Sets the target view'
    }).option('Report', {
        describe: 'Optional conversion report. Can be JSON, HTML, CSV or Markdown'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('skip', {
        default: true,
        describe: 'Skip existing files',
        type: 'boolean',
    }).option('dry', {
        default: false,
        describe: 'Run without conversion but create reports',
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Alternate tokenizer'
    }).option('verbose', {
        default: true,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('sw', {
        describe: 'Set explicit the path to the Solidworks binaries & scripts.\
        "It assumes SolidWorks.Interop.sldworks.dll and export.cmd at this location!'
    }).option('script', {
        describe: 'Set explicit the path to the Solidworks script'
    });
};
let options = (yargs) => defaultOptions(yargs);
export const register = (cli) => {
    return cli.command('pack', '', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const options = sanitizeSingle(argv);
        logger.setSettings({ minLevel: options.logLevel });
        logger.debug("options " + argv.dst, options);
        return pack(options);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9wYWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFcEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFFdEMsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixPQUFPLEVBQUUsSUFBSTtRQUNiLFFBQVEsRUFBRSxrRUFBa0U7UUFDNUUsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsNEJBQTRCO0tBQ3pDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLFdBQVc7UUFDcEIsUUFBUSxFQUFFLHNCQUFzQjtLQUNuQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNoQixRQUFRLEVBQUUsZ0VBQWdFO0tBQzdFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsMkNBQTJDO1FBQ3JELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUscUJBQXFCO0tBQ2xDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtRQUNaLFFBQVEsRUFBRTtxRkFDbUU7S0FDaEYsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7UUFDaEIsUUFBUSxFQUFFLGdEQUFnRDtLQUM3RCxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3hELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQ2xFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQUMsT0FBTTtRQUFDLENBQUM7UUFDekIsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBcUIsQ0FBQTtRQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFlLEVBQUMsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDNUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFRLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUEifQ==