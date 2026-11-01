"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTML = void 0;
const template_impl_1 = require("../template/template-impl");
class HTML extends template_impl_1.TemplateImpl {
    constructor(token) {
        super(token);
        this.str = token.getContent();
    }
    *render(ctx, emitter) {
        emitter.write(this.str);
    }
}
exports.HTML = HTML;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90ZW1wbGF0ZS9odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZEQUF3RDtBQU14RCxNQUFhLElBQUssU0FBUSw0QkFBdUI7SUFFL0MsWUFBb0IsS0FBZ0I7UUFDbEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ1osSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUNNLENBQUUsTUFBTSxDQUFFLEdBQVksRUFBRSxPQUFnQjtRQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN6QixDQUFDO0NBQ0Y7QUFURCxvQkFTQyJ9