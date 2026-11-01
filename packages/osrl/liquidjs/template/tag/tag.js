"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const underscore_1 = require("../../util/underscore");
const template_impl_1 = require("../../template/template-impl");
const types_1 = require("../../types");
class Tag extends template_impl_1.TemplateImpl {
    constructor(token, tokens, liquid) {
        super(token);
        this.name = token.name;
        const impl = liquid.tags.get(token.name);
        this.impl = Object.create(impl);
        this.impl.liquid = liquid;
        if (this.impl.parse) {
            this.impl.parse(token, tokens);
        }
    }
    *render(ctx, emitter) {
        const hash = (yield new types_1.Hash(this.token.args).render(ctx));
        const impl = this.impl;
        if ((0, underscore_1.isFunction)(impl.render))
            return yield impl.render(ctx, emitter, hash);
    }
}
exports.Tag = Tag;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL3RlbXBsYXRlL3RhZy90YWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0RBQWtEO0FBRWxELGdFQUEyRDtBQUMzRCx1Q0FBdUY7QUFJdkYsTUFBYSxHQUFJLFNBQVEsNEJBQXNCO0lBSTdDLFlBQW9CLEtBQWUsRUFBRSxNQUF1QixFQUFFLE1BQWM7UUFDMUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1FBRXRCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUV4QyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3pCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1NBQy9CO0lBQ0gsQ0FBQztJQUNNLENBQUUsTUFBTSxDQUFFLEdBQVksRUFBRSxPQUFnQjtRQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxZQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQWMsQ0FBQTtRQUN2RSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1FBQ3RCLElBQUksSUFBQSx1QkFBVSxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFBRSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzNFLENBQUM7Q0FDRjtBQXJCRCxrQkFxQkMifQ==