import * as CLI from 'yargs';
import { IOptions } from './types';
export declare const defaultOptions: (yargs: CLI.Argv) => CLI.Argv<{
    format: string;
} & {
    source: unknown;
} & {
    template: unknown;
} & {
    language: string;
} & {
    bootstrap: unknown;
} & {
    variables: string;
} & {
    trace: string;
} & {
    output: string;
} & {
    disable: unknown;
} & {
    profile: string;
} & {
    envVariables: string | boolean;
} & {
    stdout: string | boolean;
} & {
    dry: string | boolean;
} & {
    introspect: unknown;
} & {
    env: unknown;
} & {
    alt: boolean;
} & {
    plugins: unknown;
} & {
    targetLanguage: string;
} & {
    sourceLanguage: string;
} & {
    logLevel: string;
}>;
export declare const sanitize: (argv: any) => IOptions | boolean;
export declare const defaults: () => void;
