"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullDrop = void 0;
const drop_1 = require("./drop");
const underscore_1 = require("../util/underscore");
class NullDrop extends drop_1.Drop {
    equals(value) {
        return (0, underscore_1.isNil)((0, underscore_1.toValue)(value));
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
        return null;
    }
}
exports.NullDrop = NullDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbC1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL2Ryb3AvbnVsbC1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUE2QjtBQUU3QixtREFBbUQ7QUFFbkQsTUFBYSxRQUFTLFNBQVEsV0FBSTtJQUN6QixNQUFNLENBQUUsS0FBVTtRQUN2QixPQUFPLElBQUEsa0JBQUssRUFBQyxJQUFBLG9CQUFPLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtJQUM5QixDQUFDO0lBQ00sRUFBRTtRQUNQLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNNLEdBQUc7UUFDUixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFDTSxFQUFFO1FBQ1AsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBQ00sR0FBRztRQUNSLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUNNLE9BQU87UUFDWixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRjtBQW5CRCw0QkFtQkMifQ==