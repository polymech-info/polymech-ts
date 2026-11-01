import * as CLI from 'yargs';
export declare const command = "watermark";
export declare const desc = "Adds watermarks to images";
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv;
export declare const builder: (yargs: CLI.Argv) => CLI.Argv;
export declare function handler(argv: CLI.Arguments): Promise<{
    src: string;
    dst: string;
}[]>;
