import { logger } from '../../index.js'
import * as stream from 'stream'
import { ChildProcess, spawn } from 'child_process'

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

const defaultFilter = (message: string): boolean => {
    return message.length > 0 &&
        message !== '\n' &&
        message !== '\r' &&
        message !== '\r\n' &&
        !message.startsWith('Debugger attached') &&
        !message.includes('NODE_TLS_REJECT_UNAUTHORIZED') &&
        !message.includes('Waiting for the debugger to disconnect')
}

const subscribe = (signal: stream.Readable, collector: (data: any) => void = () => { }) => {
    if(!signal || !signal.on) {
        return
    }
    signal.on('message', (message) => logger.debug('message', message))
    signal.on('error', (error) => logger.error('std-error', error))
    signal.on('data', (data) => {
        /*
        const msg = data.toString().replace(ansiRegex(), "")
        if (!defaultFilter(msg)) {
            return
        }
        collector(msg)*/
        process.stdout.write(data)

    })
}
const merge = (buffer: string[], data: any): string[] => buffer.concat(data);

const hook = (child: ChildProcess, resolve: any, reject: any, cmd: string, buffer: string[] = []) => {
    const collector = (data: any) => { buffer.push(data) }
    //subscribe(child.stderr, collector)
    //process.stdin.pipe(child.stdin)
    debugger
    child.on('exit', (code, signal) => {
        debugger
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
    return child
}

export class Process {
    public binary = ''
    public cwd: string = ''
    public args: string = ''
    public buffer: string[] = []
    constructor(options: any = {}) {
        this.binary = options.binary || this.binary
        this.cwd = options.cwd || process.cwd()
        this.buffer = options.buffer || []
    }
    public async exec(command: string, args: string[] = []): Promise<any> {
        args = [command].concat(args)
        try {
            let cmd = `${this.binary}  ${args.join(' ')}`
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
                debugger
                const p = new Promise<any>((resolve, reject) => {
                    const cp = spawn(cmd, args, {
                        cwd: this.cwd,
                        shell: true,
                        stdio:'inherit',
                        env: {
                            ...process.env
                        },
                    })
                    return hook(cp, resolve, reject, cmd, this.buffer)
                })
                return p
            } catch (e) {
                logger.error('Error executing command', e)
            }
        } catch (e) {
            logger.error('Error executing command', e)
        }
    }
}

export class Helper {
    public static async run(cwd, cmd: string, args: string[], buffer: string[] = [], debug_stream: boolean = false): Promise<any> {
        debug_stream && logger.info(`Run ${cmd} in ${cwd}`, args)
        const gitProcess = new Process({
            cwd,
            binary: cmd,
            buffer
        })
        return gitProcess.exec('', args)
    }
}