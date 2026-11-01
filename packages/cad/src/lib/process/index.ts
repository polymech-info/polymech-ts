import { logger } from '../../index.js'
import * as stream from 'stream';
import { ChildProcess, exec } from 'child_process';

export enum STATUS {
    OK,
    ERROR,
    PENDING
}

const fatalHandler = (message: string, fn: (msg: string) => void): boolean => {
    if (message.startsWith('fatal:')) {
        fn('\t\ ' + message)
        return true;
    }
    return false
}

// tslint:disable-next-line:no-empty
const subscribe = (signal: stream.Readable, collector: (data: any) => void = () => { }, options: any = {}) => {
    const buffer: string[] = []
    signal.on('message', (message) => logger.debug('message', message))
    signal.on('error', (error) => logger.error('std-error', error))
    signal.on('data', (data) => {
        const message = data.toString()
        buffer.push(message) // .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        collector(buffer)
        logger.debug("\n Process : \n\t", data)
    });
};
const merge = (buffer: string[], data: any): string[] => buffer.concat(data);

const hook = (process: ChildProcess, resolve: any, reject: any, cmd: string, options: any = {}) => {
    let buffer: string[] = [];
    const collector = (data: any) => { buffer = buffer.concat(data); };
    subscribe(process.stdout, collector, options);
    subscribe(process.stderr, collector, options);
    process.on('exit', (code, signal) => {
        if (code) {
            resolve({
                code: STATUS.ERROR,
                command: cmd,
                error: code,
                messages: buffer
            })
        } else {
            resolve({
                code: STATUS.OK,
                command: cmd,
                messages: buffer
            })
        }
    })
    return process
}

export class Process {
    public binary = 'magick';
    public cwd: string = '';
    public args: string = '';
    constructor(options: any = {}) {
        this.binary = options.binary || this.binary;
        this.cwd = options.cwd || process.cwd();
    }
    public optionsToString(options: any): string {
        const args: any[] = [];
        // tslint:disable-next-line:forin
        for (const k in options) {
            const val = options[k];
            if (k.length === 1) {
                // val is true, add '-k'
                if (val === true) {
                    args.push('-' + k);
                } else if (val !== false) {
                    // if val is not false, add '-k val'
                    args.push('-' + k + ' ' + val);
                }
            } else {
                if (val === true) {
                    args.push('--' + k);
                } else if (val !== false) {
                    args.push('--' + k + '=' + val);
                }
            }
        }
        return args.join(' ');
    }
    public optionsToArray(options: any): string[] {
        const args: any[] = []
        // tslint:disable-next-line:forin
        for (const k in options) {
            const val = options[k]
            if (k.length === 1) {
                // val is true, add '-k'
                if (val === true) {
                    args.push('-' + k)
                } else if (val !== false) {
                    // if val is not false, add '-k val'
                    args.push('-' + k + ' ' + val)
                }
            } else {
                if (val === true) {
                    args.push('--' + k);
                } else if (val !== false) {
                    args.push('--' + k + '=' + val)
                }
            }
        }
        return args
    }
    public async exec(command: string, options: any = {}, args: any[] = []): Promise<any> {
        args = [command].concat(args)
        return new Promise<any>((resolve, reject) => {
            const p = exec(this.binary + ' ' + args.join(' '), {
                cwd: this.cwd
            })
            return hook(p, resolve, reject, this.binary + ' ' + args.join(' '), options)
        })
    }
}

export class Helper {
    public static async run(cwd, command: string, args: string[], debug_stream: boolean = false): Promise<any> {
        logger.trace(`Run ${command} in ${cwd} ${args.join(' ')}`)
        const gitProcess = new Process({
            cwd: cwd,
            binary: command
        })
        const p = gitProcess.exec('', {
            debug: debug_stream
        }, args)

        if (!debug_stream) {
            p.catch((e) => logger.error('Error git command : ' + command, e))
        } else {
            logger.trace(command + ' ' + args.join(' '))
        }
        return p
    }
}