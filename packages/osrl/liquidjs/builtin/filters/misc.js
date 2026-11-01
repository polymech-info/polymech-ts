"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.raw = exports.json = exports.Default = void 0;
const boolean_1 = require("../../render/boolean");
const underscore_1 = require("../../util/underscore");
function Default(value, defaultValue, ...args) {
    value = (0, underscore_1.toValue)(value);
    if ((0, underscore_1.isArray)(value) || (0, underscore_1.isString)(value))
        return value.length ? value : defaultValue;
    if (value === false && (new Map(args)).get('allow_false'))
        return false;
    return (0, boolean_1.isFalsy)(value, this.context) ? defaultValue : value;
}
exports.Default = Default;
function json(value) {
    return JSON.stringify(value);
}
exports.json = json;
exports.raw = underscore_1.identify;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL2ZpbHRlcnMvbWlzYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBOEM7QUFDOUMsc0RBQTRFO0FBRzVFLFNBQWdCLE9BQU8sQ0FBNEMsS0FBUyxFQUFFLFlBQWdCLEVBQUUsR0FBRyxJQUEwQjtJQUMzSCxLQUFLLEdBQUcsSUFBQSxvQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3RCLElBQUksSUFBQSxvQkFBTyxFQUFDLEtBQUssQ0FBQyxJQUFJLElBQUEscUJBQVEsRUFBQyxLQUFLLENBQUM7UUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFBO0lBQ2pGLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztRQUFFLE9BQU8sS0FBVyxDQUFBO0lBQzdFLE9BQU8sSUFBQSxpQkFBTyxFQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO0FBQzVELENBQUM7QUFMRCwwQkFLQztBQUVELFNBQWdCLElBQUksQ0FBRSxLQUFVO0lBQzlCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUM5QixDQUFDO0FBRkQsb0JBRUM7QUFFWSxRQUFBLEdBQUcsR0FBRyxxQkFBUSxDQUFBIn0=