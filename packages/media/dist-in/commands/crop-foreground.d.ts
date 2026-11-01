import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv;
export declare const command = "image-crop:foreground";
export declare const desc = "Crop foreground from images using Bria AI";
export declare const builder: (yargs: CLI.Argv) => CLI.Argv;
export declare function handler(argv: CLI.Arguments): Promise<void>;
