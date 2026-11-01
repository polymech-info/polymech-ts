"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const __1 = require("../");
const path = require("path");
const index_1 = require("../lib/process/index");
const pMap = require("p-map");
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
    return pMap(files, (file) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGRmMmpwZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9wZGYyanBnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDJCQUE0QjtBQUM1Qiw2QkFBNEI7QUFDNUIsZ0RBQTZDO0FBQzdDLDhCQUE2QjtBQUU3QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7QUFFL0IsTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLGFBQWE7S0FDMUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsK0JBQStCO0tBQzVDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQztBQUVGLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFekQsS0FBSyxVQUFVLFlBQVksQ0FBQyxLQUFLO0lBQzdCLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBQyxDQUFDLElBQVMsRUFBRSxFQUFFO1FBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsc0dBQXNHO1FBQ3RHLE1BQU0sT0FBTyxHQUFHLGNBQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQ2pEO1lBQ0ksSUFBSSxPQUFPLENBQUMsSUFBSSxNQUFNO1lBQ3RCLGFBQWE7WUFDYixjQUFjO1lBQ2QsT0FBTztZQUNQLFVBQVU7WUFDVixnQkFBZ0I7WUFDaEIsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPO1NBQzFCLENBQUMsQ0FBQztRQUNILE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUMsRUFBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRCxtREFBbUQ7QUFDNUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQW1CLEVBQUUsRUFBRTtRQUNyRSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFDMUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLFVBQU0sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDakQ7UUFDRCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM5RSxNQUFNLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDWixVQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsS0FBSyxDQUFDLE1BQU0sUUFBUSxDQUFDLENBQUM7U0FDbkQ7SUFDTCxDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQWJZLFFBQUEsUUFBUSxZQWFwQiJ9