import { IDeleteOptions } from './interfaces.js';
import { TDeleteResult, EResolveMode } from './interfaces.js';
export declare function validateInput(methodName: string, path: string): void;
export declare function sync(path: string, options?: IDeleteOptions): void;
export declare function resolveConflict(path: string, resolveMode: EResolveMode): boolean;
export declare function async(path: string, options?: IDeleteOptions): Promise<TDeleteResult>;
