import { INode, IInspectOptions } from './interfaces.js';
export interface IOptions {
    matching?: string[];
    files?: boolean;
    directories?: boolean;
    recursive?: boolean;
    cwd?: string;
    inspectOptions?: IInspectOptions;
}
export declare function validateInput(methodName: string, path: string, options?: IOptions): void;
export declare const findSync: (path: string, options: IOptions) => string[];
export declare const findSyncEx: (path: string, options: IOptions) => INode[];
export declare function sync(path: string, options: IOptions): string[];
export declare const syncEx: (path: string, options: IOptions) => INode[];
export declare function async(path: string, options: IOptions): Promise<string[]>;
