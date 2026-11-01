"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotedToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class QuotedToken extends token_1.Token {
    constructor(input, begin, end, file) {
        super(token_kind_1.TokenKind.Quoted, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
    }
}
exports.QuotedToken = QuotedToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGVkLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9xdW90ZWQtdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQStCO0FBQy9CLHFEQUFnRDtBQUVoRCxNQUFhLFdBQVksU0FBUSxhQUFLO0lBQ3BDLFlBQ1MsS0FBYSxFQUNiLEtBQWEsRUFDYixHQUFXLEVBQ1gsSUFBYTtRQUVwQixLQUFLLENBQUMsc0JBQVMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFMekMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDYixRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQ1gsU0FBSSxHQUFKLElBQUksQ0FBUztJQUd0QixDQUFDO0NBQ0Y7QUFURCxrQ0FTQyJ9