import type { Argv } from 'yargs';
export declare const options: (yargs: Argv) => CLI.Argv;
interface FSParameters {
    type: string;
    properties: Record<string, any>;
    required: string[];
}
interface FSDefinition {
    name: string;
    description: string;
    category: string;
    parameters: FSParameters;
}
export declare const signature: (definition: FSDefinition) => string;
export declare function format(category: string, data: any): string;
export declare const list: (argv: any, options?: any) => Promise<void>;
export {};
