"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorToken = exports.precedence = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
exports.precedence = {
    '==': 1,
    '!=': 1,
    '>': 1,
    '<': 1,
    '>=': 1,
    '<=': 1,
    'contains': 1,
    'and': 0,
    'or': 0
};
class OperatorToken extends token_1.Token {
    constructor(input, begin, end, file) {
        super(token_kind_1.TokenKind.Operator, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.operator = this.getText();
    }
    getPrecedence() {
        const key = this.getText();
        return key in exports.precedence ? exports.precedence[key] : 1;
    }
}
exports.OperatorToken = OperatorToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0b3ItdG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdG9rZW5zL29wZXJhdG9yLXRva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUErQjtBQUMvQixxREFBZ0Q7QUFFbkMsUUFBQSxVQUFVLEdBQUc7SUFDeEIsSUFBSSxFQUFFLENBQUM7SUFDUCxJQUFJLEVBQUUsQ0FBQztJQUNQLEdBQUcsRUFBRSxDQUFDO0lBQ04sR0FBRyxFQUFFLENBQUM7SUFDTixJQUFJLEVBQUUsQ0FBQztJQUNQLElBQUksRUFBRSxDQUFDO0lBQ1AsVUFBVSxFQUFFLENBQUM7SUFDYixLQUFLLEVBQUUsQ0FBQztJQUNSLElBQUksRUFBRSxDQUFDO0NBQ1IsQ0FBQTtBQUVELE1BQWEsYUFBYyxTQUFRLGFBQUs7SUFFdEMsWUFDUyxLQUFhLEVBQ2IsS0FBYSxFQUNiLEdBQVcsRUFDWCxJQUFhO1FBRXBCLEtBQUssQ0FBQyxzQkFBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUwzQyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFTO1FBR3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO0lBQ2hDLENBQUM7SUFDRCxhQUFhO1FBQ1gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQzFCLE9BQU8sR0FBRyxJQUFJLGtCQUFVLENBQUMsQ0FBQyxDQUFDLGtCQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0NBQ0Y7QUFmRCxzQ0FlQyJ9