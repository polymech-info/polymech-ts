import * as CLI from 'yargs';
import { IOptionsSyncComponent } from '../types';
export declare const parse: (argv: any) => IOptionsSyncComponent | boolean;
export declare const register: (cli: CLI.Argv) => CLI.Argv<{}>;
