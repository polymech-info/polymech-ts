"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberToken = void 0;
const token_1 = require("./token");
const token_kind_1 = require("../parser/token-kind");
class NumberToken extends token_1.Token {
    constructor(whole, decimal) {
        super(token_kind_1.TokenKind.Number, whole.input, whole.begin, decimal ? decimal.end : whole.end, whole.file);
        this.whole = whole;
        this.decimal = decimal;
    }
}
exports.NumberToken = NumberToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9udW1iZXItdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQStCO0FBRS9CLHFEQUFnRDtBQUVoRCxNQUFhLFdBQVksU0FBUSxhQUFLO0lBQ3BDLFlBQ1MsS0FBc0IsRUFDdEIsT0FBeUI7UUFFaEMsS0FBSyxDQUFDLHNCQUFTLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBSHpGLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBQ3RCLFlBQU8sR0FBUCxPQUFPLENBQWtCO0lBR2xDLENBQUM7Q0FDRjtBQVBELGtDQU9DIn0=