"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputToken = void 0;
const delimited_token_1 = require("./delimited-token");
const token_kind_1 = require("../parser/token-kind");
class OutputToken extends delimited_token_1.DelimitedToken {
    constructor(input, begin, end, options, file) {
        const { trimOutputLeft, trimOutputRight, outputDelimiterLeft, outputDelimiterRight } = options;
        const value = input.slice(begin + outputDelimiterLeft.length, end - outputDelimiterRight.length);
        super(token_kind_1.TokenKind.Output, value, input, begin, end, trimOutputLeft, trimOutputRight, file);
    }
}
exports.OutputToken = OutputToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9vdXRwdXQtdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdURBQWtEO0FBRWxELHFEQUFnRDtBQUVoRCxNQUFhLFdBQVksU0FBUSxnQ0FBYztJQUM3QyxZQUNFLEtBQWEsRUFDYixLQUFhLEVBQ2IsR0FBVyxFQUNYLE9BQThCLEVBQzlCLElBQWE7UUFFYixNQUFNLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxHQUFHLE9BQU8sQ0FBQTtRQUM5RixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2hHLEtBQUssQ0FBQyxzQkFBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMxRixDQUFDO0NBQ0Y7QUFaRCxrQ0FZQyJ9