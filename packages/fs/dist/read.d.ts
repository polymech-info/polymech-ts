import type { ReadWriteDataType } from './interfaces.js';
export declare function validateInput(methodName: string, path: string, returnAs: string): void;
export declare function sync(path: string, returnAs?: string): ReadWriteDataType | undefined;
export declare function async(path: string, returnAs?: string): Promise<ReadWriteDataType | null>;
