import { JSONPath } from 'jsonpath-plus'
import pThrottle from 'p-throttle'
import pMap from 'p-map'
import { deepClone } from "@polymech/core/objects"
import { IKBotTask } from './ai-tools/index.js'; // Assuming IKBotTask might be relevant context for callbacks

export type AsyncTransformer = (input: string, path: string) => Promise<string>
export type ErrorCallback = (path: string, value: string, error: unknown) => void
export type FilterCallback = (input: string, path: string) => Promise<boolean>
export type Filter = (input: string) => Promise<boolean>
export type OnTransformCallback = (jsonPath: string, value: string, options?: Partial<IKBotTask>) => Promise<string>;
export type OnTransformedCallback = (jsonPath: string, transformedValue: string, options?: Partial<IKBotTask>) => Promise<string>;

export interface INetworkOptions {
    throttleDelay?: number;
    concurrentTasks?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export const DEFAULT_NETWORK_OPTIONS: Required<INetworkOptions> = {
    throttleDelay: 1000,
    concurrentTasks: 1,
    maxRetries: 3,
    retryDelay: 2000
};

export interface TransformOptions {
    transform: AsyncTransformer
    path: string
    network?: INetworkOptions
    errorCallback: ErrorCallback
    filterCallback: FilterCallback
    targetPath?: string | null
}

export interface GlobalOptions {
    network?: INetworkOptions
    errorCallback?: ErrorCallback
    filterCallback?: FilterCallback
    onTransform?: OnTransformCallback // Add pre-transform callback
    onTransformed?: OnTransformedCallback // Add post-transform callback
}

// Sleep utility for retry mechanism
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isNumber: Filter = async (input: string) => (/^-?\d+(\.\d+)?$/.test(input))
export const isBoolean: Filter = async (input: string) => /^(true|false)$/i.test(input)
export const isValidString: Filter = async (input: string) => input.trim() !== ''

export const testFilters = (filters: Filter[]): FilterCallback => {
    return async (input: string, path: string) => {
        for (const filter of filters) {
            if (await filter(input)) {
                return false;
            }
        }
        return true;
    };
};

export const defaultFilters = (filters: Filter[] = []): Filter[] =>
    [
        isNumber, isBoolean, isValidString, ...filters
    ]

export async function transformObject(
    obj: Record<string, any>,
    transform: AsyncTransformer,
    path: string,
    networkOptions: Required<INetworkOptions>,
    errorCallback: ErrorCallback,
    testCallback: FilterCallback,
    onTransform: OnTransformCallback, // Pass callbacks down
    onTransformed: OnTransformedCallback, // Pass callbacks down
    options?: Partial<IKBotTask> // Pass options context if available
): Promise<void> {
    const paths = JSONPath({ path, json: obj, resultType: 'pointer' });
    await pMap(
        paths,
        async (jsonPointer: string) => {
            const keys = jsonPointer.slice(1).split('/')
            await transformPath(
                obj, 
                keys, 
                transform, 
                networkOptions,
                jsonPointer, 
                errorCallback, 
                testCallback,
                onTransform, // Pass callbacks down
                onTransformed, // Pass callbacks down
                options // Pass options context if available
            )
        },
        { concurrency: networkOptions.concurrentTasks }
    )
}

export async function transformPath(
    obj: Record<string, any>,
    keys: string[],
    transform: AsyncTransformer,
    networkOptions: Required<INetworkOptions>,
    currentPath: string, // Changed from jsonPointer to represent the logical path
    errorCallback: ErrorCallback,
    testCallback: FilterCallback,
    onTransform: OnTransformCallback, // Receive callbacks
    onTransformed: OnTransformedCallback, // Receive callbacks
    options?: Partial<IKBotTask> // Pass options context if available
): Promise<void> {

    let current: Record<string, any> = obj

    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || current[keys[i]] === null) {
            return;
        }
        current = current[keys[i]] as Record<string, any>
    }
    const lastKey = keys[keys.length - 1]
    const throttle = pThrottle({
        limit: 1,
        interval: networkOptions.throttleDelay,
    })
    if (typeof lastKey === 'string' && lastKey !== '') {
        // Get the value pointed to by the keys
        const value = current[lastKey];

        // Check if the value exists before proceeding
        if (value !== undefined && value !== null) {
            const fullJsonPath = `${currentPath}/${lastKey}`; // Construct full path

            // Check if the filter callback allows transformation
            // Note: The default filter blocks numbers/booleans. Arrays/Objects depend on the filter implementation.
            // The example uses `async () => true`, so arrays should pass.
            if (await testCallback(value, fullJsonPath)) {
                // Add retry mechanism with exponential backoff
                let attempts = 0;
                let success = false;
                let lastError: unknown;
                let valueToTransform = value;

                // Call onTransform before transformation
                try {
                    valueToTransform = await onTransform(fullJsonPath, valueToTransform, options);
                } catch (error) {
                    console.error(`Error in onTransform callback for path ${fullJsonPath}:`, error);
                    // Decide if you want to proceed with the original value or stop
                }
                
                while (attempts < networkOptions.maxRetries && !success) {
                    try {
                        let transformedValue = await throttle(transform)(valueToTransform, fullJsonPath);
                        
                        // Call onTransformed after successful transformation
                        try {
                            transformedValue = await onTransformed(fullJsonPath, transformedValue, options);
                        } catch (error) {
                            console.error(`Error in onTransformed callback for path ${fullJsonPath}:`, error);
                            // Decide if you want to proceed with the transformed value or stop/modify
                        }
                        
                        current[lastKey] = transformedValue; // Assign potentially modified transformed value
                        success = true;
                    } catch (error) {
                        lastError = error;
                        attempts++;
                        
                        if (attempts < networkOptions.maxRetries) {
                            // Exponential backoff: retry delay increases with each attempt
                            const backoffDelay = networkOptions.retryDelay * Math.pow(2, attempts - 1);
                            await sleep(backoffDelay);
                        }
                    }
                }
                
                if (!success) {
                    errorCallback(currentPath, lastKey, lastError); // Use currentPath (logical path)
                }
            }
        }
    }
}

export const defaultError: ErrorCallback = (path: string, value: string, error: unknown): void => {
    console.error(`Error at path: ${path}, value: ${value}, error: ${error}`)
}

export interface TransformWithOptionsInput {
    jsonPath: string
    targetPath?: string | null
    network?: INetworkOptions
    errorCallback?: ErrorCallback
    filterCallback?: FilterCallback
    onTransform?: OnTransformCallback // Add to options
    onTransformed?: OnTransformedCallback // Add to options
    kbotOptions?: Partial<IKBotTask> // Add kbot options context
}

// Default no-op implementations for the new callbacks
export const defaultOnTransform: OnTransformCallback = async (_, value) => value;
export const defaultOnTransformed: OnTransformedCallback = async (_, transformedValue) => transformedValue;

export async function transformObjectWithOptions(
    obj: Record<string, any>,
    transform: AsyncTransformer,
    options: TransformWithOptionsInput
): Promise<void> {
    const {
        jsonPath,
        targetPath = null,
        network = {},
        errorCallback = defaultError,
        filterCallback = testFilters(defaultFilters()),
        onTransform = defaultOnTransform, // Use default if not provided
        onTransformed = defaultOnTransformed, // Use default if not provided
        kbotOptions // Destructure kbot options
    } = options;

    const networkOptions: Required<INetworkOptions> = { 
        ...DEFAULT_NETWORK_OPTIONS, 
        ...network 
    };

    // If targetPath is null, directly transform the object at jsonPath
    if (!targetPath) {
        return transformObject(
            obj,
            transform,
            jsonPath,
            networkOptions,
            errorCallback,
            filterCallback,
            onTransform, // Pass down
            onTransformed, // Pass down
            kbotOptions // Pass down kbot options
        );
    }

    // For targetPath case, create a deep clone and transform it
    const dataCopy = deepClone(obj)

    // Transform the copy
    await transformObject(
        dataCopy,
        transform,
        jsonPath,
        networkOptions,
        errorCallback,
        filterCallback,
        onTransform, // Pass down
        onTransformed, // Pass down
        kbotOptions // Pass down kbot options
    );

    // Get paths from original object
    const paths = JSONPath({ path: jsonPath, json: obj, resultType: 'pointer' });

    // Apply transformed values to original object with targetPath
    for (const p of paths) {
        const keys = p.slice(1).split('/');
        
        // Get source path for transformation
        const sourceKeys = p.slice(1).split('/');
        
        // Get source value from matching path in processed data
        let sourceValue = dataCopy;
        for (const key of sourceKeys) {
            if (key === '') continue;
            if (sourceValue === undefined || sourceValue === null) break;
            sourceValue = sourceValue[key];
        }

        // Set value to target path in original object
        const parentKeys = keys.slice(0, -1);
        let target = obj;
        for (const key of parentKeys) {
            if (key === '') continue;
            if (target === undefined || target === null) break;
            target = target[key];
        }

        if (target && sourceValue !== undefined) {
            target[targetPath] = sourceValue;
        }
    }
}

export const defaultOptions = (options: Partial<TransformOptions> = {}): TransformOptions => {
    const network = { ...DEFAULT_NETWORK_OPTIONS, ...options.network };
    
    return {
        transform: options.transform,
        path: options.path || '$[*][0,1,2]',
        network,
        errorCallback: options.errorCallback || defaultError,
        filterCallback: options.filterCallback || testFilters(defaultFilters()),
        targetPath: options.targetPath
    }
}
