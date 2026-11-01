"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const debug_1 = require("@plastichub/core/debug");
const path = require("path");
const index_1 = require("../lib/process/index");
const bluebird = require("bluebird");
const fg = require('fast-glob');
const defaultOptions = (yargs) => {
    return yargs.option('input', {
        default: './',
        describe: 'The sources'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    });
};
let options = (yargs) => defaultOptions(yargs);
async function convertFiles(files) {
    return bluebird.mapSeries(files, (file) => {
        const inParts = path.parse(file);
        const promise = index_1.Helper.run(inParts.dir, 'convert', [
            `"${inParts.base}"`,
            '-quality 40',
            '-sharpen 0x1.0',
            `"${inParts.name}.jpg"`
        ]);
        return promise;
    });
}
//node ./build/main.js svg2jpg --input=../tests/svg/
const register = (cli) => {
    return cli.command('svg2jpg', '', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const src = path.resolve('' + argv.input);
        const files = fg.sync('*.svg|*.SVG', { dot: true, cwd: src, absolute: true });
        if (argv.debug) {
            (0, debug_1.debug)(`Begin convert SVG files at ${src} ${files}`);
        }
        await convertFiles(files);
        if (argv.debug) {
            (0, debug_1.debug)(`Converted ${files.length} files`);
        }
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ZnMmpwZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9zdmcyanBnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGtEQUE4QztBQUM5Qyw2QkFBNkI7QUFDN0IsZ0RBQThDO0FBQzlDLHFDQUFxQztBQUVyQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFaEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLGFBQWE7S0FDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsK0JBQStCO0tBQzVDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQztBQUVGLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFekQsS0FBSyxVQUFVLFlBQVksQ0FBQyxLQUFLO0lBQzdCLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFZLEVBQUUsRUFBRTtRQUM5QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLGNBQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQ2pEO1lBQ0ksSUFBSSxPQUFPLENBQUMsSUFBSSxHQUFHO1lBQ25CLGFBQWE7WUFDYixnQkFBZ0I7WUFDaEIsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPO1NBQzFCLENBQUMsQ0FBQztRQUNILE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUNELG9EQUFvRDtBQUU3QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBbUIsRUFBRSxFQUFFO1FBQ3JFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUFFLE9BQU87U0FBRTtRQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUUsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osSUFBQSxhQUFLLEVBQUMsOEJBQThCLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZEO1FBQ0QsTUFBTSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osSUFBQSxhQUFLLEVBQUMsYUFBYSxLQUFLLENBQUMsTUFBTSxRQUFRLENBQUMsQ0FBQztTQUM1QztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDO0FBYlcsUUFBQSxRQUFRLFlBYW5CIn0=