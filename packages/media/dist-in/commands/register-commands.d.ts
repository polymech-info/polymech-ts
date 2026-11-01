import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => any;
export declare const command = "register-commands";
export declare const desc = "Register all pm-media commands in Salamander menu";
export declare const builder: (yargs: CLI.Argv) => any;
export declare function handler(argv: CLI.Arguments): Promise<void>;
