/* -------------------------------------------------------------------------
 * aspects.ts
 *
 * A robust “aspect” system supporting:
 *   - before:    optionally modifies arguments (sync or async)
 *   - after:     optionally modifies return value (sync or async)
 *   - around:    complete control over function invocation
 *   - error:     intercept errors (sync or async)
 *
 * Only supports direct function wrappers (e.g. fn = before(fn, ...)).
 * ------------------------------------------------------------------------ */
/* -------------------------------------------------------------------------
 * 1) SIGNALS Enum (string-based to avoid symbol issues)
 * ------------------------------------------------------------------------ */
export var SIGNALS;
(function (SIGNALS) {
    SIGNALS["BEFORE"] = "BEFORE";
    SIGNALS["AFTER"] = "AFTER";
    SIGNALS["AROUND"] = "AROUND";
    SIGNALS["ERROR"] = "ERROR";
})(SIGNALS || (SIGNALS = {}));
/* -------------------------------------------------------------------------
 * 5) The SignalMap Implementation
 *    - This is where the actual "wrapping" logic lives.
 * ------------------------------------------------------------------------ */
const SignalMap = {
    /**
     * BEFORE:
     *  - Possibly modifies arguments
     *  - If returns a Promise, we await it before calling original
     *  - If returns an array, we use that as new arguments
     */
    [SIGNALS.BEFORE](original, advice) {
        return function (...args) {
            const maybeNewArgs = advice(this, args);
            if (maybeNewArgs instanceof Promise) {
                return maybeNewArgs.then((resolvedArgs) => {
                    const finalArgs = resolvedArgs || args;
                    const result = original.apply(this, finalArgs);
                    return (result instanceof Promise) ? result : Promise.resolve(result);
                });
            }
            else {
                const finalArgs = Array.isArray(maybeNewArgs) ? maybeNewArgs : args;
                return original.apply(this, finalArgs);
            }
        };
    },
    /**
     * AFTER:
     *  - Possibly modifies the return value
     *  - If original is async, we chain on its promise
     *  - Advice can be sync or async
     */
    [SIGNALS.AFTER](original, advice) {
        return function (...args) {
            const result = original.apply(this, args);
            if (result instanceof Promise) {
                return result.then((unwrapped) => {
                    const maybeNewResult = advice(this, unwrapped, args);
                    return (maybeNewResult instanceof Promise) ? maybeNewResult : maybeNewResult;
                });
            }
            else {
                const maybeNewResult = advice(this, result, args);
                if (maybeNewResult instanceof Promise) {
                    return maybeNewResult.then(r => r);
                }
                return maybeNewResult;
            }
        };
    },
    /**
     * AROUND:
     *  - Full control over invocation
     *  - Typically you do: proceed(...args)
     *  - If you want to skip or call multiple times, you can
     */
    [SIGNALS.AROUND](original, advice) {
        return function (...args) {
            const proceed = (...innerArgs) => original.apply(this, innerArgs);
            return advice(proceed, this, args);
        };
    },
    /**
     * ERROR:
     *  - Intercepts errors thrown by the original function or a rejected Promise
     *  - Optionally returns a fallback or rethrows
     */
    [SIGNALS.ERROR](original, advice) {
        return function (...args) {
            try {
                const result = original.apply(this, args);
                if (result instanceof Promise) {
                    // Handle async rejections
                    return result.catch((err) => {
                        return advice(err, this, args);
                    });
                }
                return result;
            }
            catch (err) {
                // Synchronous error
                return advice(err, this, args);
            }
        };
    },
};
/* -------------------------------------------------------------------------
 * 6) Direct Usage Functions (no decorator support)
 * ------------------------------------------------------------------------ */
/**
 * `before`:
 *   Direct usage => myFn = before(myFn, (ctx, args) => ...)
 */
export function before(fn, advice) {
    return SignalMap[SIGNALS.BEFORE](fn, advice);
}
/**
 * `after`:
 *   Direct usage => myFn = after(myFn, (ctx, result, args) => ...)
 */
export function after(fn, advice) {
    return SignalMap[SIGNALS.AFTER](fn, advice);
}
/**
 * `around`:
 *   Direct usage => myFn = around(myFn, (proceed, ctx, args) => ...)
 */
export function around(fn, advice) {
    return SignalMap[SIGNALS.AROUND](fn, advice);
}
/**
 * `error`:
 *   Direct usage => myFn = error(myFn, (err, ctx, args) => ...)
 */
export function error(fn, advice) {
    return SignalMap[SIGNALS.ERROR](fn, advice);
}
/* -------------------------------------------------------------------------
 * 7) Default Export
 * ------------------------------------------------------------------------ */
export default {
    SIGNALS,
    before,
    after,
    around,
    error,
};
//# sourceMappingURL=aspects_simple.js.map