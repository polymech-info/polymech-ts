import { JSONPath } from 'jsonpath-plus'
import pThrottle from 'p-throttle'
import pMap from 'p-map'

export type AsyncTransformer = (input: string, path: string) => Promise<string>
export type ErrorCallback = (path: string, value: string, error: any) => void
export type FilterCallback = (input: string, path: string) => Promise<boolean>
export type Filter = (input: string) => Promise<boolean>

export interface TransformOptions {
    transform: AsyncTransformer
    path: string
    throttleDelay: number
    concurrentTasks: number
    errorCallback: ErrorCallback
    filterCallback: FilterCallback
}

export const isNumber: Filter = async (input: string) => (/^-?\d+(\.\d+)?$/.test(input))
export const isBoolean: Filter = async (input: string) => /^(true|false)$/i.test(input)
export const isValidString: Filter = async (input: string) => !(input.trim() !== '')

export const testFilters = (filters: Filter[]): FilterCallback => {
    return async (input: string) => {
        for (const filter of filters) {
            if (await filter(input)) {
                return false;
            }
        }
        return true;
    };
};

export const defaultFilters = (filters: Filter[] = []) =>
    [
        isNumber, isBoolean, isValidString,  ...filters
    ]

export async function transformObject(
    obj: any,
    transform: AsyncTransformer,
    path: string,
    throttleDelay: number,
    concurrentTasks: number,
    errorCallback: ErrorCallback,
    testCallback: FilterCallback
): Promise<void> {
    const paths = JSONPath({ path, json: obj, resultType: 'pointer' });
    await pMap(
        paths,
        async (jsonPointer: any) => {
            const keys = jsonPointer.slice(1).split('/')
            await transformPath(obj, keys, transform, throttleDelay, concurrentTasks, jsonPointer, errorCallback, testCallback)
        },
        { concurrency: concurrentTasks }
    )
}
export async function transformPath(
    obj: any,
    keys: string[],
    transform: AsyncTransformer,
    throttleDelay: number,
    concurrentTasks: number,
    currentPath: string,
    errorCallback: ErrorCallback,
    testCallback: FilterCallback
): Promise<void> {
    
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
    }
    const lastKey = keys[keys.length - 1]
    const throttle = pThrottle({
        limit: 1,
        interval: throttleDelay,
    })

    if (typeof lastKey === 'string' && lastKey !== '') {
        try {
            const newKey = isValidString(lastKey) && !isNumber(lastKey) ? await throttle(transform)(lastKey, currentPath) : lastKey
            if (newKey !== lastKey) {
                current[newKey] = current[lastKey]
                delete current[lastKey]
            }
            if (typeof current[newKey] === 'string' && current[newKey] !== '') {
                if (await testCallback(current[newKey], `${currentPath}/${lastKey}`)) {
                    current[newKey] = await throttle(transform)(current[newKey], `${currentPath}/${lastKey}`)
                }
            } else if (typeof current[newKey] === 'object' && current[newKey] !== null) {
                await transformObject(current[newKey], transform, '$.*', throttleDelay, concurrentTasks, errorCallback, testCallback)
            }
        } catch (error) {
            errorCallback(currentPath, lastKey, error)
        }
    }
}

const exampleTransformFunction: AsyncTransformer = async (input: string, path: string): Promise<string> => {
    if (input === 'random') throw new Error('API error')
    return input.toUpperCase()
}

export const defaultError: ErrorCallback = (path: string, value: string, error: any): void => {
    // logger.error(`Error at path: ${path}, value: ${value}, error: ${error}`)
}

export const defaultOptions = (options: TransformOptions = {} as TransformOptions): TransformOptions => {
    return {
        transform: exampleTransformFunction,
        path:  options.path || '$[*][0,1,2]',
        throttleDelay: 10,
        concurrentTasks: 1,
        errorCallback: defaultError,
        filterCallback: testFilters(defaultFilters()),
        ...options
    }
}
