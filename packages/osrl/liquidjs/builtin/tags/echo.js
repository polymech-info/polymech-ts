"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const value_1 = require("../../template/value");
exports.default = {
    parse: function (token) {
        this.value = new value_1.Value(token.args, this.liquid);
    },
    render: function* (ctx, emitter) {
        const val = yield this.value.value(ctx, false);
        emitter.write(val);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNoby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL3RhZ3MvZWNoby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdEQUE0QztBQUk1QyxrQkFBZTtJQUNiLEtBQUssRUFBRSxVQUFVLEtBQWU7UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNqRCxDQUFDO0lBQ0QsTUFBTSxFQUFFLFFBQVMsQ0FBQyxFQUFFLEdBQVksRUFBRSxPQUFnQjtRQUNoRCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM5QyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3BCLENBQUM7Q0FDZ0IsQ0FBQSJ9