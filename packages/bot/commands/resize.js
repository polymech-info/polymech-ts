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
        describe: 'Resize image with',
        type: 'number'
    }).option('height', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1hbmRzL3Jlc2l6ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxvQ0FBaUM7QUFDakMsdURBRW1DO0FBRW5DLGtDQUdnQjtBQU1ULE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixRQUFRLEVBQUUsa0JBQWtCO1FBQzVCLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsUUFBUSxFQUFFLGtCQUFrQjtLQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNmLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLGdDQUFnQztRQUMxQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHlDQUF5QztRQUNuRCxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNqQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSx3QkFBd0I7UUFDbEMsSUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7UUFDakIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsMkJBQTJCO1FBQ3JDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsUUFBUSxFQUFFLG1CQUFtQjtRQUM3QixJQUFJLEVBQUUsUUFBUTtLQUNqQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNoQixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO1FBQ25CLFFBQVEsRUFBRSw2QkFBNkI7UUFDdkMsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDbEIsUUFBUSxFQUFFLDRCQUE0QjtRQUN0QyxJQUFJLEVBQUUsUUFBUTtLQUNqQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNqQixRQUFRLEVBQUUsMkJBQTJCO1FBQ3JDLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLFFBQVEsRUFBRSxpQ0FBaUM7UUFDM0MsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDbEIsUUFBUSxFQUFFLHNDQUFzQztRQUNoRCxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxNQUFNO0tBQ2xCLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQWpEWSxRQUFBLGNBQWMsa0JBaUQxQjtBQUVELElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUE7QUFFakQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQW1CLEVBQUUsRUFBRTtRQUNqRixJQUFBLGVBQVEsR0FBRSxDQUFBO1FBQ1YsTUFBTSxPQUFPLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFhLENBQUE7UUFDMUMsY0FBTSxDQUFDLFdBQVcsQ0FBQztZQUNmLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBZTtTQUNwQyxDQUFDLENBQUE7UUFDRixjQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzNDLE1BQU0sSUFBQSxlQUFNLEVBQUMsT0FBTyxDQUFDLENBQUE7SUFDekIsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFWWSxRQUFBLFFBQVEsWUFVcEIifQ==