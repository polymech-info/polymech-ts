import * as CLI from 'yargs';
export declare const command = "register-explorer";
export declare const desc = "Forward to media-img.exe register-explorer (Windows; implementation is in C++)";
export declare const builder: (yargs: CLI.Argv) => any;
export declare function handler(): Promise<void>;
