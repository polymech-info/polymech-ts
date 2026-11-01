"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Helper = exports.Process = exports.STATUS = void 0;
const __1 = require("../..");
const child_process_1 = require("child_process");
const platform_1 = require("../common/platform");
var STATUS;
(function (STATUS) {
    STATUS[STATUS["OK"] = 0] = "OK";
    STATUS[STATUS["ERROR"] = 1] = "ERROR";
    STATUS[STATUS["PENDING"] = 2] = "PENDING";
})(STATUS = exports.STATUS || (exports.STATUS = {}));
const fatalHandler = (message, fn) => {
    if (message.startsWith('fatal:')) {
        fn('\t\ ' + message);
        return true;
    }
    return false;
};
// tslint:disable-next-line:no-empty
const subscribe = (signal, collector = () => { }) => {
    const buffer = [];
    signal.on('message', (message) => __1.logger.debug('message', message));
    signal.on('error', (error) => __1.logger.error('std-error', error));
    signal.on('data', (data) => {
        const message = data.toString();
        buffer.push(message); // .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        collector(buffer);
    });
};
const merge = (buffer, data) => buffer.concat(data);
const hook = (process, resolve, reject, cmd) => {
    let buffer = [];
    const collector = (data) => { buffer = buffer.concat(data); };
    const stdout = subscribe(process.stdout, collector);
    const stderr = subscribe(process.stderr, collector);
    process.on('exit', (code, signal) => {
        if (code) {
            resolve({
                code: STATUS.ERROR,
                command: cmd,
                error: code,
                messages: buffer
            });
        }
        else {
            resolve({
                code: STATUS.OK,
                command: cmd,
                messages: buffer
            });
        }
    });
    return process;
};
class Process {
    binary = 'magick';
    cwd = '';
    args = '';
    constructor(options = {}) {
        this.binary = options.binary || this.binary;
        //this.binary = path.resolve(which(this.binary));
        this.cwd = options.cwd || process.cwd();
    }
    optionsToString(options) {
        const args = [];
        // tslint:disable-next-line:forin
        for (const k in options) {
            const val = options[k];
            if (k.length === 1) {
                // val is true, add '-k'
                if (val === true) {
                    args.push('-' + k);
                }
                else if (val !== false) {
                    // if val is not false, add '-k val'
                    args.push('-' + k + ' ' + val);
                }
            }
            else {
                if (val === true) {
                    args.push('--' + k);
                }
                else if (val !== false) {
                    args.push('--' + k + '=' + val);
                }
            }
        }
        return args.join(' ');
    }
    optionsToArray(options) {
        const args = [];
        // tslint:disable-next-line:forin
        for (const k in options) {
            const val = options[k];
            if (k.length === 1) {
                // val is true, add '-k'
                if (val === true) {
                    args.push('-' + k);
                }
                else if (val !== false) {
                    // if val is not false, add '-k val'
                    args.push('-' + k + ' ' + val);
                }
            }
            else {
                if (val === true) {
                    args.push('--' + k);
                }
                else if (val !== false) {
                    args.push('--' + k + '=' + val);
                }
            }
        }
        return args;
    }
    async exec(command, options = {}, args = []) {
        args = [command].concat(args);
        return new Promise((resolve, reject) => {
            const p = (0, child_process_1.exec)(this.binary + ' ' + args.join(' '), {
                cwd: this.cwd
            });
            return hook(p, resolve, reject, this.binary + ' ' + args.join(' '));
        });
    }
}
exports.Process = Process;
class Helper {
    static async run(cwd, command, gitArgs) {
        const gitProcess = new Process({
            cwd: cwd,
            binary: (0, platform_1.os)() == 'windows' ? 'magick' : ''
        });
        const p = gitProcess.exec(command, {}, gitArgs);
        p.catch((e) => __1.logger.error('Error git command : ' + command));
        return p;
    }
    static async runBin(cwd, bin, command, gitArgs) {
        const gitProcess = new Process({
            cwd: cwd,
            binary: bin
        });
        const p = gitProcess.exec(command, {}, gitArgs);
        p.catch((e) => __1.logger.error('Error git command : ' + command));
        return p;
    }
}
exports.Helper = Helper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3Byb2Nlc3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQStCO0FBRS9CLGlEQUFtRDtBQUNuRCxpREFBd0M7QUFFeEMsSUFBWSxNQUlYO0FBSkQsV0FBWSxNQUFNO0lBQ2QsK0JBQUUsQ0FBQTtJQUNGLHFDQUFLLENBQUE7SUFDTCx5Q0FBTyxDQUFBO0FBQ1gsQ0FBQyxFQUpXLE1BQU0sR0FBTixjQUFNLEtBQU4sY0FBTSxRQUlqQjtBQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQXlCLEVBQVcsRUFBRTtJQUN6RSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDOUIsRUFBRSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQztRQUNyQixPQUFPLElBQUksQ0FBQztLQUNmO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQyxDQUFDO0FBRUYsb0NBQW9DO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLENBQUMsTUFBdUIsRUFBRSxZQUFpQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRTtJQUN0RixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7SUFDNUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDcEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLFVBQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHdDQUF3QztRQUM5RCxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFDRixNQUFNLEtBQUssR0FBRyxDQUFDLE1BQWdCLEVBQUUsSUFBUyxFQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRTdFLE1BQU0sSUFBSSxHQUFHLENBQUMsT0FBcUIsRUFBRSxPQUFZLEVBQUUsTUFBVyxFQUFFLEdBQVcsRUFBRSxFQUFFO0lBQzNFLElBQUksTUFBTSxHQUFhLEVBQUUsQ0FBQztJQUMxQixNQUFNLFNBQVMsR0FBRyxDQUFDLElBQVMsRUFBRSxFQUFFLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEQsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDaEMsSUFBSSxJQUFJLEVBQUU7WUFDTixPQUFPLENBQUM7Z0JBQ0osSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUNsQixPQUFPLEVBQUUsR0FBRztnQkFDWixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsTUFBTTthQUNuQixDQUFDLENBQUM7U0FDTjthQUFNO1lBQ0gsT0FBTyxDQUFDO2dCQUNKLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDZixPQUFPLEVBQUUsR0FBRztnQkFDWixRQUFRLEVBQUUsTUFBTTthQUNuQixDQUFDLENBQUM7U0FDTjtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyxDQUFDO0FBRUYsTUFBYSxPQUFPO0lBQ1QsTUFBTSxHQUFHLFFBQVEsQ0FBQztJQUNsQixHQUFHLEdBQVcsRUFBRSxDQUFDO0lBQ2pCLElBQUksR0FBVyxFQUFFLENBQUM7SUFDekIsWUFBWSxVQUFlLEVBQUU7UUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDNUMsaURBQWlEO1FBQ2pELElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDNUMsQ0FBQztJQUNNLGVBQWUsQ0FBQyxPQUFZO1FBQy9CLE1BQU0sSUFBSSxHQUFVLEVBQUUsQ0FBQztRQUN2QixpQ0FBaUM7UUFDakMsS0FBSyxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUU7WUFDckIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ2hCLHdCQUF3QjtnQkFDeEIsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO29CQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUN0QjtxQkFBTSxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUU7b0JBQ3RCLG9DQUFvQztvQkFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztpQkFDbEM7YUFDSjtpQkFBTTtnQkFDSCxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7b0JBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZCO3FCQUFNLElBQUksR0FBRyxLQUFLLEtBQUssRUFBRTtvQkFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztpQkFDbkM7YUFDSjtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDTSxjQUFjLENBQUMsT0FBWTtRQUM5QixNQUFNLElBQUksR0FBVSxFQUFFLENBQUM7UUFDdkIsaUNBQWlDO1FBQ2pDLEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFO1lBQ3JCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNoQix3QkFBd0I7Z0JBQ3hCLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtvQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDdEI7cUJBQU0sSUFBSSxHQUFHLEtBQUssS0FBSyxFQUFFO29CQUN0QixvQ0FBb0M7b0JBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7aUJBQ2xDO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO29CQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUN2QjtxQkFBTSxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUU7b0JBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7aUJBQ25DO2FBQ0o7U0FDSjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQWUsRUFBRSxVQUFlLEVBQUUsRUFBRSxPQUFjLEVBQUU7UUFDbEUsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzlCLE9BQU8sSUFBSSxPQUFPLENBQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDeEMsTUFBTSxDQUFDLEdBQUcsSUFBQSxvQkFBSSxFQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQy9DLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRzthQUNoQixDQUFDLENBQUM7WUFDSCxPQUFPLElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFoRUQsMEJBZ0VDO0FBRUQsTUFBYSxNQUFNO0lBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQWUsRUFBRSxPQUFpQjtRQUMzRCxNQUFNLFVBQVUsR0FBRyxJQUFJLE9BQU8sQ0FBQztZQUMzQixHQUFHLEVBQUUsR0FBRztZQUNSLE1BQU0sRUFBRSxJQUFBLGFBQUUsR0FBRSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO1NBQzVDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0lBQ00sTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBRSxPQUFlLEVBQUUsT0FBaUI7UUFDbEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxPQUFPLENBQUM7WUFDM0IsR0FBRyxFQUFFLEdBQUc7WUFDUixNQUFNLEVBQUUsR0FBRztTQUNkLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxVQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0NBQ0o7QUFuQkQsd0JBbUJDIn0=