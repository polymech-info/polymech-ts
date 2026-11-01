import * as CLI from 'yargs';
import { ZodObject } from 'zod';
export declare const registerCommand: (cli: CLI.Argv, name: any, description: any, options: any, zodSchema: () => ZodObject<any>, main: (opts: any, argv: any) => Promise<any>) => any;
export declare const registerCommands: (cli: CLI.Argv) => void;
