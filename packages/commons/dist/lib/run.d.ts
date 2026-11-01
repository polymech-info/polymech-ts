import * as CLI from 'yargs';
import { z } from 'zod';
export declare const zodSchema: () => z.ZodObject<{
    config: z.ZodDefault<z.ZodString>;
    dry: z.ZodDefault<z.ZodBoolean>;
    list: z.ZodDefault<z.ZodBoolean>;
    projectPath: z.ZodDefault<z.ZodString>;
    logFilePath: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const run: (options: any, argv: any) => Promise<boolean>;
export declare const yargsOptions: (yargs: CLI.Argv) => CLI.Argv;
