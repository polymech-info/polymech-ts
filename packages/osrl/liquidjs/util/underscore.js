"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.argumentsToValue = exports.caseInsensitiveCompare = exports.ellipsis = exports.changeCase = exports.snakeCase = exports.identify = exports.pad = exports.padEnd = exports.padStart = exports.range = exports.isObject = exports.last = exports.forOwn = exports.isIterable = exports.isArray = exports.isNil = exports.toLiquid = exports.isNumber = exports.toValue = exports.stringify = exports.promisify = exports.escapeRegex = exports.isIterator = exports.isPromise = exports.isFunction = exports.isString = exports.hasOwnProperty = exports.toString = void 0;
const drop_1 = require("../drop/drop");
exports.toString = Object.prototype.toString;
const toLowerCase = String.prototype.toLowerCase;
exports.hasOwnProperty = Object.hasOwnProperty;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
// eslint-disable-next-line @typescript-eslint/ban-types
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
function isPromise(val) {
    return val && isFunction(val.then);
}
exports.isPromise = isPromise;
function isIterator(val) {
    return val && isFunction(val.next) && isFunction(val.throw) && isFunction(val.return);
}
exports.isIterator = isIterator;
function escapeRegex(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
exports.escapeRegex = escapeRegex;
function promisify(fn) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            fn(...args, (err, result) => {
                err ? reject(err) : resolve(result);
            });
        });
    };
}
exports.promisify = promisify;
function stringify(value) {
    value = toValue(value);
    if (isString(value))
        return value;
    if (isNil(value))
        return '';
    if (isArray(value))
        return value.map(x => stringify(x)).join('');
    return String(value);
}
exports.stringify = stringify;
function toValue(value) {
    return (value instanceof drop_1.Drop && isFunction(value.valueOf)) ? value.valueOf() : value;
}
exports.toValue = toValue;
function isNumber(value) {
    return typeof value === 'number';
}
exports.isNumber = isNumber;
function toLiquid(value) {
    if (value && isFunction(value.toLiquid))
        return toLiquid(value.toLiquid());
    return value;
}
exports.toLiquid = toLiquid;
function isNil(value) {
    return value == null;
}
exports.isNil = isNil;
function isArray(value) {
    // be compatible with IE 8
    return exports.toString.call(value) === '[object Array]';
}
exports.isArray = isArray;
function isIterable(value) {
    return isObject(value) && Symbol.iterator in value;
}
exports.isIterable = isIterable;
/*
 * Iterates over own enumerable string keyed properties of an object and invokes iteratee for each property.
 * The iteratee is invoked with three arguments: (value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning false.
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @return {Object} Returns object.
 */
function forOwn(obj, iteratee) {
    obj = obj || {};
    for (const k in obj) {
        if (exports.hasOwnProperty.call(obj, k)) {
            if (iteratee(obj[k], k, obj) === false)
                break;
        }
    }
    return obj;
}
exports.forOwn = forOwn;
function last(arr) {
    return arr[arr.length - 1];
}
exports.last = last;
/*
 * Checks if value is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, new Number(0), and new String(''))
 * @param {any} value The value to check.
 * @return {Boolean} Returns true if value is an object, else false.
 */
function isObject(value) {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}
exports.isObject = isObject;
function range(start, stop, step = 1) {
    const arr = [];
    for (let i = start; i < stop; i += step) {
        arr.push(i);
    }
    return arr;
}
exports.range = range;
function padStart(str, length, ch = ' ') {
    return pad(str, length, ch, (str, ch) => ch + str);
}
exports.padStart = padStart;
function padEnd(str, length, ch = ' ') {
    return pad(str, length, ch, (str, ch) => str + ch);
}
exports.padEnd = padEnd;
function pad(str, length, ch, add) {
    str = String(str);
    let n = length - str.length;
    while (n-- > 0)
        str = add(str, ch);
    return str;
}
exports.pad = pad;
function identify(val) {
    return val;
}
exports.identify = identify;
function snakeCase(str) {
    return str.replace(/(\w?)([A-Z])/g, (_, a, b) => (a ? a + '_' : '') + b.toLowerCase());
}
exports.snakeCase = snakeCase;
function changeCase(str) {
    const hasLowerCase = [...str].some(ch => ch >= 'a' && ch <= 'z');
    return hasLowerCase ? str.toUpperCase() : str.toLowerCase();
}
exports.changeCase = changeCase;
function ellipsis(str, N) {
    return str.length > N ? str.substr(0, N - 3) + '...' : str;
}
exports.ellipsis = ellipsis;
// compare string in case-insensitive way, undefined values to the tail
function caseInsensitiveCompare(a, b) {
    if (a == null && b == null)
        return 0;
    if (a == null)
        return 1;
    if (b == null)
        return -1;
    a = toLowerCase.call(a);
    b = toLowerCase.call(b);
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
}
exports.caseInsensitiveCompare = caseInsensitiveCompare;
function argumentsToValue(fn) {
    return (...args) => fn(...args.map(toValue));
}
exports.argumentsToValue = argumentsToValue;
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kZXJzY29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy91dGlsL3VuZGVyc2NvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQW1DO0FBRXRCLFFBQUEsUUFBUSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFBO0FBQ2pELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFBO0FBRW5DLFFBQUEsY0FBYyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUE7QUFFbkQsU0FBZ0IsUUFBUSxDQUFFLEtBQVU7SUFDbEMsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUE7QUFDbEMsQ0FBQztBQUZELDRCQUVDO0FBRUQsd0RBQXdEO0FBQ3hELFNBQWdCLFVBQVUsQ0FBRSxLQUFVO0lBQ3BDLE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFBO0FBQ3BDLENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLFNBQVMsQ0FBSyxHQUFRO0lBQ3BDLE9BQU8sR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEMsQ0FBQztBQUZELDhCQUVDO0FBRUQsU0FBZ0IsVUFBVSxDQUFFLEdBQVE7SUFDbEMsT0FBTyxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7QUFDdkYsQ0FBQztBQUZELGdDQUVDO0FBRUQsU0FBZ0IsV0FBVyxDQUFFLEdBQVc7SUFDdEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFBO0FBQ3JELENBQUM7QUFGRCxrQ0FFQztBQUlELFNBQWdCLFNBQVMsQ0FBRSxFQUFPO0lBQ2hDLE9BQU8sVUFBVSxHQUFHLElB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