/*import * as chalk  from 'chalk';*/
import { default as chalk } from 'chalk';
import * as util from 'util';
import * as _ora from 'ora';
// tslint:disable-next-line:no-var-requires
const jsome = require('jsome');
jsome.level.show = true;
const glog = console.log;
export const log = (msg: string, ...rest) => glog(chalk.magenta(msg), ...rest);
export const info = (msg: string, d?: any) => glog(chalk.green(msg), d || '');
export const error = (msg: string, ...rest) => glog(chalk.red(msg), ...rest);
export const warn = (msg: string, d?: any) => glog(chalk.yellow(msg), d || '');
export const debug = (msg: string, d?: any) => glog(chalk.blue(msg), d || '');
export const stack = (msg: string, d?: any) => glog(chalk.red(msg), new Error().stack);
export const inspect = (msg: string, d: any = null, pretty: boolean = true) => {
    glog(chalk.blue(msg));
    d && jsome(d);
};
export const spinner = (msg: string): any => _ora(msg);
