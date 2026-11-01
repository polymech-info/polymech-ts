import { IStatOptions } from './interfaces.js';
export declare const sync: (path: string, options: IStatOptions) => void;
export declare const async: (path: string, options: IStatOptions) => Promise<void>;
