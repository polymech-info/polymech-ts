"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class RangeToken extends token_1.Token {
    constructor(input, begin, end, lhs, rhs, file) {
        super(token_kind_1.TokenKind.Range, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.lhs = lhs;
        this.rhs = rhs;
        this.file = file;
    }
}
exports.RangeToken = RangeToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2UtdG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdG9rZW5zL3JhbmdlLXRva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUErQjtBQUUvQixxREFBZ0Q7QUFFaEQsTUFBYSxVQUFXLFNBQVEsYUFBSztJQUNuQyxZQUNTLEtBQWEsRUFDYixLQUFhLEVBQ2IsR0FBVyxFQUNYLEdBQWUsRUFDZixHQUFlLEVBQ2YsSUFBYTtRQUVwQixLQUFLLENBQUMsc0JBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFQeEMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDYixRQUFHLEdBQUgsR0FBRyxDQUFRO1FBQ1gsUUFBRyxHQUFILEdBQUcsQ0FBWTtRQUNmLFFBQUcsR0FBSCxHQUFHLENBQVk7UUFDZixTQUFJLEdBQUosSUFBSSxDQUFTO0lBR3RCLENBQUM7Q0FDRjtBQVhELGdDQVdDIn0=