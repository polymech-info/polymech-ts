import * as CLI from 'yargs';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv<{
    src: string;
} & {
    transport: string;
} & {
    from: string;
} & {
    to: string;
} & {
    subject: string;
} & {
    alt: boolean;
} & {
    dry: boolean;
} & {
    logLevel: string;
}>;
export declare const register: (cli: CLI.Argv) => CLI.Argv<{}>;
