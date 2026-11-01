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
const index_1 = require("../index");
const _cli_1 = require("../_cli");
const sheets_1 = require("../lib/net/sheets");
let options = (yargs) => (0, _cli_1.defaultOptions)(yargs);
// node ./main.js init google-sheets --sheet='1oVEiGH4o3SV-mAA3Mb-WNVJMyYl4VMxLjWjrSw_ipJY' --range='Parts!B4:B5'
const initGSheets = (sheet, range) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, sheets_1.read)(sheet, range);
});
const register = (cli) => {
    return cli.command('init <verb>', 'Initialize specific language features', options, (argv) => __awaiter(void 0, void 0, void 0, function* () {
        if (argv.help) {
            return;
        }
        const verb = argv.verb;
        if (!verb) {
            index_1.logger.error(`You need to specify a verb`);
        }
        if (verb === 'google-sheets') {
            const sheet = argv.sheet;
            const range = argv.range;
            initGSheets(sheet, range).then((d) => {
                index_1.logger.info('done google auth | sheet result', d);
            });
        }
    }));
};
exports.register = register;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kcy9pbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLG9DQUFrQztBQUNsQyxrQ0FBeUM7QUFDekMsOENBQXlDO0FBRXpDLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHFCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUM7QUFFekQsaUhBQWlIO0FBRWpILE1BQU0sV0FBVyxHQUFHLENBQU8sS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO0lBQ3ZDLE9BQU8sSUFBQSxhQUFJLEVBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxDQUFBO0FBQzVCLENBQUMsQ0FBQSxDQUFBO0FBRU0sTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFhLEVBQUUsRUFBRTtJQUN0QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLHVDQUF1QyxFQUFFLE9BQU8sRUFBRSxDQUFPLElBQW1CLEVBQUUsRUFBRTtRQUM5RyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDWCxPQUFPO1NBQ1Y7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3ZCLElBQUcsQ0FBQyxJQUFJLEVBQUM7WUFDTCxjQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFHLElBQUksS0FBRyxlQUFlLEVBQUM7WUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLFdBQVcsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUU7Z0JBQy9CLGNBQU0sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxDQUFFLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUE7U0FDTDtJQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFsQlcsUUFBQSxRQUFRLFlBa0JuQiJ9