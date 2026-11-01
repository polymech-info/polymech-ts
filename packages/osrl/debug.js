"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinner = exports.inspect = exports.debug = exports.warn = exports.error = exports.info = exports.log = void 0;
const chalk_1 = require("chalk");
const ora = require("ora");
// tslint:disable-next-line:no-var-requires
const jsome = require('jsome');
jsome.level.show = true;
const glog = console.log;
const log = (msg, d) => glog(chalk_1.default.magenta(msg), d || '');
exports.log = log;
const info = (msg, d) => glog(chalk_1.default.green(msg), d || '');
exports.info = info;
const error = (msg, d) => glog(chalk_1.default.red(msg), d || '');
exports.error = error;
const warn = (msg, d) => glog(chalk_1.default.yellow(msg), d || '');
exports.warn = warn;
const debug = (msg, d) => glog(chalk_1.default.blue(msg), d || '');
exports.debug = debug;
const inspect = (msg, d = null, pretty = true) => {
    glog(chalk_1.default.blue(msg));
    d && jsome(d);
};
exports.inspect = inspect;
const spinner = (msg) => ora(msg);
exports.spinner = spinner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQXlDO0FBQ3pDLDJCQUEyQjtBQUMzQiwyQ0FBMkM7QUFDM0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUN4QixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ2xCLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBVyxFQUFFLENBQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQWxFLFFBQUEsR0FBRyxPQUErRDtBQUN4RSxNQUFNLElBQUksR0FBRyxDQUFDLEdBQVcsRUFBRSxDQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUFqRSxRQUFBLElBQUksUUFBNkQ7QUFDdkUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFXLEVBQUUsQ0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFBaEUsUUFBQSxLQUFLLFNBQTJEO0FBQ3RFLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBVyxFQUFFLENBQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQWxFLFFBQUEsSUFBSSxRQUE4RDtBQUN4RSxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQVcsRUFBRSxDQUFPLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUFqRSxRQUFBLEtBQUssU0FBNEQ7QUFDdkUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQUUsSUFBUyxJQUFJLEVBQUUsU0FBa0IsSUFBSSxFQUFFLEVBQUU7SUFDMUUsSUFBSSxDQUFDLGVBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN0QixDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQUhXLFFBQUEsT0FBTyxXQUdsQjtBQUNLLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFBcEMsUUFBQSxPQUFPLFdBQTZCIn0=