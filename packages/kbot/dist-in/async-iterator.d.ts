import { IKBotTask } from './ai-tools/index.js';
export type AsyncTransformer = (input: string, path: string) => Promise<string>;
export type ErrorCallback = (path: string, value: string, error: unknown) => void;
export type FilterCallback = (input: string, path: string) => Promise<boolean>;
export type Filter = (input: string) => Promise<boolean>;
export type OnTransformCallback = (jsonPath: string, value: string, options?: Partial<IKBotTask>) => Promise<string>;
export type OnTransformedCallback = (jsonPath: string, transformedValue: string, options?: Partial<IKBotTask>) => Promise<string>;
export interface INetworkOptions {
    throttleDelay?: number;
    concurrentTasks?: number;
    maxRetries?: number;
    retryDelay?: number;
}
export declare const DEFAULT_NETWORK_OPTIONS: Required<INetworkOptions>;
export interface TransformOptions {
    transform: AsyncTransformer;
    path: string;
    network?: INetworkOptions;
    errorCallback: ErrorCallback;
    filterCallback: FilterCallback;
    targetPath?: string | null;
}
export interface GlobalOptions {
    network?: INetworkOptions;
    errorCallback?: ErrorCallback;
    filterCallback?: FilterCallback;
    onTransform?: OnTransformCallback;
    onTransformed?: OnTransformedCallback;
}
export declare const isNumber: Filter;
export declare const isBoolean: Filter;
export declare const isValidString: Filter;
export declare const testFilters: (filters: Filter[]) => FilterCallback;
export declare const defaultFilters: (filters?: Filter[]) => Filter[];
export declare function transformObject(obj: Record<string, any>, transform: AsyncTransformer, path: string, networkOptions: Required<INetworkOptions>, errorCallback: ErrorCallback, testCallback: FilterCallback, onTransform: OnTransformCallback, // Pass callbacks down
onTransformed: OnTransformedCallback, // Pass callbacks down
options?: Partial<IKBotTask>): Promise<void>;
export declare function transformPath(obj: Record<string, any>, keys: string[], transform: AsyncTransformer, networkOptions: Required<INetworkOptions>, currentPath: string, // Changed from jsonPointer to represent the logical path
errorCallback: ErrorCallback, testCallback: FilterCallback, onTransform: OnTransformCallback, // Receive callbacks
onTransformed: OnTransformedCallback, // Receive callbacks
options?: Partial<IKBotTask>): Promise<void>;
export declare const defaultError: ErrorCallback;
export interface TransformWithOptionsInput {
    jsonPath: string;
    targetPath?: string | null;
    network?: INetworkOptions;
    errorCallback?: ErrorCallback;
    filterCallback?: FilterCallback;
    onTransform?: OnTransformCallback;
    onTransformed?: OnTransformedCallback;
    kbotOptions?: Partial<IKBotTask>;
}
export declare const defaultOnTransform: OnTransformCallback;
export declare const defaultOnTransformed: OnTransformedCallback;
export declare function transformObjectWithOptions(obj: Record<string, any>, transform: AsyncTransformer, options: TransformWithOptionsInput): Promise<void>;
export declare const defaultOptions: (options?: Partial<TransformOptions>) => TransformOptions;
