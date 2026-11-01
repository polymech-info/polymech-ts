import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv<CLI.Omit<{
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
} & {
    percent: number | boolean;
} & {
    width: number | boolean;
} & {
    height: number | boolean;
} & {
    minHeight: number;
} & {
    minWidth: number;
} & {
    minSize: number;
}, "percent"> & {
    percent: number;
} & {
    key: string;
}>;
export declare const register: (cli: CLI.Argv) => CLI.Argv<{}>;
