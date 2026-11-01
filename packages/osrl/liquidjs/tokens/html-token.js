"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class HTMLToken extends token_1.Token {
    constructor(input, begin, end, file) {
        super(token_kind_1.TokenKind.HTML, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.trimLeft = 0;
        this.trimRight = 0;
    }
    getContent() {
        return this.input.slice(this.begin + this.trimLeft, this.end - this.trimRight);
    }
}
exports.HTMLToken = HTMLToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC10b2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90b2tlbnMvaHRtbC10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBK0I7QUFDL0IscURBQWdEO0FBRWhELE1BQWEsU0FBVSxTQUFRLGFBQUs7SUFHbEMsWUFDUyxLQUFhLEVBQ2IsS0FBYSxFQUNiLEdBQVcsRUFDWCxJQUFhO1FBRXBCLEtBQUssQ0FBQyxzQkFBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUx2QyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFTO1FBTnRCLGFBQVEsR0FBRyxDQUFDLENBQUE7UUFDWixjQUFTLEdBQUcsQ0FBQyxDQUFBO0lBUWIsQ0FBQztJQUNNLFVBQVU7UUFDZixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUNoRixDQUFDO0NBQ0Y7QUFkRCw4QkFjQyJ9