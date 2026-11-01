"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyDrop = void 0;
const drop_1 = require("./drop");
const underscore_1 = require("../util/underscore");
class EmptyDrop extends drop_1.Drop {
    equals(value) {
        if (value instanceof EmptyDrop)
            return false;
        value = (0, underscore_1.toValue)(value);
        if ((0, underscore_1.isString)(value) || (0, underscore_1.isArray)(value))
            return value.length === 0;
        if ((0, underscore_1.isObject)(value))
            return Object.keys(value).length === 0;
        return false;
    }
    gt() {
        return false;
    }
    geq() {
        return false;
    }
    lt() {
        return false;
    }
    leq() {
        return false;
    }
    valueOf() {
        return '';
    }
}
exports.EmptyDrop = EmptyDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHktZHJvcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9kcm9wL2VtcHR5LWRyb3AudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQTZCO0FBRTdCLG1EQUF5RTtBQUV6RSxNQUFhLFNBQVUsU0FBUSxXQUFJO0lBQzFCLE1BQU0sQ0FBRSxLQUFVO1FBQ3ZCLElBQUksS0FBSyxZQUFZLFNBQVM7WUFBRSxPQUFPLEtBQUssQ0FBQTtRQUM1QyxLQUFLLEdBQUcsSUFBQSxvQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3RCLElBQUksSUFBQSxxQkFBUSxFQUFDLEtBQUssQ0FBQyxJQUFJLElBQUEsb0JBQU8sRUFBQyxLQUFLLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFBO1FBQ2hFLElBQUksSUFBQSxxQkFBUSxFQUFDLEtBQUssQ0FBQztZQUFFLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFBO1FBQzNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNNLEVBQUU7UUFDUCxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDTSxHQUFHO1FBQ1IsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ00sRUFBRTtRQUNQLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNNLEdBQUc7UUFDUixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDTSxPQUFPO1FBQ1osT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0NBQ0Y7QUF2QkQsOEJBdUJDIn0=