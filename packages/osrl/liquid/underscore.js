"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caseInsensitiveCompare = exports.ellipsis = exports.changeCase = exports.snakeCase = exports.identify = exports.pad = exports.padEnd = exports.padStart = exports.range = exports.isObject = exports.last = exports.forOwn = exports.isArray = exports.isNil = exports.toLiquid = exports.isNumber = exports.promisify = exports.isFunction = exports.isString = void 0;
const toStr = Object.prototype.toString;
const toLowerCase = String.prototype.toLowerCase;
/*
 * Checks if value is classified as a String primitive or object.
 * @param {any} value The value to check.
 * @return {Boolean} Returns true if value is a string, else false.
 */
function isString(value) {
    return toStr.call(value) === '[object String]';
}
exports.isString = isString;
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
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
    return value === null || value === undefined;
}
exports.isNil = isNil;
function isArray(value) {
    // be compatible with IE 8
    return toStr.call(value) === '[object Array]';
}
exports.isArray = isArray;
/*
 * Iterates over own enumerable string keyed properties of an object and invokes iteratee for each property.
 * The iteratee is invoked with three arguments: (value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning false.
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @return {Object} Returns object.
 */
function forOwn(object, iteratee) {
    object = object || {};
    for (const k in object) {
        if (object.hasOwnProperty(k)) {
            if (iteratee(object[k], k, object) === false)
                break;
        }
    }
    return object;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kZXJzY29yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saXF1aWQvdW5kZXJzY29yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQTtBQUN2QyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQTtBQUVoRDs7OztHQUlHO0FBQ0gsU0FBZ0IsUUFBUSxDQUFFLEtBQVU7SUFDbEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLGlCQUFpQixDQUFBO0FBQ2hELENBQUM7QUFGRCw0QkFFQztBQUVELFNBQWdCLFVBQVUsQ0FBRSxLQUFVO0lBQ3BDLE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFBO0FBQ3BDLENBQUM7QUFGRCxnQ0FFQztBQUlELFNBQWdCLFNBQVMsQ0FBRSxFQUFPO0lBQ2hDLE9BQU8sVUFBVSxHQUFHLElBQVc7UUFDN0IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFVLEVBQUUsTUFBVyxFQUFFLEVBQUU7Z0JBQ3RDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDckMsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQTtBQUNILENBQUM7QUFSRCw4QkFRQztBQUVELFNBQWdCLFFBQVEsQ0FBRSxLQUFVO0lBQ2xDLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFBO0FBQ2xDLENBQUM7QUFGRCw0QkFFQztBQUVELFNBQWdCLFFBQVEsQ0FBRSxLQUFVO0lBQ2xDLElBQUksS0FBSyxJQUFJLFVBQVUsQ0FBQyxL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