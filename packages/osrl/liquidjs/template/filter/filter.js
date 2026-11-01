"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = void 0;
const expression_1 = require("../../render/expression");
const underscore_1 = require("../../util/underscore");
const filter_arg_1 = require("../../parser/filter-arg");
class Filter {
    constructor(name, impl, args, liquid) {
        this.name = name;
        this.impl = impl || underscore_1.identify;
        this.args = args;
        this.liquid = liquid;
    }
    render(value, context) {
        const argv = [];
        for (const arg of this.args) {
            if ((0, filter_arg_1.isKeyValuePair)(arg))
                argv.push([arg[0], (0, expression_1.evalToken)(arg[1], context)]);
            else
                argv.push((0, expression_1.evalToken)(arg, context));
        }
        return this.impl.apply({ context, liquid: this.liquid }, [value, ...argv]);
    }
}
exports.Filter = Filter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL3RlbXBsYXRlL2ZpbHRlci9maWx0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsd0RBQW1EO0FBRW5ELHNEQUFnRDtBQUVoRCx3REFBbUU7QUFHbkUsTUFBYSxNQUFNO0lBTWpCLFlBQW9CLElBQVksRUFBRSxJQUF1QixFQUFFLElBQWlCLEVBQUUsTUFBYztRQUMxRixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksSUFBSSxxQkFBUSxDQUFBO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0lBQ3RCLENBQUM7SUFDTSxNQUFNLENBQUUsS0FBVSxFQUFFLE9BQWdCO1FBQ3pDLE1BQU0sSUFBSSxHQUFVLEVBQUUsQ0FBQTtRQUN0QixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFtQixFQUFFO1lBQzFDLElBQUksSUFBQSwyQkFBYyxFQUFDLEdBQUcsQ0FBQztnQkFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUEsc0JBQVMsRUFBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBOztnQkFDbkUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLHNCQUFTLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUE7U0FDeEM7UUFDRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQzVFLENBQUM7Q0FDRjtBQXBCRCx3QkFvQkMifQ==