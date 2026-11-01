"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Output = void 0;
const value_1 = require("./value");
const template_impl_1 = require("../template/template-impl");
const filter_1 = require("./filter/filter");
class Output extends template_impl_1.TemplateImpl {
    constructor(token, liquid) {
        super(token);
        this.value = new value_1.Value(token.content, liquid);
        const filters = this.value.filters;
        const outputEscape = liquid.options.outputEscape;
        if (filters.length && filters[filters.length - 1].name === 'raw') {
            filters.pop();
        }
        else if (outputEscape) {
            filters.push(new filter_1.Filter(toString.call(outputEscape), outputEscape, [], liquid));
        }
    }
    *render(ctx, emitter) {
        const val = yield this.value.value(ctx, false);
        emitter.write(val);
    }
}
exports.Output = Output;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3RlbXBsYXRlL291dHB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBK0I7QUFDL0IsNkRBQXdEO0FBTXhELDRDQUF3QztBQUV4QyxNQUFhLE1BQU8sU0FBUSw0QkFBeUI7SUFFbkQsWUFBb0IsS0FBa0IsRUFBRSxNQUFjO1FBQ3BELEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNaLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUM3QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQTtRQUNsQyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQTtRQUNoRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRTtZQUNoRSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUE7U0FDZDthQUFNLElBQUksWUFBWSxFQUFFO1lBQ3ZCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7U0FDaEY7SUFDSCxDQUFDO0lBQ00sQ0FBRSxNQUFNLENBQUUsR0FBWSxFQUFFLE9BQWdCO1FBQzdDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDcEIsQ0FBQztDQUNGO0FBakJELHdCQWlCQyJ9