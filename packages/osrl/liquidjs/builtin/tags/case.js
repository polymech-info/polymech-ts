"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const tokenizer_1 = require("../../parser/tokenizer");
exports.default = {
    parse: function (tagToken, remainTokens) {
        this.cond = new types_1.Value(tagToken.args, this.liquid);
        this.cases = [];
        this.elseTemplates = [];
        let p = [];
        const stream = this.liquid.parser.parseStream(remainTokens)
            .on('tag:when', (token) => {
            p = [];
            const tokenizer = new tokenizer_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
            while (!tokenizer.end()) {
                const value = tokenizer.readValue();
                this.cases.push({
                    val: value,
                    templates: p
                });
                tokenizer.readTo(',');
            }
        })
            .on('tag:else', () => (p = this.elseTemplates))
            .on('tag:endcase', () => stream.stop())
            .on('template', (tpl) => p.push(tpl))
            .on('end', () => {
            throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream.start();
    },
    render: function* (ctx, emitter) {
        const r = this.liquid.renderer;
        const cond = (0, types_1.toValue)(yield this.cond.value(ctx, ctx.opts.lenientIf));
        for (const branch of this.cases) {
            const val = (0, types_1.evalToken)(branch.val, ctx, ctx.opts.lenientIf);
            if (val === cond) {
                yield r.renderTemplates(branch.templates, ctx, emitter);
                return;
            }
        }
        yield r.renderTemplates(this.elseTemplates, ctx, emitter);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL3RhZ3MvY2FzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUF5STtBQUN6SSxzREFBa0Q7QUFFbEQsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxRQUFrQixFQUFFLFlBQTZCO1FBQ2hFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxhQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDakQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUE7UUFDZixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUV2QixJQUFJLENBQUMsR0FBZSxFQUFFLENBQUE7UUFDdEIsTUFBTSxNQUFNLEdBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUM7YUFDckUsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQWUsRUFBRSxFQUFFO1lBQ2xDLENBQUMsR0FBRyxFQUFFLENBQUE7WUFFTixNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUU5RSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUN2QixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNkLEdBQUcsRUFBRSxLQUFLO29CQUNWLFNBQVMsRUFBRSxDQUFDO2lCQUNiLENBQUMsQ0FBQTtnQkFDRixTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3RCO1FBQ0gsQ0FBQyxDQUFDO2FBQ0QsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7YUFDOUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDdEMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM5QyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtZQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFBO1FBQ3pELENBQUMsQ0FBQyxDQUFBO1FBRUosTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFBO0lBQ2hCLENBQUM7SUFFRCxNQUFNLEVBQUUsUUFBUyxDQUFDLEVBQUUsR0FBWSxFQUFFLE9BQWdCO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFBO1FBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBTyxFQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUNwRSxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBQSxpQkFBUyxFQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDMUQsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO2dCQUNoQixNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ3ZELE9BQU07YUFDUDtTQUNGO1FBQ0QsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzNELENBQUM7Q0FDZ0IsQ0FBQSJ9