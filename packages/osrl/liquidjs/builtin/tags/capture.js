"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const expression_1 = require("../../render/expression");
exports.default = {
    parse: function (tagToken, remainTokens) {
        const tokenizer = new types_1.Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
        this.variable = readVariableName(tokenizer);
        (0, types_1.assert)(this.variable, () => `${tagToken.args} not valid identifier`);
        this.templates = [];
        const stream = this.liquid.parser.parseStream(remainTokens);
        stream.on('tag:endcapture', () => stream.stop())
            .on('template', (tpl) => this.templates.push(tpl))
            .on('end', () => {
            throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream.start();
    },
    render: function* (ctx) {
        const r = this.liquid.renderer;
        const html = yield r.renderTemplates(this.templates, ctx);
        ctx.bottom()[this.variable] = html;
    }
};
function readVariableName(tokenizer) {
    const word = tokenizer.readIdentifier().content;
    if (word)
        return word;
    const quoted = tokenizer.readQuoted();
    if (quoted)
        return (0, expression_1.evalQuotedToken)(quoted);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FwdHVyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL3RhZ3MvY2FwdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUEyRztBQUMzRyx3REFBeUQ7QUFFekQsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxRQUFrQixFQUFFLFlBQTZCO1FBQ2hFLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBQ2pGLElBQUksQ0FBQyxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDM0MsSUFBQSxjQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLHVCQUF1QixDQUFDLENBQUE7UUFFcEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFFbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBQzNELE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQzdDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzNELEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7UUFDSixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDaEIsQ0FBQztJQUNELE1BQU0sRUFBRSxRQUFTLENBQUMsRUFBRSxHQUFZO1FBQzlCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFBO1FBQzlCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3pELEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFBO0lBQ3BDLENBQUM7Q0FDZ0IsQ0FBQTtBQUVuQixTQUFTLGdCQUFnQixDQUFFLFNBQW9CO0lBQzdDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxPQUFPLENBQUE7SUFDL0MsSUFBSSxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUE7SUFDckIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3JDLElBQUksTUFBTTtRQUFFLE9BQU8sSUFBQSw0QkFBZSxFQUFDLE1BQU0sQ0FBQyxDQUFBO0FBQzVDLENBQUMifQ==