"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const underscore_1 = require("../../util/underscore");
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
        emitter.write((0, underscore_1.stringify)(--scope[this.variable]));
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjcmVtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9kZWNyZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBbUY7QUFDbkYsc0RBQTJEO0FBRTNELGtCQUFlO0lBQ2IsS0FBSyxFQUFFLFVBQVUsS0FBZTtRQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxPQUFPLENBQUE7SUFDcEQsQ0FBQztJQUNELE1BQU0sRUFBRSxVQUFVLE9BQWdCLEVBQUUsT0FBZ0I7UUFDbEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQTtRQUNsQyxJQUFJLENBQUMsSUFBQSxxQkFBUSxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN6QjtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBQSxzQkFBUyxFQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbEQsQ0FBQztDQUNnQixDQUFBIn0=