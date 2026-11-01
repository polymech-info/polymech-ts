export * from './constants';
export * from './types';
export * from './lib';
export * from './lib/oa/types';
import { logger as _logger } from '@polymech/core/debug';
import { MODULE_NAME } from './constants';
export { Logger } from 'tslog';
let loggers = {};
/*
const _logger = new Logger({
    prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t[{{filePathWithLine}}{{name}}]\t",
    prettyErrorTemplate: "\n{{errorName}} {{errorMessage}}\nerror stack:\n{{errorStack}}",
    prettyErrorStackTemplate: "  • {{fileName}}\t{{method}}\n\t{{filePathWithLine}}",
    prettyErrorParentNamesSeparator: ":",
    prettyErrorLoggerNameDelimiter: "\t",
    stylePrettyLogs: true,
    prettyLogTimeZone: "UTC",
    prettyLogStyles: {
      logLevelName: {
        "*": ["bold", "black", "bgWhiteBright", "dim"],
        SILLY: ["bold", "white"],
        TRACE: ["bold", "whiteBright"],
        DEBUG: ["bold", "green"],
        INFO: ["bold", "blue"],
        WARN: ["bold", "yellow"],
        ERROR: ["bold", "red"],
        FATAL: ["bold", "redBright"],
      },
      dateIsoStr: "white",
      filePathWithLine: "white",
      name: ["white", "bold"],
      nameWithDelimiterPrefix: ["white", "bold"],
      nameWithDelimiterSuffix: ["white", "bold"],
      errorName: ["bold", "bgRedBright", "whiteBright"],
      fileName: ["yellow"],
      fileNameWithLine: "white",
    },
  });
  */
/*
export const __logger = (name: string = MODULE_NAME, options: ISettingsParam = {}): Logger => {
    if (!loggers[name]) {
        const logger: Logger = new Logger({
            name: name,
            type: 'pretty',
            ...options
        });
        // const trans = (transportLogger: LogObj & ILogObjMet)
        (logger as any).attachTransport((logObj) => {
            debugger
            //transports.push(logObj);
        });

        logger.debug('test')

        loggers[name] = logger;
    }
    return loggers[name]
}*/
export const logger = _logger(MODULE_NAME);
/*
export const log = (msg: string, ...args: any) => logger().info(msg, ...args);
export const info = (msg: string, ...args: any) => logger().info(msg, ...args);
export const error = (msg: string, ...args: any) => logger().error(msg, ...args);
export const warn = (msg: string, ...args: any) => logger().warn(msg, ...args);
export const debug = (msg: string, ...args: any) => logger().debug(msg, ...args);
*/
import { substitute as _substitute, substituteAlt as _substituteAlt } from "@polymech/core/strings";
export const substitute = (alt, template, vars = {}) => alt ? _substituteAlt(template, vars) : _substitute(template, vars);
//# sourceMappingURL=index.js.map