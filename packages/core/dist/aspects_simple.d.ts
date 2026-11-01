export declare enum SIGNALS {
    BEFORE = "BEFORE",
    AFTER = "AFTER",
    AROUND = "AROUND",
    ERROR = "ERROR"
}
type AnyFunction = (...args: any[]) => any;
/**
 * If a function returns a Promise<T>, then its awaited type is T.
 * Otherwise, it's just ReturnType<T>.
 */
type AwaitedReturn<T extends AnyFunction> = T extends (...args: any[]) => Promise<infer U> ? U : ReturnType<T>;
/**
 * BEFORE advice:
 *   - Receives `context` (the `this` of the function)
 *   - Receives the original `args`
 *   - Can return either nothing (`void`) or new arguments (`Parameters<T>`)
 *   - Can be async, returning a Promise that resolves to new args or `void`
 */
export type BeforeAdvice<T extends AnyFunction> = (context: ThisParameterType<T>, args: Parameters<T>) => void | Parameters<T> | Promise<void | Parameters<T>>;
/**
 * AFTER advice:
 *   - Receives `context`, the original function’s final (awaited) result,
 *     and the original arguments
 *   - Can return a new result (sync or async)
 */
export type AfterAdvice<T extends AnyFunction> = (context: ThisParameterType<T>, result: AwaitedReturn<T>, args: Parameters<T>) => AwaitedReturn<T> | Promise<AwaitedReturn<T>>;
/**
 * AROUND advice:
 *   - Provides a `proceed(...args)` function that calls the original method
 *   - You can call `proceed` any number of times, or skip it
 *   - Supports both sync and async usage
 */
export type AroundAdvice<T extends AnyFunction> = (proceed: (...args: Parameters<T>) => ReturnType<T>, context: ThisParameterType<T>, args: Parameters<T>) => ReturnType<T>;
/**
 * ERROR advice:
 *   - Intercepts errors thrown by the original function (sync or async)
 *   - Can return a fallback result or rethrow
 */
export type ErrorAdvice<T extends AnyFunction> = (error: unknown, context: ThisParameterType<T>, args: Parameters<T>) => ReturnType<T> | void;
/**
 * `before`:
 *   Direct usage => myFn = before(myFn, (ctx, args) => ...)
 */
export declare function before<T extends AnyFunction>(fn: T, advice: BeforeAdvice<T>): T;
/**
 * `after`:
 *   Direct usage => myFn = after(myFn, (ctx, result, args) => ...)
 */
export declare function after<T extends AnyFunction>(fn: T, advice: AfterAdvice<T>): T;
/**
 * `around`:
 *   Direct usage => myFn = around(myFn, (proceed, ctx, args) => ...)
 */
export declare function around<T extends AnyFunction>(fn: T, advice: AroundAdvice<T>): T;
/**
 * `error`:
 *   Direct usage => myFn = error(myFn, (err, ctx, args) => ...)
 */
export declare function error<T extends AnyFunction>(fn: T, advice: ErrorAdvice<T>): T;
declare const _default: {
    SIGNALS: typeof SIGNALS;
    before: typeof before;
    after: typeof after;
    around: typeof around;
    error: typeof error;
};
export default _default;
