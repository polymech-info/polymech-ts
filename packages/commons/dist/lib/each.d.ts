import { z } from 'zod';
import * as CLI from 'yargs';
import { IOptionsEach } from './types.js';
export declare const handleFs: (path: string) => Promise<string | object>;
export declare const schemeHandlers: Record<string, (arg1: string, arg2?: URLSearchParams) => Promise<string | object>>;
export declare const parseCustomUrl: (url: string) => Promise<string | object>;
export declare const zodSchema: () => z.ZodObject<{
    logLevel: z.ZodDefault<z.ZodString>;
    main: z.ZodString;
    log: z.ZodOptional<z.ZodString>;
    list: z.ZodString;
    root: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    trace: z.ZodDefault<z.ZodBoolean>;
    env: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const yargsOptions: (yargs: CLI.Argv) => CLI.Argv;
export declare const each: (opts: IOptionsEach) => Promise<any[]>;
