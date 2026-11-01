/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.countToArray = exports.count = exports.create = exports.validateConstraint = exports.validateConstraints = exports.areFunctions = exports.isFunction = exports.isEmptyObject = exports.isUndefinedOrNull = exports.isUndefined = exports.isBoolean = exports.isNumber = exports.isObject = exports.isStringArray = exports.isString = exports.isArray = exports.traverse = void 0;
const _typeof = {
    number: 'number',
    string: 'string',
    undefined: 'undefined',
    object: 'object',
    function: 'function'
};
function traverse(o, ctx, fn) {
    for (const i in o) {
        fn.apply(ctx, [o, i, o[i]]);
        if (o[i] !== null && typeof (o[i]) === 'object') {
            traverse(o[i], ctx, fn);
        }
    }
}
exports.traverse = traverse;
/**
 * @returns whether the provided parameter is a JavaScript Array or not.
 */
function isArray(array) {
    if (Array.isArray) {
        return Array.isArray(array);
    }
    if (array && typeof (array.length) === _typeof.number && array.constructor === Array) {
        return true;
    }
    return false;
}
exports.isArray = isArray;
/**
 * @returns whether the provided parameter is a JavaScript String or not.
 */
function isString(str) {
    if (typeof (str) === _typeof.string || str instanceof String) {
        return true;
    }
    return false;
}
exports.isString = isString;
/**
 * @returns whether the provided parameter is a JavaScript Array and each element in the array is a string.
 */
function isStringArray(value) {
    return isArray(value) && value.every(elem => isString(elem));
}
exports.isStringArray = isStringArray;
/**
 *
 * @returns whether the provided parameter is of type `object` but **not**
 *	`null`, an `array`, a `regexp`, nor a `date`.
 */
function isObject(obj) {
    // The method can't do a type cast since there are type (like strings) which
    // are subclasses of any put not positvely matched by the function. Hence type
    // narrowing results in wrong results.
    return typeof obj === _typeof.object
        && obj !== null
        && !Array.isArray(obj)
        && !(obj instanceof RegExp)
        && !(obj instanceof Date);
}
exports.isObject = isObject;
/**
 * In **contrast** to just checking `typeof` this will return `false` for `NaN`.
 * @returns whether the provided parameter is a JavaScript Number or not.
 */
function isNumber(obj) {
    if ((typeof (obj) === _typeof.number || obj instanceof Number) && !isNaN(obj)) {
        return true;
    }
    return false;
}
exports.isNumber = isNumber;
/**
 * @returns whether the provided parameter is a JavaScript Boolean or not.
 */
function isBoolean(obj) {
    return obj === true || obj === false;
}
exports.isBoolean = isBoolean;
/**
 * @returns whether the provided parameter is undefined.
 */
function isUndefined(obj) {
    return typeof (obj) === _typeof.undefined;
}
exports.isUndefined = isUndefined;
/**
 * @returns whether the provided parameter is undefined or null.
 */
function isUndefinedOrNull(obj) {
    return isUndefined(obj) || obj === null;
}
exports.isUndefinedOrNull = isUndefinedOrNull;
const hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * @returns whether the provided parameter is an empty JavaScript Object or not.
 */
function isEmptyObject(obj) {
    if (!isObject(obj)) {
        return false;
    }
    for (let key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}
exports.isEmptyObject = isEmptyObject;
/**
 * @returns whether the provided parameter is a JavaScript Function or not.
 */
function isFunction(obj) {
    return typeof obj === _typeof.function;
}
exports.isFunction = isFunction;
/**
 * @returns whether the provided parameters is are JavaScript Function or not.
 */
function areFunctions(...objects) {
    return objects && objects.length > 0 && objects.every(isFunction);
}
exports.areFunctions = areFunctions;
function validateConstraints(args, constraints) {
    const len = Math.min(args.length, constraints.length);
    for (let i = 0; i < len; i++) {
        validateConstraint(args[i], constraints[i]);
    }
}
exports.validateConstraints = validateConstraints;
function validateConstraint(arg, constraint) {
    if (isString(constraint)) {
        if (typeof arg !== constraint) {
            throw new Error(`argument does not match constraint: typeof ${constraint}`);
        }
    }
    else if (isFunction(constraint)) {
        if (arg instanceof constraint) {
            return;
        }
        if (arg && arg.constructor === constraint) {
            return;
        }
        if (constraint.length === 1 && constraint.call(undefined, arg) === true) {
            return;
        }
        throw new Error(`argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true`);
    }
}
exports.validateConstraint = validateConstraint;
/**
 * Creates a new object of the provided class and will call the constructor with
 * any additional argument supplied.
 */
function create(ctor, ...args) {
    let obj = Object.create(ctor.prototype);
    ctor.apply(obj, args);
    return obj;
}
exports.create = create;
function count(fromOrTo, toOrCallback, callback) {
    var from, to;
    if (isNumber(toOrCallback)) {
        from = fromOrTo;
        to = toOrCallback;
    }
    else {
        from = 0;
        to = fromOrTo;
        callback = toOrCallback;
    }
    var op = from <= to ? (i) => i + 1 : (i) => i - 1;
    var cmp = from <= to ? (a, b) => a < b : (a, b) => a > b;
    for (var i = from; cmp(i, to); i = op(i)) {
        callback(i);
    }
}
exports.count = count;
function countToArray(fromOrTo, to) {
    var result = [];
    var fn = (i) => result.push(i);
    if (isUndefined(to)) {
        count(fromOrTo, fn);
    }
    else {
        count(fromOrTo, to, fn);
    }
    return result;
}
exports.countToArray = countToArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbWl0aXZlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvcHJpbWl0aXZlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRztBQUNoRyxZQUFZLENBQUM7OztBQUViLE1BQU0sT0FBTyxHQUFHO0lBQ2YsTUFBTSxFQUFFLFFBQVE7SUFDaEIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsU0FBUyxFQUFFLFdBQVc7SUFDdEIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsUUFBUSxFQUFFLFVBQVU7Q0FDcEIsQ0FBQztBQUVGLFNBQWdCLFFBQVEsQ0FBQyxDQUFNLEVBQUUsR0FBRyxFQUFFLEVBQWdEO0lBQ3JGLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ2xCLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ2hELFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Q7QUFDRixDQUFDO0FBUEQsNEJBT0M7QUFFRDs7R0FFRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxLQUFVO0lBQ2pDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRTtRQUNsQixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDNUI7SUFFRCxJQUFJLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7UUFDckYsT0FBTyxJQUFJLENBQUM7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