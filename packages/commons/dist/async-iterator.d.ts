export type AsyncTransformer = (input: string, path: string) => Promise<string>;
export type ErrorCallback = (path: string, value: string, error: any) => void;
export type FilterCallback = (input: string, path: string) => Promise<boolean>;
export type Filter = (input: string) => Promise<boolean>;
export interface TransformOptions {
    transform: AsyncTransformer;
    path: string;
    throttleDelay: number;
    concurrentTasks: number;
    errorCallback: ErrorCallback;
    filterCallback: FilterCallback;
}
export declare const isNumber: Filter;
export declare const isBoolean: Filter;
export declare const isValidString: Filter;
export declare const testFilters: (filters: Filter[]) => FilterCallback;
export declare const defaultFilters: (filters?: Filter[]) => Filter[];
export declare function transformObject(obj: any, transform: AsyncTransformer, path: string, throttleDelay: number, concurrentTasks: number, errorCallback: ErrorCallback, testCallback: FilterCallback): Promise<void>;
export declare function transformPath(obj: any, keys: string[], transform: AsyncTransformer, throttleDelay: number, concurrentTasks: number, currentPath: string, errorCallback: ErrorCallback, testCallback: FilterCallback): Promise<void>;
export declare const defaultError: ErrorCallback;
export declare const defaultOptions: (options?: TransformOptions) => TransformOptions;
