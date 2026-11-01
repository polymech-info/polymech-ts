"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const underscore_1 = require("../../util/underscore");
const types_1 = require("../../types");
exports.default = {
    parse: function (token) {
        const tokenizer = new types_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
        this.variable = tokenizer.readIdentifier().content;
    },
    render: function (context, emitter) {
        const scope = context.environments;
        if (!(0, underscore_1.isNumber)(scope[this.variable])) {
            scope[this.variable] = 0;
        }
        const val = scope[this.variable];
        scope[this.variable]++;
        emitter.write((0, underscore_1.stringify)(val));
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5jcmVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9pbmNyZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzREFBMkQ7QUFDM0QsdUNBQW1GO0FBRW5GLGtCQUFlO0lBQ2IsS0FBSyxFQUFFLFVBQVUsS0FBZTtRQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxPQUFPLENBQUE7SUFDcEQsQ0FBQztJQUNELE1BQU0sRUFBRSxVQUFVLE9BQWdCLEVBQUUsT0FBZ0I7UUFDbEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQTtRQUNsQyxJQUFJLENBQUMsSUFBQSxxQkFBUSxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN6QjtRQUNELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFBO1FBQ3RCLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDL0IsQ0FBQztDQUNnQixDQUFBIn0=