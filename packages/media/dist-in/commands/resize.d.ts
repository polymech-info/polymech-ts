import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => any;
export declare const command = "resize";
export declare const desc = "Resizes files";
export declare const builder: (yargs: CLI.Argv) => any;
export declare function handler(argv: CLI.Arguments): Promise<void>;
