/// <reference types="node" />
import { IResizeOptions } from '../types';
export declare const fileAsBuffer: (path: string) => Buffer;
export declare const targets: (f: string, options: IResizeOptions) => string[];
export declare const targetsNext: (f: string, options: IResizeOptions) => string[];
