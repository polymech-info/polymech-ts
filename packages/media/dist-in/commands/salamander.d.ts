import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => any;
export declare const command = "salamander";
export declare const desc = "Generate Salamander file manager menu entries from JSON configuration";
export declare const builder: (yargs: CLI.Argv) => any;
export declare function handler(argv: CLI.Arguments): Promise<void>;
