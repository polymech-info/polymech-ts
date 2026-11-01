#!/usr/bin/env node
import { defaults } from './_cli.js';
defaults();
import { cli } from './cli.js';
import './commands/resize.js';
import './commands/pdf2jpg.js';
import './commands/watermark.js';
import './commands/background-remove.js';
import './commands/background-remove-bria.js';
import './commands/crop-foreground.js';
import './commands/salamander.js';
import './commands/schemas.js';
import './commands/register-commands.js';
import './commands/register-explorer.js';
const argv = cli.argv;
if (argv.h || argv.help) {
    cli.showHelp();
    process.exit();
}
else if (argv.v || argv.version) {
    process.exit();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQUMsUUFBUSxFQUFFLENBQUE7QUFFaEQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQUU5QixPQUFPLHNCQUFzQixDQUFBO0FBQzdCLE9BQU8sdUJBQXVCLENBQUE7QUFDOUIsT0FBTyx5QkFBeUIsQ0FBQTtBQUNoQyxPQUFPLGlDQUFpQyxDQUFBO0FBQ3hDLE9BQU8sc0NBQXNDLENBQUE7QUFDN0MsT0FBTywrQkFBK0IsQ0FBQTtBQUN0QyxPQUFPLDBCQUEwQixDQUFBO0FBQ2pDLE9BQU8sdUJBQXVCLENBQUE7QUFDOUIsT0FBTyxpQ0FBaUMsQ0FBQTtBQUN4QyxPQUFPLGlDQUFpQyxDQUFBO0FBRXhDLE1BQU0sSUFBSSxHQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFFM0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDZixPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbkIsQ0FBQztLQUFNLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDaEMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ25CLENBQUMifQ==