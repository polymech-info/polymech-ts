"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_1 = require("../../parser/tokenizer");
exports.default = {
    parse: function (token) {
        const tokenizer = new tokenizer_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
        const tokens = tokenizer.readLiquidTagTokens(this.liquid.options);
        this.tpls = this.liquid.parser.parseTokens(tokens);
    },
    render: function* (ctx, emitter) {
        yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9saXF1aWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxzREFBa0Q7QUFFbEQsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxLQUFlO1FBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBQzlFLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pFLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3BELENBQUM7SUFDRCxNQUFNLEVBQUUsUUFBUyxDQUFDLEVBQUUsR0FBWSxFQUFFLE9BQWdCO1FBQ2hELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ3JFLENBQUM7Q0FDZ0IsQ0FBQSJ9