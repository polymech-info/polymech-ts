import { defaultError, defaultFilters, testFilters, transformObjectWithOptions, DEFAULT_NETWORK_OPTIONS } from './async-iterator.js';
import { run } from './commands/run.js';
import { createCacheProvider, DEFAULT_CACHE_CONFIG } from './iterator-cache.js';
const dummyLogger = {
    info: () => { },
    warn: () => { },
    error: () => { }
};
export const removeEmptyObjects = (obj) => {
    if (obj === null || obj === undefined)
        return obj;
    for (const key in obj) {
        const val = obj[key];
        if (val === null || val === undefined)
            continue;
        if (typeof val === 'object' ||
            (key == 'value' && typeof val === 'number' && val === 0 || key == 'base64')) {
            obj[key] = removeEmptyObjects(obj[key]);
            if (Object.keys(obj[key]).length === 0) {
                delete obj[key];
            }
        }
    }
    return obj;
};
export function createLLMTransformer(options, logger = dummyLogger, cacheConfig) {
    const mergedCacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    const cacheProvider = createCacheProvider(mergedCacheConfig);
    return async (input, jsonPath) => {
        logger.info(`Transforming field at path: ${jsonPath}`);
        logger.info(`Input: ${input}`);
        logger.info(`Using prompt: ${options.prompt}`);
        const kbotTask = {
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
                const cachedResponse = await cacheProvider.get(cacheKeyObj, 'llm-responses');
                if (cachedResponse?.content) {
                    logger.info(`Using cached LLM response for prompt: ${kbotTask.prompt.substring(0, 100)}...`);
                    return cachedResponse.content;
                }
            }
            const results = await run(kbotTask);
            if (results && results.length > 0 && typeof results[0] === 'string') {
                const result = results[0].trim();
                if (mergedCacheConfig.enabled) {
                    await cacheProvider.set(cacheKeyObj, 'llm-responses', { content: result }, { expiration: mergedCacheConfig.expiration });
                    logger.info(`Cached LLM response for prompt: ${kbotTask.prompt.substring(0, 100)}...`);
                }
                logger.info(`Result: ${result}`);
                return result;
            }
            logger.warn(`No valid result received for ${jsonPath}, returning original`);
            return input;
        }
        catch (error) {
            logger.error(`Error calling LLM API: ${error.message}`, error);
            return input;
        }
    };
}
export function createIterator(obj, optionsMixin, globalOptions = {}) {
    const { network = {}, errorCallback = defaultError, filterCallback = testFilters(defaultFilters()), transformerFactory, logger = dummyLogger, cacheConfig, onTransform, onTransformed } = globalOptions;
    const networkOptions = {
        ...DEFAULT_NETWORK_OPTIONS,
        ...network
    };
    const mergedCacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    const cacheProvider = createCacheProvider(mergedCacheConfig);
    const objCacheNamespace = 'transformed-objects';
    const defaultTransformerFactory = (options) => {
        return async (input) => input;
    };
    const createTransformer = transformerFactory || defaultTransformerFactory;
    const createObjectCacheKey = (data, mappings) => {
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
    const deepMerge = (target, source) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key])
                    target[key] = {};
                deepMerge(target[key], source[key]);
            }
            else {
                target[key] = source[key];
            }
        }
    };
    return {
        createTransformer,
        transform: async (mappings) => {
            // *** Object Cache Check (Start) ***
            let objectCacheKey;
            if (mergedCacheConfig.enabled) {
                objectCacheKey = createObjectCacheKey(obj, mappings);
                const cachedObject = await cacheProvider.get(objectCacheKey, objCacheNamespace);
                if (cachedObject?.content) {
                    logger.info('Using cached transformed object');
                    Object.keys(obj).forEach(key => delete obj[key]);
                    deepMerge(obj, cachedObject.content);
                    return;
                }
            }
            // *** Object Cache Check (End) ***
            for (const mapping of mappings) {
                const mergedOptions = { ...optionsMixin, ...mapping.options };
                const { jsonPath, targetPath = null } = mapping;
                const transformer = createTransformer(mergedOptions);
                await transformObjectWithOptions(obj, transformer, {
                    jsonPath,
                    targetPath,
                    network: networkOptions,
                    errorCallback,
                    filterCallback,
                    onTransform,
                    onTransformed,
                    kbotOptions: mergedOptions
                });
            }
            // *** Object Cache Setting (Start) ***
            if (mergedCacheConfig.enabled && objectCacheKey) {
                await cacheProvider.set(objectCacheKey, objCacheNamespace, { content: obj }, { expiration: mergedCacheConfig.expiration });
                logger.info('Cached transformed object');
            }
            // *** Object Cache Setting (End) ***
        }
    };
}
export async function transformWithMappings(obj, createTransformer, mappings, globalOptions = {}) {
    const optionsWithTransformer = {
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
export async function transform(obj, mappings, optionsMixin = {}, options = {}) {
    const iterator = createIterator(obj, optionsMixin, options);
    await iterator.transform(mappings);
    return obj;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaXRlcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQU1ILFlBQVksRUFDWixjQUFjLEVBQ2QsV0FBVyxFQUNYLDBCQUEwQixFQUUxQix1QkFBdUIsRUFDMUIsTUFBTSxxQkFBcUIsQ0FBQTtBQUM1QixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFdkMsT0FBTyxFQUFlLG1CQUFtQixFQUFpQixvQkFBb0IsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBZ0IzRyxNQUFNLFdBQVcsR0FBWTtJQUN6QixJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQztJQUNkLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO0lBQ2QsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUM7Q0FDbEIsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUFHLENBQUMsR0FBUSxFQUFPLEVBQUU7SUFDaEQsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxTQUFTO1FBQUUsT0FBTyxHQUFHLENBQUM7SUFDbEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNwQixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDcEIsSUFBSSxHQUFHLEtBQUssSUFBSSxJQUFJLEdBQUcsS0FBSyxTQUFTO1lBQUUsU0FBUztRQUNoRCxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVE7WUFDdkIsQ0FBQyxHQUFHLElBQUksT0FBTyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsRUFDN0UsQ0FBQztZQUNDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMs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