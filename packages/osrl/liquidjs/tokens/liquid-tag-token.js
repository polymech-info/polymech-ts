"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidTagToken = void 0;
const delimited_token_1 = require("./delimited-token");
const error_1 = require("../util/error");
const token_kind_1 = require("../parser/token-kind");
const tokenizer_1 = require("../parser/tokenizer");
class LiquidTagToken extends delimited_token_1.DelimitedToken {
    constructor(input, begin, end, options, file) {
        const value = input.slice(begin, end);
        super(token_kind_1.TokenKind.Tag, value, input, begin, end, false, false, file);
        if (!/\S/.test(value)) {
            // A line that contains only whitespace.
            this.name = '';
            this.args = '';
        }
        else {
            const tokenizer = new tokenizer_1.Tokenizer(this.content, options.operatorsTrie);
            this.name = tokenizer.readTagName();
            if (!this.name)
                throw new error_1.TokenizationError(`illegal liquid tag syntax`, this);
            tokenizer.skipBlank();
            this.args = tokenizer.remaining();
        }
    }
}
exports.LiquidTagToken = LiquidTagToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkLXRhZy10b2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90b2tlbnMvbGlxdWlkLXRhZy10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx1REFBa0Q7QUFDbEQseUNBQWlEO0FBRWpELHFEQUFnRDtBQUNoRCxtREFBK0M7QUFFL0MsTUFBYSxjQUFlLFNBQVEsZ0NBQWM7SUFHaEQsWUFDRSxLQUFhLEVBQ2IsS0FBYSxFQUNiLEdBQVcsRUFDWCxPQUE4QixFQUM5QixJQUFhO1FBRWIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDckMsS0FBSyxDQUFDLHNCQUFTLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRWxFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3JCLHdDQUF3QztZQUN4QyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtZQUNkLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFBO1NBQ2Y7YUFBTTtZQUNMLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUNwRSxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQUUsTUFBTSxJQUFJLHlCQUFpQixDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxDQUFBO1lBRTlFLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtTQUNsQztJQUNILENBQUM7Q0FDRjtBQTFCRCx3Q0EwQkMifQ==