"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const __1 = require("../");
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
    });
};
exports.defaultOptions = defaultOptions;
let options = (yargs) => (0, exports.defaultOptions)(yargs);
const register = (cli) => {
    return cli.command('convert', 'Convert files', options, (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitize)(argv);
        options.debug && __1.logger.info("options " + argv.dst, options);
        return (0, images_1.convert)(options);
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9jb252ZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJCQUE0QjtBQUU1QixnREFFNEI7QUFFNUIsa0NBR2dCO0FBT1QsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ3ZCLFFBQVEsRUFBRSxrQkFBa0I7UUFDNUIsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsa0JBQWtCO0tBQy9CLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsd0JBQXdCO1FBQ2xDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHdCQUF3QjtRQUNsQyxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUF2QlksUUFBQSxjQUFjLGtCQXVCMUI7QUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxzQkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBRWpELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUMsSUFBbUIsRUFBRSxFQUFFO1FBQzVFLElBQUEsZUFBUSxHQUFFLENBQUE7UUFDVixNQUFNLE9BQU8sR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQWEsQ0FBQTtRQUMxQyxPQUFPLENBQUMsS0FBSyxJQUFJLFVBQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDNUQsT0FBTyxJQUFBLGdCQUFPLEVBQUMsT0FBTyxDQUFDLENBQUE7SUFDM0IsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFQWSxRQUFBLFFBQVEsWUFPcEIifQ==