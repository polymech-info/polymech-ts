"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const index_1 = require("../index");
const resize_1 = require("../lib/media/images/resize");
const _cli_1 = require("../_cli");
const defaultOptions = (yargs) => {
    return yargs.option('src', {
        describe: 'FILE|FOLDER|GLOB',
        demandOption: true
    }).option('dst', {
        describe: 'FILE|FOLDER|GLOB'
    }).option('debug', {
        default: false,
        describe: 'Enable internal debug messages',
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('verbose', {
        default: false,
        describe: 'Show internal messages',
        type: 'boolean'
    }).option('percent', {
        default: false,
        describe: 'Resize image with percent',
        type: 'number'
    }).option('width', {
        default: false,
        describe: 'Resize image with',
        type: 'number'
    }).option('height', {
        default: false,
        describe: 'Resize image height',
        type: 'number'
    }).option('minHeight', {
        describe: 'Resize image minimum height',
        type: 'number'
    }).option('minWidth', {
        describe: 'Resize image minimum width',
        type: 'number'
    }).option('minSize', {
        describe: 'Resize image size (bytes)',
        type: 'number'
    }).option('percent', {
        describe: 'Resize image in percent (width)',
        type: 'number'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    });
};
exports.defaultOptions = defaultOptions;
let options = (yargs) => (0, exports.defaultOptions)(yargs);
const register = (cli) => {
    return cli.command('resize', 'Resizes files', options, async (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitize)(argv);
        index_1.logger.setSettings({
            minLevel: options.logLevel
        });
        index_1.logger.info("options " + argv.dst, options);
        await (0, resize_1.resize)(options);
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1hbmRzL3Jlc2l6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxvQ0FBaUM7QUFDakMsdURBRW1DO0FBRW5DLGtDQUdnQjtBQU1ULE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixRQUFRLEVBQUUsa0JBQWtCO1FBQzVCLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsUUFBUSxFQUFFLGtCQUFrQjtLQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNmLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLGdDQUFnQztRQUMxQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHlDQUF5QztRQUNuRCxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNqQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSx3QkFBd0I7UUFDbEMsSUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsMkJBQTJCO1FBQ3JDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsbUJBQW1CO1FBQzdCLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ2hCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixJQUFJLEVBQUUsUUFBUTtLQUNqQixDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNuQixRQUFRLEVBQUUsNkJBQTZCO1FBQ3ZDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFFBQVEsRUFBRSw0QkFBNEI7UUFDdEMsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsUUFBUSxFQUFFLDJCQUEyQjtRQUNyQyxJQUFJLEVBQUUsUUFBUTtLQUNqQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNqQixRQUFRLEVBQUUsaUNBQWlDO1FBQzNDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1FBQ2xCLFFBQVEsRUFBRSxzQ0FBc0M7UUFDaEQsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsTUFBTTtLQUNsQixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFuRFksUUFBQSxjQUFjLGtCQW1EMUI7QUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxzQkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBRWpELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDakYsSUFBQSxlQUFRLEdBQUUsQ0FBQTtRQUNWLE1BQU0sT0FBTyxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBYSxDQUFBO1FBQzFDLGNBQU0sQ0FBQyxXQUFXLENBQUM7WUFDZixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQWU7U0FDcEMsQ0FBQyxDQUFBO1FBQ0YsY0FBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMzQyxNQUFNLElBQUEsZUFBTSxFQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3pCLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBVlksUUFBQSxRQUFRLFlBVXBCIn0=