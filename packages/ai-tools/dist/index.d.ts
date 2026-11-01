import { z } from 'zod';
import { ISettingsParam, Logger } from "tslog";
import * as winston from 'winston';
import { IKBotTask } from './types.js';
export declare let logger: Logger<unknown>;
export declare const TLogLevelNameSchema: z.ZodEnum<{
    silly: "silly";
    trace: "trace";
    debug: "debug";
    info: "info";
    warn: "warn";
    error: "error";
    fatal: "fatal";
}>;
export type LogLevel = z.infer<typeof TLogLevelNameSchema>;
export declare enum LogLevelEx {
    silly = 0,
    trace = 1,
    debug = 2,
    info = 3,
    warn = 4,
    error = 5,
    fatal = 6
}
export declare enum ELogTargets {
    Console = 1,
    FileText = 2,
    FileJson = 4,
    Seq = 8
}
export declare function createLogger(name: string, options?: ISettingsParam<any>): Logger<unknown>;
export declare const defaultLogger: Logger<unknown>;
export declare const winstonLogger: (name: string, file: string, targets?: ELogTargets) => winston.Logger;
export declare const createFileLogger: (logger: Logger<unknown>, level: number, file: string) => Logger<unknown>;
export declare const toolLoggerTS: (name: any, options: IKBotTask) => Logger<unknown>;
export declare const toolLogger: (name: any, options?: IKBotTask) => winston.Logger;
export * from './types.js';
export * from './types_kbot.js';
