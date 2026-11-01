"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = exports.toEnumerable = void 0;
const underscore_1 = require("./underscore");
function toEnumerable(val) {
    val = (0, underscore_1.toValue)(val);
    if ((0, underscore_1.isArray)(val))
        return val;
    if ((0, underscore_1.isString)(val) && val.length > 0)
        return [val];
    if ((0, underscore_1.isIterable)(val))
        return Array.from(val);
    if ((0, underscore_1.isObject)(val))
        return Object.keys(val).map((key) => [key, val[key]]);
    return [];
}
exports.toEnumerable = toEnumerable;
function toArray(val) {
    if ((0, underscore_1.isNil)(val))
        return [];
    if ((0, underscore_1.isArray)(val))
        return val;
    return [val];
}
exports.toArray = toArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy91dGlsL2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXNGO0FBRXRGLFNBQWdCLFlBQVksQ0FBRSxHQUFRO0lBQ3BDLEdBQUcsR0FBRyxJQUFBLG9CQUFPLEVBQUMsR0FBRyxDQUFDLENBQUE7SUFDbEIsSUFBSSxJQUFBLG9CQUFPLEVBQUMsR0FBRyxDQUFDO1FBQUUsT0FBTyxHQUFHLENBQUE7SUFDNUIsSUFBSSxJQUFBLHFCQUFRLEVBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDO1FBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ2pELElBQUksSUFBQSx1QkFBVSxFQUFDLEdBQUcsQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUMzQyxJQUFJLElBQUEscUJBQVEsRUFBQyxHQUFHLENBQUM7UUFBRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3hFLE9BQU8sRUFBRSxDQUFBO0FBQ1gsQ0FBQztBQVBELG9DQU9DO0FBRUQsU0FBZ0IsT0FBTyxDQUFFLEdBQVE7SUFDL0IsSUFBSSxJQUFBLGtCQUFLLEVBQUMsR0FBRyxDQUFDO1FBQUUsT0FBTyxFQUFFLENBQUE7SUFDekIsSUFBSSxJQUFBLG9CQUFPLEVBQUMsR0FBRyxDQUFDO1FBQUUsT0FBTyxHQUFHLENBQUE7SUFDNUIsT0FBTyxDQUFFLEdBQUcsQ0FBRSxDQUFBO0FBQ2hCLENBQUM7QUFKRCwwQkFJQyJ9