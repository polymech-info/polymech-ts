"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFalsy = exports.isTruthy = void 0;
function isTruthy(val, ctx) {
    return !isFalsy(val, ctx);
}
exports.isTruthy = isTruthy;
function isFalsy(val, ctx) {
    if (ctx.opts.jsTruthy) {
        return !val;
    }
    else {
        return val === false || undefined === val || val === null;
    }
}
exports.isFalsy = isFalsy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vbGVhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9yZW5kZXIvYm9vbGVhbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxTQUFnQixRQUFRLENBQUUsR0FBUSxFQUFFLEdBQVk7SUFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFDM0IsQ0FBQztBQUZELDRCQUVDO0FBRUQsU0FBZ0IsT0FBTyxDQUFFLEdBQVEsRUFBRSxHQUFZO0lBQzdDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQTtLQUNaO1NBQU07UUFDTCxPQUFPLEdBQUcsS0FBSyxLQUFLLElBQUksU0FBUyxLQUFLLEdBQUcsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFBO0tBQzFEO0FBQ0gsQ0FBQztBQU5ELDBCQU1DIn0=