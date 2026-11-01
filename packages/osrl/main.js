#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const _cli_1 = require("./_cli");
(0, _cli_1.defaults)();
const CLI = require("yargs");
const compile_1 = require("./commands/compile");
(0, compile_1.register)(CLI);
const init_1 = require("./commands/init");
(0, init_1.register)(CLI);
const zod_schema_1 = require("./zod_schema");
const defaultOptions = (yargs) => {
    return yargs.option('logLevel', {
        default: 'info',
        describe: 'Log level : error, warn, info, debug, trace'
    });
};
let options = (yargs) => defaultOptions(yargs);
const register = (cli) => {
    return cli.command('types', 'generate types', options, (argv) => __awaiter(void 0, void 0, void 0, function* () {
        if (argv.help) {
            return;
        }
        (0, zod_schema_1.types)();
    }));
};
exports.register = register;
(0, exports.register)(CLI);
const argv = CLI.argv;
if (argv.h || argv.help) {
    CLI.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    process.exit();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFDQSxpQ0FBa0M7QUFBQyxJQUFBLGVBQVEsR0FBRSxDQUFBO0FBQzdDLDZCQUE0QjtBQUM1QixnREFBaUU7QUFBQyxJQUFBLGtCQUFlLEVBQUMsR0FBRyxDQUFDLENBQUE7QUFDdEYsMENBQTJEO0FBQUMsSUFBQSxlQUFZLEVBQUMsR0FBRyxDQUFDLENBQUE7QUFDN0UsNkNBQW9DO0FBRXBDLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDdkMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtRQUM1QixPQUFPLEVBQUUsTUFBTTtRQUNmLFFBQVEsRUFBRSw2Q0FBNkM7S0FDMUQsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBRUQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUVqRCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFHLENBQU8sSUFBbUIsRUFBRSxFQUFFO1FBQ2xGLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUFFLE9BQU07U0FBRTtRQUN6QixJQUFBLGtCQUFLLEdBQUUsQ0FBQTtJQUNYLENBQUMsQ0FBQSxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFMWSxRQUFBLFFBQVEsWUFLcEI7QUFDRCxJQUFBLGdCQUFRLEVBQUMsR0FBRyxDQUFDLENBQUE7QUFFYixNQUFNLElBQUksR0FBUSxHQUFHLENBQUMsSUFBSSxDQUFBO0FBRTFCLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQ3JCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNmLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNsQjtLQUFNLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0lBQy9CLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNsQiJ9