import type { Argv } from 'yargs';
declare const options: (yargs: Argv) => CLI.Argv;
export declare const invoke: (argv: any) => Promise<any>;
export { options as invokeOptions };
