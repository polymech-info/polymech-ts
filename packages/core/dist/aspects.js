/* -------------------------------------------------------------------------
 * aspects.ts
 *
 * A robust “aspect” system supporting:
 *   - before:    optionally modifies arguments (sync or async)
 *   - after:     optionally modifies return value (sync or async)
 *   - around:    complete control over function invocation
 *   - error:     intercept errors (sync or async)
 *
 * Works as both:
 *   1) Decorators for class methods (e.g. @before(...))
 *   2) Direct function wrappers (e.g. fn = before(fn, ...)).
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
 * 6) Decorator Helper
 * ------------------------------------------------------------------------ */
/** Checks if we’re decorating a class method. */
function isMethod(_target, descriptor) {
    return !!descriptor && typeof descriptor.value === 'function';
}
/* -------------------------------------------------------------------------
 * 7) Wrapped Helpers (cutMethod, cut, aspect)
 * ------------------------------------------------------------------------ */
/** Strictly typed wrapping for class methods. */
function cutMethod(descriptor, advice, type) {
    const original = descriptor.value;
    descriptor.value = SignalMap[type](original, advice); // Cast `any` or refine further
    return descriptor;
}
/** Strictly typed wrapping for direct function usage. */
function cut(target, advice, type) {
    return SignalMap[type](target, advice);
}
/**
 * The core aspect(...) function
 *  - Returns a decorator if used in that style
 *  - Otherwise, can wrap a function directly
 */
function aspect({ type, advice }) {
    // If type is invalid, produce a no-op decorator
    if (!(type in SignalMap)) {
        return function crosscut(target, _name, descriptor) {
            return descriptor || target;
        };
    }
    // Return a decorator function
    return function crosscut(target, _name, descriptor) {
        // If used on a method
        if (isMethod(target, descriptor)) {
            return cutMethod(descriptor, advice, type);
        }
        // If used directly on a function or something else
        return cut(target, advice, type);
    };
}
export function before(arg1, arg2) {
    if (typeof arg1 === 'function' && typeof arg2 === 'function') {
        return SignalMap[SIGNALS.BEFORE](arg1, arg2);
    }
    return aspect({ type: SIGNALS.BEFORE, advice: arg1 });
}
export function after(arg1, arg2) {
    if (typeof arg1 === 'function' && typeof arg2 === 'function') {
        return SignalMap[SIGNALS.AFTER](arg1, arg2);
    }
    return aspect({ type: SIGNALS.AFTER, advice: arg1 });
}
export function around(arg1, arg2) {
    if (typeof arg1 === 'function' && typeof arg2 === 'function') {
        return SignalMap[SIGNALS.AROUND](arg1, arg2);
    }
    return aspect({ type: SIGNALS.AROUND, advice: arg1 });
}
export function error(arg1, arg2) {
    if (typeof arg1 === 'function' && typeof arg2 === 'function') {
        return SignalMap[SIGNALS.ERROR](arg1, arg2);
    }
    return aspect({ type: SIGNALS.ERROR, advice: arg1 });
}
/* -------------------------------------------------------------------------
 * 9) Default Export
 * ------------------------------------------------------------------------ */
export default {
    SIGNALS,
    before,
    after,
    around,
    error,
    aspect,
};
//# sourceMappingURL=aspects.js.map