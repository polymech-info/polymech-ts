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
            templates: (p = [])
        }))
            .on('tag:elsif', (token) => this.branches.push({
            predicate: new types_1.Value(token.args, this.liquid),
            templates: (p = [])
        }))
            .on('tag:else', () => (p = this.elseTemplates))
            .on('tag:endif', function () { this.stop(); })
            .on('template', (tpl) => p.push(tpl))
            .on('end', () => { throw new Error(`tag ${tagToken.getText()} not closed`); })
            .start();
    },
    render: function* (ctx, emitter) {
        const r = this.liquid.renderer;
        for (const { predicate, templates } of this.branches) {
            const value = yield predicate.value(ctx, ctx.opts.lenientIf);
            if ((0, types_1.isTruthy)(value, ctx)) {
                yield r.renderTemplates(templates, ctx, emitter);
                return;
            }
        }
        yield r.renderTemplates(this.elseTemplates, ctx, emitter);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL2lmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQWtIO0FBRWxILGtCQUFlO0lBQ2IsS0FBSyxFQUFFLFVBQVUsUUFBa0IsRUFBRSxZQUE2QjtRQUNoRSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQTtRQUNsQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUV2QixJQUFJLENBQUMsQ0FBQTtRQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUM7YUFDekMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNwQyxTQUFTLEVBQUUsSUFBSSxhQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2hELFNBQVMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDcEIsQ0FBQyxDQUFDO2FBQ0YsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDdkQsU0FBUyxFQUFFLElBQUksYUFBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM3QyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3BCLENBQUMsQ0FBQzthQUNGLEVBQUUsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQzlDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUEsQ0FBQyxDQUFDLENBQUM7YUFDNUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM5QyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO2FBQzVFLEtBQUssRUFBRSxDQUFBO0lBQ1osQ0FBQztJQUVELE1BQU0sRUFBRSxRQUFTLENBQUMsRUFBRSxHQUFZLEVBQUUsT0FBZ0I7UUFDaEQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUE7UUFFOUIsS0FBSyxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDcEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQzVELElBQUksSUFBQSxnQkFBUSxFQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDeEIsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ2hELE9BQU07YUFDUDtTQUNGO1FBQ0QsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzNELENBQUM7Q0FDZ0IsQ0FBQSJ9