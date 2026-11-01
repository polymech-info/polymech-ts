import { IResizeOptions } from '../types.js';
export declare const fileAsBuffer: (path: string) => Buffer<ArrayBufferLike>;
export declare const targets: (f: string, options: IResizeOptions) => string[];
export declare const targetsNext: (f: string, options: IResizeOptions) => string[];
