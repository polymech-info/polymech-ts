"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
exports.default = {
    parse: function (token) {
        const tokenizer = new types_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
        this.key = tokenizer.readIdentifier().content;
        tokenizer.skipBlank();
        (0, types_1.assert)(tokenizer.peek() === '=', () => `illegal token ${token.getText()}`);
        tokenizer.advance();
        this.value = new types_1.Value(tokenizer.remaining(), this.liquid);
    },
    render: function* (ctx) {
        ctx.bottom()[this.key] = yield this.value.value(ctx, this.liquid.options.lenientIf);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzaWduLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9hc3NpZ24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBeUY7QUFFekYsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxLQUFlO1FBQzlCLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBQzlFLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDLE9BQU8sQ0FBQTtRQUM3QyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDckIsSUFBQSxjQUFNLEVBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUMxRSxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzVELENBQUM7SUFDRCxNQUFNLEVBQUUsUUFBUyxDQUFDLEVBQUUsR0FBWTtRQUM5QixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQ3JGLENBQUM7Q0FDZ0IsQ0FBQSJ9