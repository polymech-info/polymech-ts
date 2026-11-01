import * as path from 'path'
import { z } from 'zod'

import { ISettingsParam, Logger } from "tslog"

import * as winston from 'winston'
import TransportStream from 'winston-transport'
import { SeqTransport} from '@datalust/winston-seq'
import { createStream } from "rotating-file-stream"

import { CONFIG_DEFAULT } from '@polymech/commons'
import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'
import { sync as exists } from '@polymech/fs/exists'

import { IKBotTask } from './types.js'

export let logger: Logger<unknown> = createLogger('osr-ai-tools')
export const TLogLevelNameSchema = z.enum(["silly", "trace", "debug", "info", "warn", "error", "fatal"])
export type LogLevel = z.infer<typeof TLogLevelNameSchema>
export enum LogLevelEx {
    silly,
    trace,
    debug,
    info,
    warn,
    error,
    fatal
}
export enum ELogTargets {
    Console = 1 << 0,
    FileText = 1 << 1,
    FileJson = 1 << 2,
    Seq = 1 << 3
}
export function createLogger(name: string, options?: ISettingsParam<any>) {
    return new Logger<unknown>({
        name,
        type: 'pretty',
        ...options,
    })
}
export const defaultLogger = createLogger('DefaultLogger', {
    minLevel: LogLevelEx.info
})

class JsonArrayFileTransport extends TransportStream {
    filename: string;
    constructor(opts) {
        super(opts);
        opts.filename = opts.filename
        this.filename = opts.filename || 'logs.json';
        setImmediate(() => this.emit('opened'))
    }
    log(info: any, next: () => void): void {
        setImmediate(() => this.emit('logged', info))
        const { level, message, exception, stack, ...props } = info;
        const fileExists = exists(this.filename)
        const existingLogs = fileExists
            ? read(this.filename, 'json') as []
            : [];

        const entry = {
            level: info.level,
            message: info.message,
            timestamp: new Date().toISOString(),
            ...info
        };
        existingLogs.push(entry)
        write(this.filename, existingLogs)
        next()
    }
    close(): void {
        setImmediate(() => this.emit('closed'))
    }
    flush(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true)
        })
    }
}

class TSLogTransport extends TransportStream {
    constructor(opts) {
        super(opts);
        setImmediate(() => this.emit('opened'))
    }
    log(info: any, next: () => void): void {
        setImmediate(() => this.emit('logged', info))
        const { level, message, exception, stack, ...props } = info;
        defaultLogger.info(info)
        next()
    }
}

export const winstonLogger = (name: string, file: string, targets: ELogTargets = ELogTargets.Console | ELogTargets.FileJson)  => {
    const logger = winston.createLogger({
        defaultMeta: { service: name },
        level: 'debug',
        transports: []
    })
    if (targets & ELogTargets.Console) {
        //logger.add(new TSLogTransport({}))
        logger.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'MM/DD/YYYY hh:mm:ss.SSS' }),
                ///winston.format.json(),
                winston.format.colorize(),
                winston.format.printf(info => {
                    let message = null
                    try {
                        message = JSON.stringify(info.message)
                    }   catch (e) { 
                        
                    }
                    return `[${info.level}] [${name}] | message: ${message.substring(0, 200)}`
                }))
        }))
    }

    if (targets & ELogTargets.FileText) {
        logger.add(new winston.transports.File({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.timestamp({ format: 'MM/DD/YYYY hh:mm:ss.SSS' }),
                winston.format.json(),
                winston.format.printf(info => {
                    return JSON.stringify(info, null, 2);
                })),
            dirname: path.parse(file).dir,
            filename: path.parse(file).base
        }))
    }

    if (targets & ELogTargets.FileJson) {
        logger.add(new JsonArrayFileTransport({
            filename: file
        }))
    }

    if (targets & ELogTargets.Seq) {
        const config = CONFIG_DEFAULT() as any
        if (config.seq) {
            logger.add(new SeqTransport({
                ...config.seq,
                onError: (e => { })
            }))
        }
    }
    return logger
}

export const createFileLogger = (logger: Logger<unknown>, level: number, file: string): Logger<unknown> => {
    const rfs = createStream(file,
        {
            size: "10M", // rotate every 10 MegaBytes written
            interval: "1d", // rotate daily
            compress: "gzip", // compress rotated files
        });

    const log = new Logger({
        type: "json",
        attachedTransports: [
            (logObj) => {
                rfs.write(JSON.stringify(logObj) + "\n");
            },
        ],
    });
    return log
}

export const toolLoggerTS = (name, options: IKBotTask) => {    
    let log = createLogger(name)
    //log.settings.minLevel = options.logLevel
    log = createFileLogger(log,options.logLevel, path.join(options.logs,`tools-${name}.json`))
    return log
}

export const toolLogger = (name, options: IKBotTask = { logs: process.cwd() } as IKBotTask ) => {    
    const logPath = path.resolve(path.join(options.logs || './',`tools-${name}.json`))
    const log = winstonLogger(name, logPath, ELogTargets.Console)
    return log
}

export * from './types.js'
export * from './types_kbot.js'
