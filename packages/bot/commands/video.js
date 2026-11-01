"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const __1 = require("../");
const video_1 = require("../lib/media/video");
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
    });
};
exports.defaultOptions = defaultOptions;
let options = (yargs) => (0, exports.defaultOptions)(yargs);
const register = (cli) => {
    return cli.command('video <verb>', 'Convert video', options, async (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitizeVideo)(argv);
        __1.logger.info("options " + argv.dst, options);
        if (options.verb == 'convert') {
            return (0, video_1.convert)(options);
        }
        if (options.verb == 'merge') {
            return (0, video_1.merge)(options);
        }
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlkZW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tbWFuZHMvdmlkZW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkJBQTRCO0FBQzVCLDhDQUFtRDtBQUNuRCxrQ0FBaUQ7QUFHMUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ3ZCLFFBQVEsRUFBRSxrQkFBa0I7UUFDNUIsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsa0JBQWtCO0tBQy9CLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQWZZLFFBQUEsY0FBYyxrQkFlMUI7QUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxzQkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBRWpELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDdkYsSUFBQSxlQUFRLEdBQUUsQ0FBQTtRQUNWLE1BQU0sT0FBTyxHQUFHLElBQUEsb0JBQWEsRUFBQyxJQUFJLENBQXlCLENBQUE7UUFDM0QsVUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMzQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksU0FBUyxFQUFFO1lBQzNCLE9BQU8sSUFBQSxlQUFPLEVBQUMsT0FBTyxDQUFDLENBQUE7U0FDMUI7UUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFFO1lBQ3pCLE9BQU8sSUFBQSxhQUFLLEVBQUMsT0FBTyxDQUFRLENBQUE7U0FDL0I7SUFDTCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQVpZLFFBQUEsUUFBUSxZQVlwQiJ9