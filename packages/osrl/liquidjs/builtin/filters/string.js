"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncatewords = exports.truncate = exports.replaceFirst = exports.replace = exports.capitalize = exports.stripNewlines = exports.strip = exports.split = exports.rstrip = exports.removeFirst = exports.remove = exports.upcase = exports.downcase = exports.lstrip = exports.prepend = exports.append = void 0;
/**
 * String related filters
 *
 * * prefer stringify() to String() since `undefined`, `null` should eval ''
 */
const underscore_1 = require("../../util/underscore");
const assert_1 = require("../../util/assert");
function append(v, arg) {
    (0, assert_1.assert)(arguments.length === 2, 'append expect 2 arguments');
    return (0, underscore_1.stringify)(v) + (0, underscore_1.stringify)(arg);
}
exports.append = append;
function prepend(v, arg) {
    (0, assert_1.assert)(arguments.length === 2, 'prepend expect 2 arguments');
    return (0, underscore_1.stringify)(arg) + (0, underscore_1.stringify)(v);
}
exports.prepend = prepend;
function lstrip(v, chars) {
    if (chars) {
        chars = (0, underscore_1.escapeRegExp)((0, underscore_1.stringify)(chars));
        return (0, underscore_1.stringify)(v).replace(new RegExp(`^[${chars}]+`, 'g'), '');
    }
    return (0, underscore_1.stringify)(v).replace(/^\s+/, '');
}
exports.lstrip = lstrip;
function downcase(v) {
    return (0, underscore_1.stringify)(v).toLowerCase();
}
exports.downcase = downcase;
function upcase(str) {
    return (0, underscore_1.stringify)(str).toUpperCase();
}
exports.upcase = upcase;
function remove(v, arg) {
    return (0, underscore_1.stringify)(v).split(String(arg)).join('');
}
exports.remove = remove;
function removeFirst(v, l) {
    return (0, underscore_1.stringify)(v).replace(String(l), '');
}
exports.removeFirst = removeFirst;
function rstrip(str, chars) {
    if (chars) {
        chars = (0, underscore_1.escapeRegExp)((0, underscore_1.stringify)(chars));
        return (0, underscore_1.stringify)(str).replace(new RegExp(`[${chars}]+$`, 'g'), '');
    }
    return (0, underscore_1.stringify)(str).replace(/\s+$/, '');
}
exports.rstrip = rstrip;
function split(v, arg) {
    const arr = (0, underscore_1.stringify)(v).split(String(arg));
    // align to ruby split, which is the behavior of shopify/liquid
    // see: https://ruby-doc.org/core-2.4.0/String.html#method-i-split
    while (arr.length && arr[arr.length - 1] === '')
        arr.pop();
    return arr;
}
exports.split = split;
function strip(v, chars) {
    if (chars) {
        chars = (0, underscore_1.escapeRegExp)((0, underscore_1.stringify)(chars));
        return (0, underscore_1.stringify)(v)
            .replace(new RegExp(`^[${chars}]+`, 'g'), '')
            .replace(new RegExp(`[${chars}]+$`, 'g'), '');
    }
    return (0, underscore_1.stringify)(v).trim();
}
exports.strip = strip;
function stripNewlines(v) {
    return (0, underscore_1.stringify)(v).replace(/\n/g, '');
}
exports.stripNewlines = stripNewlines;
function capitalize(str) {
    str = (0, underscore_1.stringify)(str);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
exports.capitalize = capitalize;
function replace(v, pattern, replacement) {
    return (0, underscore_1.stringify)(v).split(String(pattern)).join(replacement);
}
exports.replace = replace;
function replaceFirst(v, arg1, arg2) {
    return (0, underscore_1.stringify)(v).replace(String(arg1), arg2);
}
exports.replaceFirst = replaceFirst;
function truncate(v, l = 50, o = '...') {
    v = (0, underscore_1.stringify)(v);
    if (v.length <= l)
        return v;
    return v.substring(0, l - o.length) + o;
}
exports.truncate = truncate;
function truncatewords(v, l = 15, o = '...') {
    const arr = (0, underscore_1.stringify)(v).split(/\s+/);
    let ret = arr.slice(0, l).join(' ');
    if (arr.length >= l)
        ret += o;
    return ret;
}
exports.truncatewords = truncatewords;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vZmlsdGVycy9zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7R0FJRztBQUNILHNEQUErRDtBQUMvRCw4Q0FBMEM7QUFFMUMsU0FBZ0IsTUFBTSxDQUFFLENBQVMsRUFBRSxHQUFXO0lBQzVDLElBQUEsZUFBTSxFQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLDJCQUEyQixDQUFDLENBQUE7SUFDM0QsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ3RDLENBQUM7QUFIRCx3QkFHQztBQUVELFNBQWdCLE9BQU8sQ0FBRSxDQUFTLEVBQUUsR0FBVztJQUM3QyxJQUFBLGVBQU0sRUFBQyxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSw0QkFBNEIsQ0FBQyxDQUFBO0lBQzVELE9BQU8sSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQTtBQUN0QyxDQUFDO0FBSEQsMEJBR0M7QUFFRCxTQUFnQixNQUFNLENBQUUsQ0FBUyxFQUFFLEtBQWM7SUFDL0MsSUFBSSxLQUFLLEVBQUU7UUFDVCxLQUFLLEdBQUcsSUFBQSx5QkFBWSxFQUFDLElBQUEsc0JBQVMsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBQ3RDLE9BQU8sSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQ2pFO0lBQ0QsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBTkQsd0JBTUM7QUFFRCxTQUFnQixRQUFRLENBQUUsQ0FBUztJQUNqQyxPQUFPLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNuQyxDQUFDO0FBRkQsNEJBRUM7QUFFRCxTQUFnQixNQUFNLENBQUUsR0FBVztJQUNqQyxPQUFPLElBQUEsc0JBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNyQyxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixNQUFNLENBQUUsQ0FBUyxFQUFFLEdBQVc7SUFDNUMsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFnQixXQUFXLENBQUUsQ0FBUyxFQUFFLENBQVM7SUFDL0MsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUM1QyxDQUFDO0FBRkQsa0NBRUM7QUFFRCxTQUFnQixNQUFNLENBQUUsR0FBVyxFQUFFLEtBQWM7SUFDakQsSUFBSSxLQUFLLEVBQUU7UUFDVCxLQUFLLEdBQUcsSUFBQSx5QkFBWSxFQUFDLElBQUEsc0JBQVMsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1FBQ3RDLE9BQU8sSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQ25FO0lBQ0QsT0FBTyxJQUFBLHNCQUFTLEVBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUMzQyxDQUFDO0FBTkQsd0JBTUM7QUFFRCxTQUFnQixLQUFLLENBQUUsQ0FBUyxFQUFFLEdBQVc7SUFDM0MsTUFBTSxHQUFHLEdBQUcsSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtJQUMzQywrREFBK0Q7SUFDL0Qsa0VBQWtFO0lBQ2xFLE9BQU8sR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFO1FBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQzFELE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQztBQU5ELHNCQU1DO0FBRUQsU0FBZ0IsS0FBSyxDQUFFLENBQVMsRUFBRSxLQUFjO0lBQzlDLElBQUksS0FBSyxFQUFFO1FBQ1QsS0FBSyxHQUFHLElBQUEseUJBQVksRUFBQyxJQUFBLHNCQUFTLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtRQUN0QyxPQUFPLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUM7YUFDaEIsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQzVDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQ2hEO0lBQ0QsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7QUFDNUIsQ0FBQztBQVJELHNCQVFDO0FBRUQsU0FBZ0IsYUFBYSxDQUFFLENBQVM7SUFDdEMsT0FBTyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUN4QyxDQUFDO0FBRkQsc0NBRUM7QUFFRCxTQUFnQixVQUFVLENBQUUsR0FBVztJQUNyQyxHQUFHLEdBQUcsSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3BCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pFLENBQUM7QUFIRCxnQ0FHQztBQUVELFNBQWdCLE9BQU8sQ0FBRSxDQUFTLEVBQUUsT0FBZSxFQUFFLFdBQW1CO0lBQ3RFLE9BQU8sSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7QUFDOUQsQ0FBQztBQUZELDBCQUVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFFLENBQVMsRUFBRSxJQUFZLEVBQUUsSUFBWTtJQUNqRSxPQUFPLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ2pELENBQUM7QUFGRCxvQ0FFQztBQUVELFNBQWdCLFFBQVEsQ0FBRSxDQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSztJQUNwRCxDQUFDLEdBQUcsSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2hCLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDO1FBQUUsT0FBTyxDQUFDLENBQUE7SUFDM0IsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBSkQsNEJBSUM7QUFFRCxTQUFnQixhQUFhLENBQUUsQ0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUs7SUFDekQsTUFBTSxHQUFHLEdBQUcsSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUNyQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDbkMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUM7UUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQzdCLE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQztBQUxELHNDQUtDIn0=