"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const __1 = require("../");
const convert_1 = require("../lib/media/audio/convert");
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
    return cli.command('video <verb>', 'Convert video', options, (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitizeVideo)(argv);
        __1.logger.info("options " + argv.dst, options);
        if (argv.verb = 'convert') {
            return (0, convert_1.convert)(options);
        }
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY29tbWFuZHMvYXVkaW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkJBQTRCO0FBQzVCLHdEQUFvRDtBQUVwRCxrQ0FBaUQ7QUFHMUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUM5QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ3ZCLFFBQVEsRUFBRSxrQkFBa0I7UUFDNUIsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixRQUFRLEVBQUUsa0JBQWtCO0tBQy9CLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0NBQWdDO1FBQzFDLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUseUNBQXlDO1FBQ25ELElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQWZZLFFBQUEsY0FBYyxrQkFlMUI7QUFFRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxzQkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBRWpELE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUMsSUFBbUIsRUFBRSxFQUFFO1FBQ2pGLElBQUEsZUFBUSxHQUFFLENBQUE7UUFDVixNQUFNLE9BQU8sR0FBRyxJQUFBLG9CQUFhLEVBQUMsSUFBSSxDQUF5QixDQUFBO1FBQzNELFVBQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDM0MsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsRUFBRTtZQUN2QixPQUFPLElBQUEsaUJBQU8sRUFBQyxPQUFPLENBQUMsQ0FBQTtTQUMxQjtJQUNMLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBVFksUUFBQSxRQUFRLFlBU3BCIn0=