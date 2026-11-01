import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv<{
    src: unknown;
} & {
    dst: unknown;
} & {
    debug: boolean;
} & {
    alt: boolean;
} & {
    dry: boolean;
} & {
    verbose: boolean;
}>;
export declare const register: (cli: CLI.Argv) => CLI.Argv<{}>;
