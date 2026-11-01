/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.insert = exports.index = exports.fill = exports.range = exports.flatten = exports.commonPrefixLength = exports.first = exports.firstIndex = exports.uniqueFilter = exports.distinct = exports.isFalsyOrEmpty = exports.move = exports.coalesce = exports.top = exports.findFirst = exports.binarySearch = exports.equals = exports.tail = void 0;
/**
 * Returns the last element of an array.
 * @param array The array.
 * @param n Which element from the end (default ist zero).
 */
function tail(array, n = 0) {
    return array[array.length - (1 + n)];
}
exports.tail = tail;
function equals(one, other, itemEquals = (a, b) => a === b) {
    if (one.length !== other.length) {
        return false;
    }
    for (let i = 0, len = one.length; i < len; i++) {
        if (!itemEquals(one[i], other[i])) {
            return false;
        }
    }
    return true;
}
exports.equals = equals;
function binarySearch(array, key, comparator) {
    let low = 0, high = array.length - 1;
    while (low <= high) {
        let mid = ((low + high) / 2) | 0;
        let comp = comparator(array[mid], key);
        if (comp < 0) {
            low = mid + 1;
        }
        else if (comp > 0) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -(low + 1);
}
exports.binarySearch = binarySearch;
/**
 * Takes a sorted array and a function p. The array is sorted in such a way that all elements where p(x) is false
 * are located before all elements where p(x) is true.
 * @returns the least x for which p(x) is true or array.length if no element fullfills the given function.
 */
function findFirst(array, p) {
    let low = 0, high = array.length;
    if (high === 0) {
        return 0; // no children
    }
    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (p(array[mid])) {
            high = mid;
        }
        else {
            low = mid + 1;
        }
    }
    return low;
}
exports.findFirst = findFirst;
/**
 * Returns the top N elements from the array.
 *
 * Faster than sorting the entire array when the array is a lot larger than N.
 *
 * @param array The unsorted array.
 * @param compare A sort function for the elements.
 * @param n The number of elements to return.
 * @return The first n elemnts from array when sorted with compare.
 */
function top(array, compare, n) {
    if (n === 0) {
        return [];
    }
    const result = array.slice(0, n).sort(compare);
    for (let i = n, m = array.length; i < m; i++) {
        const element = array[i];
        if (compare(element, result[n - 1]) < 0) {
            result.pop();
            const j = findFirst(result, e => compare(element, e) < 0);
            result.splice(j, 0, element);
        }
    }
    return result;
}
exports.top = top;
/**
 * @returns a new array with all undefined or null values removed. The original array is not modified at all.
 */
function coalesce(array) {
    if (!array) {
        return array;
    }
    return array.filter(e => !!e);
}
exports.coalesce = coalesce;
/**
 * Moves the element in the array for the provided positions.
 */
function move(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
}
exports.move = move;
/**
 * @returns {{false}} if the provided object is an array
 * 	and not empty.
 */
function isFalsyOrEmpty(obj) {
    return !Array.isArray(obj) || obj.length === 0;
}
exports.isFalsyOrEmpty = isFalsyOrEmpty;
/**
 * Removes duplicates from the given array. The optional keyFn allows to specify
 * how elements are checked for equalness by returning a unique string for each.
 */
function distinct(array, keyFn) {
    if (!keyFn) {
        return array.filter((element, position) => {
            return array.indexOf(element) === position;
        });
    }
    const seen = Object.create(null);
    return array.filter((elem) => {
        const key = keyFn(elem);
        if (seen[key]) {
            return false;
        }
        seen[key] = true;
        return true;
    });
}
exports.distinct = distinct;
function uniqueFilter(keyFn) {
    const seen = Object.create(null);
    return element => {
        const key = keyFn(element);
        if (seen[key]) {
            return false;
        }
        seen[key] = true;
        return true;
    };
}
exports.uniqueFilter = uniqueFilter;
function firstIndex(array, fn) {
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        if (fn(element)) {
            return i;
        }
    }
    return -1;
}
exports.firstIndex = firstIndex;
function first(array, fn, notFoundValue = null) {
    const index = firstIndex(array, fn);
    return index < 0 ? notFoundValue : array[index];
}
exports.first = first;
function commonPrefixLength(one, other, equals = (a, b) => a === b) {
    let result = 0;
    for (let i = 0, len = Math.min(one.length, other.length); i < len && equals(one[i], other[i]); i++) {
        result++;
    }
    return result;
}
exports.commonPrefixLength = commonPrefixLength;
function flatten(arr) {
    return arr.reduce((r, v) => r.concat(v), []);
}
exports.flatten = flatten;
function range(to, from = 0) {
    const result = [];
    for (let i = from; i < to; i++) {
        result.push(i);
    }
    return result;
}
exports.range = range;
function fill(num, valueFn, arr = []) {
    for (let i = 0; i < num; i++) {
        arr[i] = valueFn();
    }
    return arr;
}
exports.fill = fill;
function index(array, indexer, merger = t => t) {
    return array.reduce((r, t) => {
        const key = indexer(t);
        r[key] = merger(t, r[key]);
        return r;
    }, Object.create(null));
}
exports.index = index;
/**
 * Inserts an element into an array. Returns a function which, when
 * called, will remove that element from the array.
 */
function insert(array, element) {
    array.push(element);
    return () => {
        const index = array.indexOf(element);
        if (index > -1) {
            array.splice(index, 1);
        }
    };
}
exports.insert = insert;
function remove(array, element) {
    array.splice(array.indexOf(element));
}
exports.remove = remove;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9hcnJheXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7QUFDaEcsWUFBWSxDQUFDOzs7QUFFYjs7OztHQUlHO0FBQ0gsU0FBZ0IsSUFBSSxDQUFJLEtBQVUsRUFBRSxJQUFZLENBQUM7SUFDaEQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFGRCxvQkFFQztBQUVELFNBQWdCLE1BQU0sQ0FBSSxHQUFRLEVBQUUsS0FBVSxFQUFFLGFBQXNDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDdEcsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUM7S0FDYjtJQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEMsT0FBTyxLQUFLLENBQUM7U0FDYjtLQUNEO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDO0FBWkQsd0JBWUM7QUFFRCxTQUFnQixZQUFZLENBQUksS0FBVSxFQUFFLEdBQU0sRUFBRSxVQUFzQztJQUN6RixJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQ1YsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBRXpCLE9BQU8sR0FBRyxJQUFJLElBQUksRUFBRTtRQUNuQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FB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