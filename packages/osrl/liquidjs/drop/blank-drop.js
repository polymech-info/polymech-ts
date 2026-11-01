"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlankDrop = void 0;
const underscore_1 = require("../util/underscore");
const empty_drop_1 = require("../drop/empty-drop");
class BlankDrop extends empty_drop_1.EmptyDrop {
    equals(value) {
        if (value === false)
            return true;
        if ((0, underscore_1.isNil)((0, underscore_1.toValue)(value)))
            return true;
        if ((0, underscore_1.isString)(value))
            return /^\s*$/.test(value);
        return super.equals(value);
    }
}
exports.BlankDrop = BlankDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxhbmstZHJvcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9kcm9wL2JsYW5rLWRyb3AudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQTZEO0FBQzdELG1EQUE4QztBQUU5QyxNQUFhLFNBQVUsU0FBUSxzQkFBUztJQUMvQixNQUFNLENBQUUsS0FBVTtRQUN2QixJQUFJLEtBQUssS0FBSyxLQUFLO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFDaEMsSUFBSSxJQUFBLGtCQUFLLEVBQUMsSUFBQSxvQkFBTyxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFDdEMsSUFBSSxJQUFBLHFCQUFRLEVBQUMsS0FBSyxDQUFDO1lBQUUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQy9DLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM1QixDQUFDO0NBQ0Y7QUFQRCw4QkFPQyJ9