import { SlicerOptions } from '../types.js';
export declare const fileAsBuffer: (path: string) => Buffer<ArrayBufferLike>;
export declare const getSlicrDir: (options: SlicerOptions) => string;
export declare const getBin: (options: SlicerOptions) => string;
export declare const convertFile: (file: any, target: any, onNode: (data: any) => void, options: SlicerOptions) => Promise<any>;
export declare function convertFiles(file: any, targets: string[], onNode: (data: any) => void, options: SlicerOptions): Promise<void | any[]>;
export declare const report: (data: any, dst: string) => any;
export declare const targets: (f: string, options: SlicerOptions) => any[];
export declare function convert(options: SlicerOptions): Promise<void>;
