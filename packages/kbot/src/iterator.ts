import { IKBotTask } from './ai-tools/index.js'
import { 
    AsyncTransformer, 
    ErrorCallback, 
    FilterCallback, 
    OnTransformCallback,
    OnTransformedCallback,
    defaultError, 
    defaultFilters, 
    testFilters, 
    transformObjectWithOptions,
    INetworkOptions,
    DEFAULT_NETWORK_OPTIONS
} from './async-iterator.js'
import { run } from './commands/run.js'
import { deepClone } from "@polymech/core/objects"
import { CacheConfig, createCacheProvider, CacheProvider, DEFAULT_CACHE_CONFIG } from './iterator-cache.js'

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

const dummyLogger: ILogger = {
    info: () => {},
    warn: () => {},
    error: () => {}
};

export const removeEmptyObjects = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    for (const key in obj) {
        const val = obj[key]
        if (val === null || val === undefined) continue;
        if (typeof val === 'object' ||
            (key == 'value' && typeof val === 'number' && val === 0 || key == 'base64')
        ) {
            obj[key] = removeEmptyObjects(obj[key]);
            if (Object.keys(obj[key]).length === 0) {
                delete obj[key];
            }
        }
    }
    return obj
}

export interface FieldMapping {
    jsonPath: string
    targetPath?: string | null
    options?: IKBotTask
}

export interface IteratorFactory {
    transform: (mappings: FieldMapping[]) => Promise<void>
    createTransformer: (options: IKBotTask) => AsyncTransformer
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

// Re-export INetworkOptions for other modules to use
export { INetworkOptions };
// Re-export CacheConfig as well
export { CacheConfig };

export function createLLMTransformer(
    options: IKBotTask,
    logger: ILogger = dummyLogger,
    cacheConfig?: CacheConfig
): AsyncTransformer {
    const mergedCacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    const cacheProvider = createCacheProvider(mergedCacheConfig);

    return async (input: string, jsonPath: string): Promise<string> => {
        logger.info(`Transforming field at path: ${jsonPath}`);
        logger.info(`Input: ${input}`);
        logger.info(`Using prompt: ${options.prompt}`);

        const kbotTask: IKBotTask = {
            ...options,
            prompt: `${options.prompt}\n\nText to transform: "${input}"`,
        };

        const cacheKeyObj = removeEmptyObjects({
            prompt: kbotTask.prompt,
            model: kbotTask.model,
            router: kbotTask.router,
            mode: kbotTask.mode,
            filters: [],
            tools: []
        });

        try {
            if (mergedCacheConfig.enabled) {
                const cachedResponse = await cacheProvider.get(cacheKeyObj, 'llm-responses') as { content: string };
                if (cachedResponse?.content) {
                    logger.info(`Using cached LLM response for prompt: ${kbotTask.prompt.substring(0, 100)}...`);
                    return cachedResponse.content;
                }
            }

            const results = await run(kbotTask);
            if (results && results.length > 0 && typeof results[0] === 'string') {
                const result = results[0].trim();
                
                if (mergedCacheConfig.enabled) {
                    await cacheProvider.set(
                        cacheKeyObj, 
                        'llm-responses', 
                        { content: result }, 
                        { expiration: mergedCacheConfig.expiration }
                    );
                    logger.info(`Cached LLM response for prompt: ${kbotTask.prompt.substring(0, 100)}...`);
                }
                
                logger.info(`Result: ${result}`);
                return result;
            }

            logger.warn(`No valid result received for ${jsonPath}, returning original`);
            return input;
        } catch (error) {
            logger.error(`Error calling LLM API: ${error.message}`, error);
            return input;
        }
    };
}

export function createIterator(
    obj: Record<string, any>,
    optionsMixin: Partial<IKBotTask>,
    globalOptions: IOptions = {}
): IteratorFactory {
    const {
        network = {},
        errorCallback = defaultError,
        filterCallback = testFilters(defaultFilters()),
        transformerFactory,
        logger = dummyLogger,
        cacheConfig,
        onTransform,
        onTransformed
    } = globalOptions;

    const networkOptions: Required<INetworkOptions> = { 
        ...DEFAULT_NETWORK_OPTIONS, 
        ...network 
    };

    const mergedCacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    const cacheProvider = createCacheProvider(mergedCacheConfig);
    const objCacheNamespace = 'transformed-objects';

    const defaultTransformerFactory = (options: IKBotTask): AsyncTransformer => {
        return async (input: string): Promise<string> => input;
    };

    const createTransformer = transformerFactory || defaultTransformerFactory;

    const createObjectCacheKey = (data: Record<string, any>, mappings: FieldMapping[]) => {
        return removeEmptyObjects({
            data: JSON.stringify(data),
            mappings: mappings.map(m => ({
                jsonPath: m.jsonPath,
                targetPath: m.targetPath,
                options: {
                    model: optionsMixin.model,
                    router: optionsMixin.router,
                    mode: optionsMixin.mode,
                    prompt: m.options?.prompt
                }
            }))
        });
    };

    const deepMerge = (target: Record<string, any>, source: Record<string, any>) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    };

    return {
        createTransformer,
        transform: async (mappings: FieldMapping[]): Promise<void> => {
            // *** Object Cache Check (Start) ***
            let objectCacheKey: any;
            if (mergedCacheConfig.enabled) {
                 objectCacheKey = createObjectCacheKey(obj, mappings);
                const cachedObject = await cacheProvider.get(
                    objectCacheKey, 
                    objCacheNamespace
                ) as { content: Record<string, any> };

                if (cachedObject?.content) {
                    logger.info('Using cached transformed object');
                    Object.keys(obj).forEach(key => delete obj[key]); 
                    deepMerge(obj, cachedObject.content);
                    return;
                }
            }
            // *** Object Cache Check (End) ***

            for (const mapping of mappings) {
                const mergedOptions = { ...optionsMixin, ...mapping.options } as IKBotTask;
                const { jsonPath, targetPath = null } = mapping;
                const transformer = createTransformer(mergedOptions);

                await transformObjectWithOptions(
                    obj,
                    transformer,
                    {
                        jsonPath,
                        targetPath,
                        network: networkOptions,
                        errorCallback,
                        filterCallback,
                        onTransform,
                        onTransformed,
                        kbotOptions: mergedOptions
                    }
                );
            }

            // *** Object Cache Setting (Start) ***
            if (mergedCacheConfig.enabled && objectCacheKey) {
                await cacheProvider.set(
                    objectCacheKey,
                    objCacheNamespace,
                    { content: obj },
                    { expiration: mergedCacheConfig.expiration }
                );
                logger.info('Cached transformed object');
            }
            // *** Object Cache Setting (End) ***
        }
    };
}

export async function transformWithMappings(
    obj: Record<string, any>,
    createTransformer: (options: IKBotTask) => AsyncTransformer,
    mappings: FieldMapping[],
    globalOptions: IOptions = {}
): Promise<void> {
    const optionsWithTransformer: IOptions = { 
        ...globalOptions, 
        transformerFactory: createTransformer 
    };
    const iterator = createIterator(obj, {}, optionsWithTransformer);
    await iterator.transform(mappings);
}

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
export async function transform(
    obj: Record<string, any>,
    mappings: FieldMapping[],
    optionsMixin: Partial<IKBotTask> = {},
    options: IOptions = {}
): Promise<Record<string, any>> {
    const iterator = createIterator(obj, optionsMixin, options);
    await iterator.transform(mappings);
    return obj;
} 