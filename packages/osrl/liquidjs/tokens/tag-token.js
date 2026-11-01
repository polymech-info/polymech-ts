"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagToken = void 0;
const delimited_token_1 = require("./delimited-token");
const error_1 = require("../util/error");
const token_kind_1 = require("../parser/token-kind");
const tokenizer_1 = require("../parser/tokenizer");
class TagToken extends delimited_token_1.DelimitedToken {
    constructor(input, begin, end, options, file) {
        const { trimTagLeft, trimTagRight, tagDelimiterLeft, tagDelimiterRight } = options;
        const value = input.slice(begin + tagDelimiterLeft.length, end - tagDelimiterRight.length);
        super(token_kind_1.TokenKind.Tag, value, input, begin, end, trimTagLeft, trimTagRight, file);
        const tokenizer = new tokenizer_1.Tokenizer(this.content, options.operatorsTrie);
        this.name = tokenizer.readTagName();
        if (!this.name)
            throw new error_1.TokenizationError(`illegal tag syntax`, this);
        tokenizer.skipBlank();
        this.args = tokenizer.remaining();
    }
}
exports.TagToken = TagToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy90YWctdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdURBQWtEO0FBQ2xELHlDQUFpRDtBQUVqRCxxREFBZ0Q7QUFDaEQsbURBQStDO0FBRS9DLE1BQWEsUUFBUyxTQUFRLGdDQUFjO0lBRzFDLFlBQ0UsS0FBYSxFQUNiLEtBQWEsRUFDYixHQUFXLEVBQ1gsT0FBOEIsRUFDOUIsSUFBYTtRQUViLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLEdBQUcsT0FBTyxDQUFBO1FBQ2xGLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUYsS0FBSyxDQUFDLHNCQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRS9FLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUNwRSxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7WUFBRSxNQUFNLElBQUkseUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFdkUsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO0lBQ25DLENBQUM7Q0FDRjtBQXJCRCw0QkFxQkMifQ==