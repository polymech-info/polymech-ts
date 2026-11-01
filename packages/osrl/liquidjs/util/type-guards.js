"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRangeToken = exports.isWordToken = exports.isPropertyAccessToken = exports.isNumberToken = exports.isLiteralToken = exports.isQuotedToken = exports.isTagToken = exports.isOutputToken = exports.isHTMLToken = exports.isOperatorToken = exports.isDelimitedToken = void 0;
const token_kind_1 = require("../parser/token-kind");
function isDelimitedToken(val) {
    return !!(getKind(val) & token_kind_1.TokenKind.Delimited);
}
exports.isDelimitedToken = isDelimitedToken;
function isOperatorToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Operator;
}
exports.isOperatorToken = isOperatorToken;
function isHTMLToken(val) {
    return getKind(val) === token_kind_1.TokenKind.HTML;
}
exports.isHTMLToken = isHTMLToken;
function isOutputToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Output;
}
exports.isOutputToken = isOutputToken;
function isTagToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Tag;
}
exports.isTagToken = isTagToken;
function isQuotedToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Quoted;
}
exports.isQuotedToken = isQuotedToken;
function isLiteralToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Literal;
}
exports.isLiteralToken = isLiteralToken;
function isNumberToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Number;
}
exports.isNumberToken = isNumberToken;
function isPropertyAccessToken(val) {
    return getKind(val) === token_kind_1.TokenKind.PropertyAccess;
}
exports.isPropertyAccessToken = isPropertyAccessToken;
function isWordToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Word;
}
exports.isWordToken = isWordToken;
function isRangeToken(val) {
    return getKind(val) === token_kind_1.TokenKind.Range;
}
exports.isRangeToken = isRangeToken;
function getKind(val) {
    return val ? val.kind : -1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZS1ndWFyZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdXRpbC90eXBlLWd1YXJkcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFXQSxxREFBZ0Q7QUFFaEQsU0FBZ0IsZ0JBQWdCLENBQUUsR0FBUTtJQUN4QyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxzQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQy9DLENBQUM7QUFGRCw0Q0FFQztBQUVELFNBQWdCLGVBQWUsQ0FBRSxHQUFRO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsUUFBUSxDQUFBO0FBQzVDLENBQUM7QUFGRCwwQ0FFQztBQUVELFNBQWdCLFdBQVcsQ0FBRSxHQUFRO0lBQ25DLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsSUFBSSxDQUFBO0FBQ3hDLENBQUM7QUFGRCxrQ0FFQztBQUVELFNBQWdCLGFBQWEsQ0FBRSxHQUFRO0lBQ3JDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsTUFBTSxDQUFBO0FBQzFDLENBQUM7QUFGRCxzQ0FFQztBQUVELFNBQWdCLFVBQVUsQ0FBRSxHQUFRO0lBQ2xDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsR0FBRyxDQUFBO0FBQ3ZDLENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGFBQWEsQ0FBRSxHQUFRO0lBQ3JDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsTUFBTSxDQUFBO0FBQzFDLENBQUM7QUFGRCxzQ0FFQztBQUVELFNBQWdCLGNBQWMsQ0FBRSxHQUFRO0lBQ3RDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsT0FBTyxDQUFBO0FBQzNDLENBQUM7QUFGRCx3Q0FFQztBQUVELFNBQWdCLGFBQWEsQ0FBRSxHQUFRO0lBQ3JDLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLHNCQUFTLENBQUMsTUFBTSxDQUFBO0FBQzFDLENBQUM7QUFGRCxzQ0FFQztBQUVELFNBQWdCLHFCQUFxQixDQUFFLEdBQVE7SUFDN0MsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssc0JBQVMsQ0FBQyxjQUFjLENBQUE7QUFDbEQsQ0FBQztBQUZELHNEQUVDO0FBRUQsU0FBZ0IsV0FBVyxDQUFFLEdBQVE7SUFDbkMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssc0JBQVMsQ0FBQyxJQUFJLENBQUE7QUFDeEMsQ0FBQztBQUZELGtDQUVDO0FBRUQsU0FBZ0IsWUFBWSxDQUFFLEdBQVE7SUFDcEMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssc0JBQVMsQ0FBQyxLQUFLLENBQUE7QUFDekMsQ0FBQztBQUZELG9DQUVDO0FBRUQsU0FBUyxPQUFPLENBQUUsR0FBUTtJQUN4QixPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDNUIsQ0FBQyJ9