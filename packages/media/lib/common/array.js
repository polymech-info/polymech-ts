"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstOf = exports.lastOf = void 0;
/**
 * Return last element
 * @private
 * @param {(Array<any>)} array
 * @returns object | undefined
 */
const lastOf = (array) => array[array.length - 1];
exports.lastOf = lastOf;
/**
 * Return first element
 * @private
 * @param {(Array<any>)} array
 * @returns object | undefined
 */
const firstOf = (array) => array[0];
exports.firstOf = firstOf;
//# sourceMappingURL=array.js.map