"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const __1 = require("../");
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
    return bluebird.resolve(files).map((file) => {
        const inParts = path.parse(file);
        // magick convert leg.pdf -quality 100 -density 250 -trim -flatten -resize 200% -sharpen 0x1.0 leg.jpg
        const promise = index_1.Helper.run(inParts.dir, 'convert', [
            `"${inParts.base}[0]"`,
            '-quality 80',
            '-density 250',
            '-trim',
            '-flatten',
            '-sharpen 0x1.0',
            `"${inParts.name}.jpg"`
        ]);
        return promise;
    }, { concurrency: 1 });
}
// node ./build/main.js pdf2jpg --input=../drawings
const register = (cli) => {
    return cli.command('pdf2jpg', '', options, async (argv) => {
        if (argv.help) {
            return;
        }
        const src = path.resolve('' + argv.input);
        if (argv.debug) {
            __1.logger.debug(`Begin convert PDF files${src}`);
        }
        const files = fg.sync('*.pdf|*.PDF', { dot: true, cwd: src, absolute: true });
        await convertFiles(files);
        if (argv.debug) {
            __1.logger.debug(`Converted ${files.length} files`);
        }
    });
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmMmpwZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9wZGYyanBnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJCQUE2QjtBQUM3Qiw2QkFBNkI7QUFDN0IsZ0RBQThDO0FBQzlDLHFDQUFxQztBQUVyQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFaEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLGFBQWE7S0FDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsK0JBQStCO0tBQzVDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQztBQUVGLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFekQsS0FBSyxVQUFVLFlBQVksQ0FBQyxLQUFLO0lBQzdCLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFTLEVBQUUsRUFBRTtRQUM3QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLHNHQUFzRztRQUN0RyxNQUFNLE9BQU8sR0FBRyxjQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUNqRDtZQUNJLElBQUksT0FBTyxDQUFDLElBQUksTUFBTTtZQUN0QixhQUFhO1lBQ2IsY0FBYztZQUNkLE9BQU87WUFDUCxVQUFVO1lBQ1YsZ0JBQWdCO1lBQ2hCLElBQUksT0FBTyxDQUFDLElBQUksT0FBTztTQUMxQixDQUFDLENBQUM7UUFDSCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDLEVBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQsbURBQW1EO0FBQzVDLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBYSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDckUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsT0FBTztTQUFFO1FBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDWixVQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ2pEO1FBQ0QsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUUsTUFBTSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osVUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxNQUFNLFFBQVEsQ0FBQyxDQUFDO1NBQ25EO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFiVyxRQUFBLFFBQVEsWUFhbkIifQ==