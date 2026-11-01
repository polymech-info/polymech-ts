import { logger } from '../../index.js';
import { exec } from 'child_process';
import ansiRegex from 'ansi-regex';
export var STATUS;
(function (STATUS) {
    STATUS[STATUS["OK"] = 0] = "OK";
    STATUS[STATUS["ERROR"] = 1] = "ERROR";
    STATUS[STATUS["PENDING"] = 2] = "PENDING";
})(STATUS || (STATUS = {}));
const defaultFilter = (message) => {
    return message.length > 0 &&
        message !== '\n' &&
        message !== '\r' &&
        message !== '\r\n' &&
        !message.startsWith('Debugger attached') &&
        !message.includes('NODE_TLS_REJECT_UNAUTHORIZED') &&
        !message.includes('Waiting for the debugger to disconnect');
};
// tslint:disable-next-line:no-empty
const subscribe = (signal, collector = () => { }) => {
    signal.on('message', (message) => logger.debug('message', message));
    signal.on('error', (error) => logger.error('std-error', error));
    signal.on('data', (data) => {
        const msg = data.toString().
            replace(ansiRegex(), "");
        if (!defaultFilter(msg)) {
            return;
        }
        collector(msg);
        process.stdout.write(data);
    });
};
const merge = (buffer, data) => buffer.concat(data);
const hook = (process, resolve, reject, cmd, buffer = []) => {
    const collector = (data) => { buffer.push(data); };
    subscribe(process.stdout, collector);
    subscribe(process.stderr, collector);
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
export class Process {
    binary = 'magick';
    cwd = '';
    args = '';
    buffer = [];
    constructor(options = {}) {
        this.binary = options.binary || this.binary;
        this.cwd = options.cwd || process.cwd();
        this.buffer = options.buffer || [];
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
    async exec(command, args = []) {
        args = [command].concat(args);
        try {
            const p = new Promise((resolve, reject) => {
                let cmd = `${this.binary}  ${args.join(' ')}`;
                const p = exec(cmd, { cwd: this.cwd });
                return hook(p, resolve, reject, this.binary + ' ' + args.join(' '), this.buffer);
            });
            return p;
        }
        catch (e) {
            logger.error('Error executing command', e);
        }
    }
}
export class Helper {
    static async run(cwd, cmd, args, buffer = [], debug_stream = false) {
        debug_stream && logger.info(`Run ${cmd} in ${cwd}`, args);
        const gitProcess = new Process({
            cwd,
            binary: cmd,
            buffer
        });
        return gitProcess.exec('', args);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3Byb2Nlc3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRXZDLE9BQU8sRUFBZ0IsSUFBSSxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBRWxELE9BQU8sU0FBUyxNQUFNLFlBQVksQ0FBQTtBQUVsQyxNQUFNLENBQU4sSUFBWSxNQUlYO0FBSkQsV0FBWSxNQUFNO0lBQ2QsK0JBQUUsQ0FBQTtJQUNGLHFDQUFLLENBQUE7SUFDTCx5Q0FBTyxDQUFBO0FBQ1gsQ0FBQyxFQUpXLE1BQU0sS0FBTixNQUFNLFFBSWpCO0FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxPQUFlLEVBQVcsRUFBRTtJQUMvQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNyQixPQUFPLEtBQUssSUFBSTtRQUNoQixPQUFPLEtBQUssSUFBSTtRQUNoQixPQUFPLEtBQUssTUFBTTtRQUNsQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUM7UUFDeEMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLDhCQUE4QixDQUFDO1FBQ2pELENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO0FBQ25FLENBQUMsQ0FBQTtBQUVELG9DQUFvQztBQUNwQyxNQUFNLFNBQVMsR0FBRyxDQUFDLE1BQXVCLEVBQUUsWUFBaUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUU7SUFDdEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7SUFDbkUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUE7SUFDL0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUN2QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3ZCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdEIsT0FBTTtRQUNWLENBQUM7UUFFRCxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDZCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM5QixDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQUNELE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBZ0IsRUFBRSxJQUFTLEVBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFN0UsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFxQixFQUFFLE9BQVksRUFBRSxNQUFXLEVBQUUsR0FBVyxFQUFFLFNBQW1CLEVBQUUsRUFBRSxFQUFFO0lBQ2xHLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBUyxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFBO0lBQ3RELFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQ3BDLFNBQVMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQ3BDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ2hDLElBQUksSUFBSSxFQUFFLENBQUM7WUFDUCxPQUFPLENBQUM7Z0JBQ0osSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLO2dCQUNsQixPQUFPLEVBQUUsR0FBRztnQkFDWixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsTUFBTTthQUNuQixDQUFDLENBQUE7UUFDTixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sQ0FBQztnQkFDSixJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2YsT0FBTyxFQUFFLEdBQUc7Z0JBQ1osUUFBUSxFQUFFLE1BQU07YUFDbkIsQ0FBQyxDQUFBO1FBQ04sQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFBO0lBQ0YsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQyxDQUFBO0FBRUQsTUFBTSxPQUFPLE9BQU87SUFDVCxNQUFNLEdBQUcsUUFBUSxDQUFBO0lBQ2pCLEdBQUcsR0FBVyxFQUFFLENBQUE7SUFDaEIsSUFBSSxHQUFXLEVBQUUsQ0FBQTtJQUNqQixNQUFNLEdBQWEsRUFBRSxDQUFBO0lBQzVCLFlBQVksVUFBZSxFQUFFO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzNDLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQTtJQUN0QyxDQUFDO0lBQ00sZUFBZSxDQUFDLE9BQVk7UUFDL0IsTUFBTSxJQUFJLEdBQVUsRUFBRSxDQUFDO1FBQ3ZCLGlDQUFpQztRQUNqQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ3RCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2pCLHdCQUF3QjtnQkFDeEIsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLENBQUM7cUJBQU0sSUFBSSxHQUFHLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ3ZCLG9DQUFvQztvQkFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDTSxjQUFjLENBQUMsT0FBWTtRQUM5QixNQUFNLElBQUksR0FBVSxFQUFFLENBQUE7UUFDdEIsaUNBQWlDO1FBQ2pDLEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDdEIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3RCLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakIsd0JBQXdCO2dCQUN4QixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQTtnQkFDdEIsQ0FBQztxQkFBTSxJQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsb0NBQW9DO29CQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUNsQyxDQUFDO1lBQ0wsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixDQUFDO3FCQUFNLElBQUksR0FBRyxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBO2dCQUNuQyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQTtJQUNmLENBQUM7SUFDTSxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQWUsRUFBRSxPQUFpQixFQUFFO1FBQ2xELElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM3QixJQUFJLENBQUM7WUFDRCxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDM0MsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQTtnQkFDN0MsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtnQkFDdEMsT0FBTyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDcEYsQ0FBQyxDQUFDLENBQUE7WUFDRixPQUFPLENBQUMsQ0FBQTtRQUNaLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsTUFBTSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM5QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsTUFBTSxPQUFPLE1BQU07SUFDUixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBVyxFQUFFLElBQWMsRUFBRSxTQUFtQixFQUFFLEVBQUUsZUFBd0IsS0FBSztRQUMxRyxZQUFZLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUN6RCxNQUFNLFVBQVUsR0FBRyxJQUFJLE9BQU8sQ0FBQztZQUMzQixHQUFHO1lBQ0gsTUFBTSxFQUFFLEdBQUc7WUFDWCxNQUFNO1NBQ1QsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0NBQ0oifQ==