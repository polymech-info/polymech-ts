import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv;
export declare const command = "background:remove:bria";
export declare const desc = "Remove background from images using Bria AI";
export declare const builder: (yargs: CLI.Argv) => CLI.Argv;
export declare function handler(argv: CLI.Arguments): Promise<void>;
