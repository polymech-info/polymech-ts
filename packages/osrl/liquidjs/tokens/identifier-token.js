"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierToken = void 0;
const token_1 = require("./token");
const character_1 = require("../util/character");
const token_kind_1 = require("../parser/token-kind");
class IdentifierToken extends token_1.Token {
    constructor(input, begin, end, file) {
        super(token_kind_1.TokenKind.Word, input, begin, end, file);
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
        this.content = this.getText();
    }
    isNumber(allowSign = false) {
        const begin = allowSign && character_1.TYPES[this.input.charCodeAt(this.begin)] & character_1.SIGN
            ? this.begin + 1
            : this.begin;
        for (let i = begin; i < this.end; i++) {
            if (!(character_1.TYPES[this.input.charCodeAt(i)] & character_1.NUMBER))
                return false;
        }
        return true;
    }
}
exports.IdentifierToken = IdentifierToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpZmllci10b2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy90b2tlbnMvaWRlbnRpZmllci10b2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBK0I7QUFDL0IsaURBQXVEO0FBQ3ZELHFEQUFnRDtBQUVoRCxNQUFhLGVBQWdCLFNBQVEsYUFBSztJQUV4QyxZQUNTLEtBQWEsRUFDYixLQUFhLEVBQ2IsR0FBVyxFQUNYLElBQWE7UUFFcEIsS0FBSyxDQUFDLHNCQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBTHZDLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDYixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsUUFBRyxHQUFILEdBQUcsQ0FBUTtRQUNYLFNBQUksR0FBSixJQUFJLENBQVM7UUFHcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDL0IsQ0FBQztJQUNELFFBQVEsQ0FBRSxTQUFTLEdBQUcsS0FBSztRQUN6QixNQUFNLEtBQUssR0FBRyxTQUFTLElBQUksaUJBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxnQkFBSTtZQUN4RSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLENBQUMsaUJBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGtCQUFNLENBQUM7Z0JBQUUsT0FBTyxLQUFLLENBQUE7U0FDOUQ7UUFDRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRjtBQXBCRCwwQ0FvQkMifQ==