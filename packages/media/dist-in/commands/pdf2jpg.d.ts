import * as CLI from 'yargs';
export declare const command = "pdf2jpg";
export declare const desc = "Convert PDF to images";
export declare const builder: (yargs: CLI.Argv) => CLI.Argv;
export declare function handler(argv: CLI.Arguments): Promise<void>;
