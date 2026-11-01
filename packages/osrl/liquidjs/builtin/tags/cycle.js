"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("../../util/assert");
const types_1 = require("../../types");
const tokenizer_1 = require("../../parser/tokenizer");
exports.default = {
    parse: function (tagToken) {
        const tokenizer = new tokenizer_1.Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
        const group = tokenizer.readValue();
        tokenizer.skipBlank();
        this.candidates = [];
        if (group) {
            if (tokenizer.peek() === ':') {
                this.group = group;
                tokenizer.advance();
            }
            else
                this.candidates.push(group);
        }
        while (!tokenizer.end()) {
            const value = tokenizer.readValue();
            if (value)
                this.candidates.push(value);
            tokenizer.readTo(',');
        }
        (0, assert_1.assert)(this.candidates.length, () => `empty candidates: ${tagToken.getText()}`);
    },
    render: function (ctx, emitter) {
        const group = (0, types_1.evalToken)(this.group, ctx);
        const fingerprint = `cycle:${group}:` + this.candidates.join(',');
        const groups = ctx.getRegister('cycle');
        let idx = groups[fingerprint];
        if (idx === undefined) {
            idx = groups[fingerprint] = 0;
        }
        const candidate = this.candidates[idx];
        idx = (idx + 1) % this.candidates.length;
        groups[fingerprint] = idx;
        const html = (0, types_1.evalToken)(candidate, ctx);
        emitter.write(html);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ljbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL2N5Y2xlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsOENBQTBDO0FBQzFDLHVDQUFtRjtBQUNuRixzREFBa0Q7QUFFbEQsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxRQUFrQjtRQUNqQyxNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUNqRixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDbkMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBRXJCLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFBO1FBRXBCLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO2dCQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtnQkFDbEIsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFBO2FBQ3BCOztnQkFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUNuQztRQUVELE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDdkIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ25DLElBQUksS0FBSztnQkFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUN0QyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3RCO1FBQ0QsSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMscUJBQXFCLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDakYsQ0FBQztJQUVELE1BQU0sRUFBRSxVQUFVLEdBQVksRUFBRSxPQUFnQjtRQUM5QyxNQUFNLEtBQUssR0FBRyxJQUFBLGlCQUFTLEVBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUN4QyxNQUFNLFdBQVcsR0FBRyxTQUFTLEtBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ2pFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDdkMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBRTdCLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtZQUNyQixHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUM5QjtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDdEMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFBO1FBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUE7UUFDekIsTUFBTSxJQUFJLEdBQUcsSUFBQSxpQkFBUyxFQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3JCLENBQUM7Q0FDZ0IsQ0FBQSJ9