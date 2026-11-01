"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniq = exports.where = exports.slice = exports.concat = exports.compact = exports.map = exports.size = exports.sortNatural = exports.sort = exports.reverse = exports.first = exports.last = exports.join = void 0;
const underscore_1 = require("../../util/underscore");
const collection_1 = require("../../util/collection");
const boolean_1 = require("../../render/boolean");
const comparable_1 = require("../../drop/comparable");
exports.join = (0, underscore_1.argumentsToValue)((v, arg) => (0, collection_1.toArray)(v).join(arg === undefined ? ' ' : arg));
exports.last = (0, underscore_1.argumentsToValue)((v) => (0, underscore_1.isArray)(v) ? (0, underscore_1.last)(v) : '');
exports.first = (0, underscore_1.argumentsToValue)((v) => (0, underscore_1.isArray)(v) ? v[0] : '');
exports.reverse = (0, underscore_1.argumentsToValue)((v) => [...(0, collection_1.toArray)(v)].reverse());
function sort(arr, property) {
    arr = (0, underscore_1.toValue)(arr);
    const getValue = (obj) => property ? this.context.getFromScope(obj, (0, underscore_1.stringify)(property).split('.')) : obj;
    return [...(0, collection_1.toArray)(arr)].sort((lhs, rhs) => {
        lhs = getValue(lhs);
        rhs = getValue(rhs);
        return lhs < rhs ? -1 : (lhs > rhs ? 1 : 0);
    });
}
exports.sort = sort;
function sortNatural(input, property) {
    input = (0, underscore_1.toValue)(input);
    const propertyString = (0, underscore_1.stringify)(property);
    const compare = property === undefined
        ? underscore_1.caseInsensitiveCompare
        : (lhs, rhs) => (0, underscore_1.caseInsensitiveCompare)(lhs[propertyString], rhs[propertyString]);
    return [...(0, collection_1.toArray)(input)].sort(compare);
}
exports.sortNatural = sortNatural;
const size = (v) => (v && v.length) || 0;
exports.size = size;
function map(arr, property) {
    arr = (0, underscore_1.toValue)(arr);
    return (0, collection_1.toArray)(arr).map(obj => this.context.getFromScope(obj, (0, underscore_1.stringify)(property).split('.')));
}
exports.map = map;
function compact(arr) {
    arr = (0, underscore_1.toValue)(arr);
    return (0, collection_1.toArray)(arr).filter(x => !(0, underscore_1.isNil)((0, underscore_1.toValue)(x)));
}
exports.compact = compact;
function concat(v, arg = []) {
    v = (0, underscore_1.toValue)(v);
    arg = (0, collection_1.toArray)(arg).map(v => (0, underscore_1.toValue)(v));
    return (0, collection_1.toArray)(v).concat(arg);
}
exports.concat = concat;
function slice(v, begin, length = 1) {
    v = (0, underscore_1.toValue)(v);
    if ((0, underscore_1.isNil)(v))
        return [];
    if (!(0, underscore_1.isArray)(v))
        v = (0, underscore_1.stringify)(v);
    begin = begin < 0 ? v.length + begin : begin;
    return v.slice(begin, begin + length);
}
exports.slice = slice;
function where(arr, property, expected) {
    arr = (0, underscore_1.toValue)(arr);
    return (0, collection_1.toArray)(arr).filter(obj => {
        const value = this.context.getFromScope(obj, (0, underscore_1.stringify)(property).split('.'));
        if (expected === undefined)
            return (0, boolean_1.isTruthy)(value, this.context);
        if ((0, comparable_1.isComparable)(expected))
            return expected.equals(value);
        return value === expected;
    });
}
exports.where = where;
function uniq(arr) {
    arr = (0, underscore_1.toValue)(arr);
    const u = {};
    return (arr || []).filter(val => {
        if (underscore_1.hasOwnProperty.call(u, String(val)))
            return false;
        u[String(val)] = true;
        return true;
    });
}
exports.uniq = uniq;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi9maWx0ZXJzL2FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNEQUF1SjtBQUN2SixzREFBK0M7QUFDL0Msa0RBQStDO0FBRy9DLHNEQUFvRDtBQUV2QyxRQUFBLElBQUksR0FBRyxJQUFBLDZCQUFnQixFQUFDLENBQUMsQ0FBUSxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsSUFBQSxvQkFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7QUFDbEcsUUFBQSxJQUFJLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsSUFBQSxvQkFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGlCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ25FLFFBQUEsS0FBSyxHQUFHLElBQUEsNkJBQWdCLEVBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLElBQUEsb0JBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUM1RCxRQUFBLE9BQU8sR0FBRyxJQUFBLDZCQUFnQixFQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBQSxvQkFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtBQUVoRixTQUFnQixJQUFJLENBQXVCLEdBQVEsRUFBRSxRQUFpQjtJQUNwRSxHQUFHLEdBQUcsSUFBQSxvQkFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFBO0lB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