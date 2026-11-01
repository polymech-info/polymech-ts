#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _cli_1 = require("./_cli");
_cli_1.defaults();
var cli = require("yargs");
var info_1 = require("./commands/info");
info_1.register(cli);
var argv = cli.argv;
if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    // tslint:disable-next-line:no-var-requires
    process.exit();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLCtCQUFrQztBQUFDLGVBQVEsRUFBRSxDQUFBO0FBRTdDLDJCQUE0QjtBQUM1Qix3Q0FBMkQ7QUFBQyxlQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7QUFFN0UsSUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztBQUV0QixJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtJQUNyQixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Q0FDbEI7S0FBTSxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtJQUMvQiwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ2xCIn0=