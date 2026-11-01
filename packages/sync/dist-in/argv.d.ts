import * as CLI from 'yargs';
import { IDefaultCLIArgs } from './types.js';
export declare const default_profile: {
    debug: boolean;
    verbose: boolean;
    matching: string[];
};
export declare const sanitize: (argv: any) => IDefaultCLIArgs;
export declare const defaultOptions: (yargs: CLI.Argv) => any;
