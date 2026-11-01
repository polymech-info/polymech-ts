"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class HashToken extends token_1.Token {
    constructor(input, begin, end, name, value, file) {
        super(token_kind_1.TokenKind.Hash, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.name = name;
        this.value = value;
        this.file = file;
    }
}
exports.HashToken = HashToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC10b2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90b2tlbnMvaGFzaC10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBK0I7QUFHL0IscURBQWdEO0FBRWhELE1BQWEsU0FBVSxTQUFRLGFBQUs7SUFDbEMsWUFDUyxLQUFhLEVBQ2IsS0FBYSxFQUNiLEdBQVcsRUFDWCxJQUFxQixFQUNyQixLQUFrQixFQUNsQixJQUFhO1FBRXBCLEtBQUssQ0FBQyxzQkFBUyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQVB2QyxVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFpQjtRQUNyQixVQUFLLEdBQUwsS0FBSyxDQUFhO1FBQ2xCLFNBQUksR0FBSixJQUFJLENBQVM7SUFHdEIsQ0FBQztDQUNGO0FBWEQsOEJBV0MifQ==