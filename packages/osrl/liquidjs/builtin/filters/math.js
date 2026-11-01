"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plus = exports.round = exports.times = exports.modulo = exports.minus = exports.floor = exports.dividedBy = exports.ceil = exports.atMost = exports.atLeast = exports.abs = void 0;
const underscore_1 = require("../../util/underscore");
exports.abs = (0, underscore_1.argumentsToValue)(Math.abs);
exports.atLeast = (0, underscore_1.argumentsToValue)(Math.max);
exports.atMost = (0, underscore_1.argumentsToValue)(Math.min);
exports.ceil = (0, underscore_1.argumentsToValue)(Math.ceil);
exports.dividedBy = (0, underscore_1.argumentsToValue)((dividend, divisor, integerArithmetic = false) => integerArithmetic ? Math.floor(dividend / divisor) : dividend / divisor);
exports.floor = (0, underscore_1.argumentsToValue)(Math.floor);
exports.minus = (0, underscore_1.argumentsToValue)((v, arg) => v - arg);
exports.modulo = (0, underscore_1.argumentsToValue)((v, arg) => v % arg);
exports.times = (0, underscore_1.argumentsToValue)((v, arg) => v * arg);
function round(v, arg = 0) {
    v = (0, underscore_1.toValue)(v);
    arg = (0, underscore_1.toValue)(arg);
    const amp = Math.pow(10, arg);
    return Math.round(v * amp) / amp;
}
exports.round = round;
function plus(v, arg) {
    v = (0, underscore_1.toValue)(v);
    arg = (0, underscore_1.toValue)(arg);
    return Number(v) + Number(arg);
}
exports.plus = plus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL2ZpbHRlcnMvbWF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzREFBaUU7QUFFcEQsUUFBQSxHQUFHLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDaEMsUUFBQSxPQUFPLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDcEMsUUFBQSxNQUFNLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDbkMsUUFBQSxJQUFJLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbEMsUUFBQSxTQUFTLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxDQUFDLFFBQWdCLEVBQUUsT0FBZSxFQUFFLGlCQUFpQixHQUFHLEtBQUssRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUE7QUFDdkssUUFBQSxLQUFLLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDcEMsUUFBQSxLQUFLLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQTtBQUM3RCxRQUFBLE1BQU0sR0FBRyxJQUFBLDZCQUFnQixFQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO0FBQzlELFFBQUEsS0FBSyxHQUFHLElBQUEsNkJBQWdCLEVBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7QUFFMUUsU0FBZ0IsS0FBSyxDQUFFLENBQVMsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUN2QyxDQUFDLEdBQUcsSUFBQSxvQkFBTyxFQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ2QsR0FBRyxHQUFHLElBQUEsb0JBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQTtJQUNsQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUM3QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtBQUNsQyxDQUFDO0FBTEQsc0JBS0M7QUFFRCxTQUFnQixJQUFJLENBQUUsQ0FBUyxFQUFFLEdBQVc7SUFDMUMsQ0FBQyxHQUFHLElBQUEsb0JBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQTtJQUNkLEdBQUcsR0FBRyxJQUFBLG9CQUFPLEVBQUMsR0FBRyxDQUFDLENBQUE7SUFDbEIsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQ2hDLENBQUM7QUFKRCxvQkFJQyJ9