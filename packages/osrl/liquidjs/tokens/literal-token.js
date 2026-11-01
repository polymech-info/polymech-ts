"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteralToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class LiteralToken extends token_1.Token {
    constructor(input, begin, end, file) {
        super(token_kind_1.TokenKind.Literal, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.literal = this.getText();
    }
}
exports.LiteralToken = LiteralToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl0ZXJhbC10b2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90b2tlbnMvbGl0ZXJhbC10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBK0I7QUFDL0IscURBQWdEO0FBRWhELE1BQWEsWUFBYSxTQUFRLGFBQUs7SUFFckMsWUFDUyxLQUFhLEVBQ2IsS0FBYSxFQUNiLEdBQVcsRUFDWCxJQUFhO1FBRXBCLEtBQUssQ0FBQyxzQkFBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUwxQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFTO1FBR3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQy9CLENBQUM7Q0FDRjtBQVhELG9DQVdDIn0=