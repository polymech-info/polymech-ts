"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const commons_1 = require("@polymech/commons");
const index_1 = require("../index");
const images_1 = require("../lib/media/images");
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
    }).option('key', {
        describe: 'API Key',
        type: 'string'
    });
};
exports.defaultOptions = defaultOptions;
const options = (yargs) => (0, exports.defaultOptions)(yargs);
const register = (cli) => {
    return cli.command('watermark', 'Remove watermark : FILE|GLOB', options, async (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitize)(argv);
        const config = (0, commons_1.CONFIG_DEFAULT)();
        if (!config.novita) {
            index_1.logger.error("Novita key not found");
            return;
        }
        options.debug && index_1.logger.info("Watermark Options " + argv.dst, options);
        return (0, images_1.watermark)({ ...options, key: config.novita.key });
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbW1hbmRzL3dhdGVybWFyay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQ0FBa0Q7QUFFbEQsb0NBQWlDO0FBQ2pDLGdEQUU0QjtBQUU1QixrQ0FHZ0I7QUFNVCxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQ2hELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDekIsUUFBUSxFQUFFLGtCQUFrQjtRQUM1QixZQUFZLEVBQUUsSUFBSTtLQUNuQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNmLFFBQVEsRUFBRSxrQkFBa0I7S0FDN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDakIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxTQUFTO0tBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsd0JBQXdCO1FBQ2xDLElBQUksRUFBRSxTQUFTO0tBQ2hCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ25CLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxJQUFJLEVBQUUsU0FBUztLQUNoQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNuQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSwyQkFBMkI7UUFDckMsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtRQUNqQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSxtQkFBbUI7UUFDN0IsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNsQixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSxxQkFBcUI7UUFDL0IsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNyQixRQUFRLEVBQUUsNkJBQTZCO1FBQ3ZDLElBQUksRUFBRSxRQUFRO0tBQ2YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDcEIsUUFBUSxFQUFFLDRCQUE0QjtRQUN0QyxJQUFJLEVBQUUsUUFBUTtLQUNmLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ25CLFFBQVEsRUFBRSwyQkFBMkI7UUFDckMsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNuQixRQUFRLEVBQUUsaUNBQWlDO1FBQzNDLElBQUksRUFBRSxRQUFRO0tBQ2YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDZixRQUFRLEVBQUUsU0FBUztRQUNuQixJQUFJLEVBQUUsUUFBUTtLQUNmLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQWxEWSxRQUFBLGNBQWMsa0JBa0QxQjtBQUVELE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUE7QUFFbkQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN4QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLDhCQUE4QixFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQ3JHLElBQUEsZUFBUSxHQUFFLENBQUE7UUFDVixNQUFNLE9BQU8sR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQWEsQ0FBQTtRQUMxQyxNQUFNLE1BQU0sR0FBUSxJQUFBLHdCQUFjLEdBQUUsQ0FBQTtRQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUNsQixjQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDckMsT0FBTTtTQUNQO1FBQ0QsT0FBTyxDQUFDLEtBQUssSUFBSSxjQUFNLENBQUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDdEUsT0FBTyxJQUFBLGtCQUFTLEVBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO0lBQzFELENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBWlksUUFBQSxRQUFRLFlBWXBCIn0=