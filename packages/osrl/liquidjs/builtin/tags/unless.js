"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
exports.default = {
    parse: function (tagToken, remainTokens) {
        this.branches = [];
        this.elseTemplates = [];
        let p;
        this.liquid.parser.parseStream(remainTokens)
            .on('start', () => this.branches.push({
            predicate: new types_1.Value(tagToken.args, this.liquid),
            test: types_1.isFalsy,
            templates: (p = [])
        }))
            .on('tag:elsif', (token) => this.branches.push({
            predicate: new types_1.Value(token.args, this.liquid),
            test: types_1.isTruthy,
            templates: (p = [])
        }))
            .on('tag:else', () => (p = this.elseTemplates))
            .on('tag:endunless', function () { this.stop(); })
            .on('template', (tpl) => p.push(tpl))
            .on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); })
            .start();
    },
    render: function* (ctx, emitter) {
        const r = this.liquid.renderer;
        for (const { predicate, test, templates } of this.branches) {
            const value = yield predicate.value(ctx, ctx.opts.lenientIf);
            if (test(value, ctx)) {
                yield r.renderTemplates(templates, ctx, emitter);
                return;
            }
        }
        yield r.renderTemplates(this.elseTemplates, ctx, emitter);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5sZXNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy91bmxlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBMkg7QUFFM0gsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxRQUFrQixFQUFFLFlBQTZCO1FBQ2hFLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBO1FBQ2xCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxDQUFBO1FBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQzthQUN6QyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ3BDLFNBQVMsRUFBRSxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDaEQsSUFBSSxFQUFFLGVBQU87WUFDYixTQUFTLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3BCLENBQUMsQ0FBQzthQUNGLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ3ZELFNBQVMsRUFBRSxJQUFJLGFBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDN0MsSUFBSSxFQUFFLGdCQUFRO1lBQ2QsU0FBUyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNwQixDQUFDLENBQUM7YUFDRixFQUFFLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUM5QyxFQUFFLENBQUMsZUFBZSxFQUFFLGNBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBLENBQUMsQ0FBQyxDQUFDO2FBQ2hELEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFhLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDOUMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQzthQUM1RSxLQUFLLEVBQUUsQ0FBQTtJQUNaLENBQUM7SUFFRCxNQUFNLEVBQUUsUUFBUyxDQUFDLEVBQUUsR0FBWSxFQUFFLE9BQWdCO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFBO1FBRTlCLEtBQUssTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUMxRCxNQUFNLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDNUQsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtnQkFDaEQsT0FBTTthQUNQO1NBQ0Y7UUFFRCxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDM0QsQ0FBQztDQUNnQixDQUFBIn0=