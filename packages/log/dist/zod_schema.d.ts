import { z } from 'zod';

declare const TLogLevelNameSchema: z.ZodEnum<["silly", "trace", "debug", "info", "warn", "error", "fatal"]>;
type LogLevel = z.infer<typeof TLogLevelNameSchema>;
declare enum LogLevelEx {
    silly = 0,
    trace = 1,
    debug = 2,
    info = 3,
    warn = 4,
    error = 5,
    fatal = 6
}

export { type LogLevel, LogLevelEx, TLogLevelNameSchema };
