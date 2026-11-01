import { IKBotTask } from './ai-tools/index.js';
import { AsyncTransformer, ErrorCallback, FilterCallback, OnTransformCallback, OnTransformedCallback, INetworkOptions } from './async-iterator.js';
import { CacheConfig } from './iterator-cache.js';
/**
 * Notes for LLM modifications
 *
 * - this is a wrapper around the async-iterator.ts file, implementing application layer caching and other features
 * - to test it, use `npm run examples:iterator-factory`
 * - test unit : tests\unit\core\iterator.test.ts - run with `npm run test:core`
 */
export interface ILogger {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, error?: any) => void;
}
export declare const removeEmptyObjects: (obj: any) => any;
export interface FieldMapping {
    jsonPath: string;
    targetPath?: string | null;
    options?: IKBotTask;
}
export interface IteratorFactory {
    transform: (mappings: FieldMapping[]) => Promise<void>;
    createTransformer: (options: IKBotTask) => AsyncTransformer;
}
export interface IOptions {
    network?: INetworkOptions;
    errorCallback?: ErrorCallback;
    filterCallback?: FilterCallback;
    transformerFactory?: (options: IKBotTask) => AsyncTransformer;
    logger?: ILogger;
    cacheConfig?: CacheConfig;
    onTransform?: OnTransformCallback;
    onTransformed?: OnTransformedCallback;
}
export { INetworkOptions };
export { CacheConfig };
export declare function createLLMTransformer(options: IKBotTask, logger?: ILogger, cacheConfig?: CacheConfig): AsyncTransformer;
export declare function createIterator(obj: Record<string, any>, optionsMixin: Partial<IKBotTask>, globalOptions?: IOptions): IteratorFactory;
export declare function transformWithMappings(obj: Record<string, any>, createTransformer: (options: IKBotTask) => AsyncTransformer, mappings: FieldMapping[], globalOptions?: IOptions): Promise<void>;
/**
 * Simplified transformation function that only requires the target object and field mappings.
 * All other options are optional with sensible defaults.
 *
 * @param obj - The object to transform
 * @param mappings - Field mappings defining what to transform and how
 * @param optionsMixin - Optional global options to apply to all transformations
 * @param options - Optional advanced configuration
 * @returns The transformed object (also modifies the original)
 */
export declare function transform(obj: Record<string, any>, mappings: FieldMapping[], optionsMixin?: Partial<IKBotTask>, options?: IOptions): Promise<Record<string, any>>;
