"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.defaultOptions = void 0;
const write_1 = require("@plastichub/fs/write");
const index_1 = require("../index");
const nodemailer_1 = require("../lib/nodemailer");
const _cli_1 = require("../_cli");
const defaultOptions = (yargs) => {
    return yargs.option('src', {
        describe: 'FILE|FOLDER|GLOB',
        type: 'string',
        default: './tests/email/test.html'
    }).option('transport', {
        default: 'newsletter',
        describe: 'select the transport options with the OSR configuration',
        type: 'string'
    }).option('from', {
        default: 'newsletter@osr-plastic.org',
        describe: 'from email address',
        type: 'string'
    }).option('to', {
        default: 'cgoflyn@gmail.com',
        describe: 'to email address',
        type: 'string'
    }).option('subject', {
        default: 'Schwarzer Kater Weisser Kater',
        describe: 'the subject',
        type: 'string'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    });
};
exports.defaultOptions = defaultOptions;
let options = (yargs) => (0, exports.defaultOptions)(yargs);
const register = (cli) => {
    return cli.command('test', 'Send Test EMail', options, async (argv) => {
        (0, _cli_1.defaults)();
        const options = (0, _cli_1.sanitize)(argv);
        index_1.logger.setSettings({
            minLevel: options.logLevel
        });
        index_1.logger.info("options " + argv.dst, options);
        const ret = await (0, nodemailer_1.test)(options);
        (0, write_1.sync)('./tests/email/log.json', ret);
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGdEQUFvRDtBQUVwRCxvQ0FBaUM7QUFFakMsa0RBRTBCO0FBRTFCLGtDQUdnQjtBQU1ULE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDOUMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixRQUFRLEVBQUUsa0JBQWtCO1FBQzVCLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLHlCQUF5QjtLQUNyQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNuQixPQUFPLEVBQUUsWUFBWTtRQUNyQixRQUFRLEVBQUUseURBQXlEO1FBQ25FLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2QsT0FBTyxFQUFFLDRCQUE0QjtRQUNyQyxRQUFRLEVBQUUsb0JBQW9CO1FBQzlCLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ1osT0FBTyxFQUFFLG1CQUFtQjtRQUM1QixRQUFRLEVBQUUsa0JBQWtCO1FBQzVCLElBQUksRUFBRSxRQUFRO0tBQ2pCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLE9BQU8sRUFBRSwrQkFBK0I7UUFDeEMsUUFBUSxFQUFFLGFBQWE7UUFDdkIsSUFBSSxFQUFFLFFBQVE7S0FDakIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSx5Q0FBeUM7UUFDbkQsSUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7UUFDYixPQUFPLEVBQUUsS0FBSztRQUNkLFFBQVEsRUFBRSx3QkFBd0I7UUFDbEMsSUFBSSxFQUFFLFNBQVM7S0FDbEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7UUFDbEIsUUFBUSxFQUFFLHNDQUFzQztRQUNoRCxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxNQUFNO0tBQ2xCLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQWxDWSxRQUFBLGNBQWMsa0JBa0MxQjtBQUVELElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUE7QUFFakQsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQ2pGLElBQUEsZUFBUSxHQUFFLENBQUE7UUFDVixNQUFNLE9BQU8sR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQWEsQ0FBQTtRQUMxQyxjQUFNLENBQUMsV0FBVyxDQUFDO1lBQ2YsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFlO1NBQ3BDLENBQUMsQ0FBQTtRQUNGLGNBQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDM0MsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLGlCQUFJLEVBQUMsT0FBTyxDQUFDLENBQUE7UUFDL0IsSUFBQSxZQUFLLEVBQUMsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDeEMsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFYWSxRQUFBLFFBQVEsWUFXcEIifQ==