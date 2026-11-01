import * as CLI from 'yargs';
export declare const register: (cli: CLI.Argv) => CLI.Argv<{
    input: string;
} & {
    slugify: string;
} & {
    debug: string;
} & {
    dry: string;
}>;
