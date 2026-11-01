import * as CLI from 'yargs';
import { IOptions } from '../types';
export declare const targets: (f: string, options: IOptions) => any[];
export declare const register: (cli: CLI.Argv) => CLI.Argv<{}>;
