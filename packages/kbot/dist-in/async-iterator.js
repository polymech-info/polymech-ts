import { JSONPath } from 'jsonpath-plus';
import pThrottle from 'p-throttle';
import pMap from 'p-map';
import { deepClone } from "@polymech/core/objects";
export const DEFAULT_NETWORK_OPTIONS = {
    throttleDelay: 1000,
    concurrentTasks: 1,
    maxRetries: 3,
    retryDelay: 2000
};
// Sleep utility for retry mechanism
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const isNumber = async (input) => (/^-?\d+(\.\d+)?$/.test(input));
export const isBoolean = async (input) => /^(true|false)$/i.test(input);
export const isValidString = async (input) => input.trim() !== '';
export const testFilters = (filters) => {
    return async (input, path) => {
        for (const filter of filters) {
            if (await filter(input)) {
                return false;
            }
        }
        return true;
    };
};
export const defaultFilters = (filters = []) => [
    isNumber, isBoolean, isValidString, ...filters
];
export async function transformObject(obj, transform, path, networkOptions, errorCallback, testCallback, onTransform, // Pass callbacks down
onTransformed, // Pass callbacks down
options // Pass options context if available
) {
    const paths = JSONPath({ path, json: obj, resultType: 'pointer' });
    await pMap(paths, async (jsonPointer) => {
        const keys = jsonPointer.slice(1).split('/');
        await transformPath(obj, keys, transform, networkOptions, jsonPointer, errorCallback, testCallback, onTransform, // Pass callbacks down
        onTransformed, // Pass callbacks down
        options // Pass options context if available
        );
    }, { concurrency: networkOptions.concurrentTasks });
}
export async function transformPath(obj, keys, transform, networkOptions, currentPath, // Changed from jsonPointer to represent the logical path
errorCallback, testCallback, onTransform, // Receive callbacks
onTransformed, // Receive callbacks
options // Pass options context if available
) {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] === undefined || current[keys[i]] === null) {
            return;
        }
        current = current[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    const throttle = pThrottle({
        limit: 1,
        interval: networkOptions.throttleDelay,
    });
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
                let lastError;
                let valueToTransform = value;
                // Call onTransform before transformation
                try {
                    valueToTransform = await onTransform(fullJsonPath, valueToTransform, options);
                }
                catch (error) {
                    console.error(`Error in onTransform callback for path ${fullJsonPath}:`, error);
                    // Decide if you want to proceed with the original value or stop
                }
                while (attempts < networkOptions.maxRetries && !success) {
                    try {
                        let transformedValue = await throttle(transform)(valueToTransform, fullJsonPath);
                        // Call onTransformed after successful transformation
                        try {
                            transformedValue = await onTransformed(fullJsonPath, transformedValue, options);
                        }
                        catch (error) {
                            console.error(`Error in onTransformed callback for path ${fullJsonPath}:`, error);
                            // Decide if you want to proceed with the transformed value or stop/modify
                        }
                        current[lastKey] = transformedValue; // Assign potentially modified transformed value
                        success = true;
                    }
                    catch (error) {
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
export const defaultError = (path, value, error) => {
    console.error(`Error at path: ${path}, value: ${value}, error: ${error}`);
};
// Default no-op implementations for the new callbacks
export const defaultOnTransform = async (_, value) => value;
export const defaultOnTransformed = async (_, transformedValue) => transformedValue;
export async function transformObjectWithOptions(obj, transform, options) {
    const { jsonPath, targetPath = null, network = {}, errorCallback = defaultError, filterCallback = testFilters(defaultFilters()), onTransform = defaultOnTransform, // Use default if not provided
    onTransformed = defaultOnTransformed, // Use default if not provided
    kbotOptions // Destructure kbot options
     } = options;
    const networkOptions = {
        ...DEFAULT_NETWORK_OPTIONS,
        ...network
    };
    // If targetPath is null, directly transform the object at jsonPath
    if (!targetPath) {
        return transformObject(obj, transform, jsonPath, networkOptions, errorCallback, filterCallback, onTransform, // Pass down
        onTransformed, // Pass down
        kbotOptions // Pass down kbot options
        );
    }
    // For targetPath case, create a deep clone and transform it
    const dataCopy = deepClone(obj);
    // Transform the copy
    await transformObject(dataCopy, transform, jsonPath, networkOptions, errorCallback, filterCallback, onTransform, // Pass down
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
            if (key === '')
                continue;
            if (sourceValue === undefined || sourceValue === null)
                break;
            sourceValue = sourceValue[key];
        }
        // Set value to target path in original object
        const parentKeys = keys.slice(0, -1);
        let target = obj;
        for (const key of parentKeys) {
            if (key === '')
                continue;
            if (target === undefined || target === null)
                break;
            target = target[key];
        }
        if (target && sourceValue !== undefined) {
            target[targetPath] = sourceValue;
        }
    }
}
export const defaultOptions = (options = {}) => {
    const network = { ...DEFAULT_NETWORK_OPTIONS, ...options.network };
    return {
        transform: options.transform,
        path: options.path || '$[*][0,1,2]',
        network,
        errorCallback: options.errorCallback || defaultError,
        filterCallback: options.filterCallback || testFilters(defaultFilters()),
        targetPath: options.targetPath
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMtaXRlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYXN5bmMtaXRlcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQTtBQUN4QyxPQUFPLFNBQVMsTUFBTSxZQUFZLENBQUE7QUFDbEMsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQTtBQWlCbEQsTUFBTSxDQUFDLE1BQU0sdUJBQXVCLEdBQThCO0lBQzlELGFBQWEsRUFBRSxJQUFJO0lBQ25CLGVBQWUsRUFBRSxDQUFDO0lBQ2xCLFVBQVUsRUFBRSxDQUFDO0lBQ2IsVUFBVSxFQUFFLElBQUk7Q0FDbkIsQ0FBQztBQW1CRixvQ0FBb0M7QUFDcEMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRTlFLE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBVyxLQUFLLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0FBQ3hGLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBVyxLQUFLLEVBQUUsS0FBYSxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdkYsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFXLEtBQUssRUFBRSxLQUFhLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUE7QUFFakYsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLENBQUMsT0FBaUIsRUFBa0IsRUFBRTtJQUM3RCxPQUFPLEtBQUssRUFB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