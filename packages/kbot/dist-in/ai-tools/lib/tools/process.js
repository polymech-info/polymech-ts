import { logger } from '../../index.js';
import { spawn } from 'child_process';
export var STATUS;
(function (STATUS) {
    STATUS[STATUS["OK"] = 0] = "OK";
    STATUS[STATUS["ERROR"] = 1] = "ERROR";
    STATUS[STATUS["PENDING"] = 2] = "PENDING";
})(STATUS || (STATUS = {}));
const fatalHandler = (message, fn) => {
    if (message.startsWith('fatal:')) {
        fn('\t\ ' + message);
        return true;
    }
    return false;
};
const defaultFilter = (message) => {
    return message.length > 0 &&
        message !== '\n' &&
        message !== '\r' &&
        message !== '\r\n' &&
        !message.startsWith('Debugger attached') &&
        !message.includes('NODE_TLS_REJECT_UNAUTHORIZED') &&
        !message.includes('Waiting for the debugger to disconnect');
};
const subscribe = (signal, collector = () => { }) => {
    if (!signal || !signal.on) {
        return;
    }
    signal.on('message', (message) => logger.debug('message', message));
    signal.on('error', (error) => logger.error('std-error', error));
    signal.on('data', (data) => {
        /*
        const msg = data.toString().replace(ansiRegex(), "")
        if (!defaultFilter(msg)) {
            return
        }
        collector(msg)*/
        process.stdout.write(data);
    });
};
const merge = (buffer, data) => buffer.concat(data);
const hook = (child, resolve, reject, cmd, buffer = []) => {
    const collector = (data) => { buffer.push(data); };
    //subscribe(child.stderr, collector)
    //process.stdin.pipe(child.stdin)
    debugger;
    child.on('exit', (code, signal) => {
        debugger;
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
    return child;
};
export class Process {
    binary = '';
    cwd = '';
    args = '';
    buffer = [];
    constructor(options = {}) {
        this.binary = options.binary || this.binary;
        this.cwd = options.cwd || process.cwd();
        this.buffer = options.buffer || [];
    }
    async exec(command, args = []) {
        args = [command].concat(args);
        try {
            let cmd = `${this.binary}  ${args.join(' ')}`;
            /*
            const p = new Promise<any>((resolve, reject) => {
                const p = exec(cmd, {
                    cwd: this.cwd
                })
                return hook(p, resolve, reject, this.binary + ' ' + args.join(' '), this.buffer)
            })
            return p
            */
            try {
                //stdio: ['pipe', 'pipe', 'pipe'],
                debugger;
                const p = new Promise((resolve, reject) => {
                    const cp = spawn(cmd, args, {
                        cwd: this.cwd,
                        shell: true,
                        stdio: 'inherit',
                        env: {
                            ...process.env
                        },
                    });
                    return hook(cp, resolve, reject, cmd, this.buffer);
                });
                return p;
            }
            catch (e) {
                logger.error('Error executing command', e);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9haS10b29scy9saWIvdG9vbHMvcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFFdkMsT0FBTyxFQUFnQixLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFbkQsTUFBTSxDQUFOLElBQVksTUFJWDtBQUpELFdBQVksTUFBTTtJQUNkLCtCQUFFLENBQUE7SUFDRixxQ0FBSyxDQUFBO0lBQ0wseUNBQU8sQ0FBQTtBQUNYLENBQUMsRUFKVyxNQUFNLEtBQU4sTUFBTSxRQUlqQjtBQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQXlCLEVBQVcsRUFBRTtJQUN6RSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUMvQixFQUFFLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFBO1FBQ3BCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQTtBQUNoQixDQUFDLENBQUE7QUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQWUsRUFBVyxFQUFFO0lBQy9DLE9BQU8sT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQ3JCLE9BQU8sS0FBSyxJQUFJO1FBQ2hCLE9BQU8sS0FBSyxJQUFJO1FBQ2hCLE9BQU8sS0FBSyxNQUFNO1FBQ2xCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQztRQUN4QyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsOEJBQThCLENBQUM7UUFDakQsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLHdDQUF3QyxDQUFDLENBQUE7QUFDbkUsQ0FBQyxDQUFBO0FBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUF1QixFQUFFLFlBQWlDLEdBQUcsRUFBRSxHQUFHLENB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