import { Readable } from 'node:stream';
import { IInspectOptions, INode } from '../interfaces.js';
export interface IOptions {
    inspectOptions: IInspectOptions;
    maxLevelsDeep?: number;
    user?: any;
}
export declare function sync(path: string, options: IOptions, callback: (path: string, item: INode) => void, currentLevel?: number): void;
export declare function stream(path: string, options: IOptions): Readable;
