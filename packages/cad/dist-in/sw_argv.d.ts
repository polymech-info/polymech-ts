import * as CLI from 'yargs';
import { SolidworkOptions } from './index.js';
export declare const defaultOptions: (yargs: CLI.Argv) => any;
export declare const sanitizeSingle: (argv: CLI.Arguments) => SolidworkOptions;
export declare const sanitize: (argv: any) => SolidworkOptions;
