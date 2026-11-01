"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalQuotedToken = exports.evalToken = exports.Expression = void 0;
const assert_1 = require("../util/assert");
const literal_1 = require("../util/literal");
const TypeGuards = require("../util/type-guards");
const parse_string_literal_1 = require("../parser/parse-string-literal");
const underscore_1 = require("../util/underscore");
const error_1 = require("../util/error");
class Expression {
    constructor(tokens) {
        this.postfix = [...toPostfix(tokens)];
    }
    *evaluate(ctx, lenient) {
        (0, assert_1.assert)(ctx, 'unable to evaluate: context not defined');
        const operands = [];
        for (const token of this.postfix) {
            if (TypeGuards.isOperatorToken(token)) {
                const r = operands.pop();
                const l = operands.pop();
                const result = yield evalOperatorToken(ctx.opts.operators, token, l, r, ctx);
                operands.push(result);
            }
            else {
                operands.push(yield evalToken(token, ctx, lenient && this.postfix.length === 1));
            }
        }
        return operands[0];
    }
}
exports.Expression = Expression;
function evalToken(token, ctx, lenient = false) {
    if (TypeGuards.isPropertyAccessToken(token))
        return evalPropertyAccessToken(token, ctx, lenient);
    if (TypeGuards.isRangeToken(token))
        return evalRangeToken(token, ctx);
    if (TypeGuards.isLiteralToken(token))
        return evalLiteralToken(token);
    if (TypeGuards.isNumberToken(token))
        return evalNumberToken(token);
    if (TypeGuards.isWordToken(token))
        return token.getText();
    if (TypeGuards.isQuotedToken(token))
        return evalQuotedToken(token);
}
exports.evalToken = evalToken;
function evalPropertyAccessToken(token, ctx, lenient) {
    const props = token.props.map(prop => evalToken(prop, ctx, false));
    try {
        return ctx.get([token.propertyName, ...props]);
    }
    catch (e) {
        if (lenient && e.name === 'InternalUndefinedVariableError')
            return null;
        throw (new error_1.UndefinedVariableError(e, token));
    }
}
function evalNumberToken(token) {
    const str = token.whole.content + '.' + (token.decimal ? token.decimal.content : '');
    return Number(str);
}
function evalQuotedToken(token) {
    return (0, parse_string_literal_1.parseStringLiteral)(token.getText());
}
exports.evalQuotedToken = evalQuotedToken;
function evalOperatorToken(operators, token, lhs, rhs, ctx) {
    const impl = operators[token.operator];
    return impl(lhs, rhs, ctx);
}
function evalLiteralToken(token) {
    return literal_1.literalValues[token.literal];
}
function evalRangeToken(token, ctx) {
    const low = evalToken(token.lhs, ctx);
    const high = evalToken(token.rhs, ctx);
    return (0, underscore_1.range)(+low, +high + 1);
}
function* toPostfix(tokens) {
    const ops = [];
    for (const token of tokens) {
        if (TypeGuards.isOperatorToken(token)) {
            while (ops.length && ops[ops.length - 1].getPrecedence() > token.getPrecedence()) {
                yield ops.pop();
            }
            ops.push(token);
        }
        else
            yield token;
    }
    while (ops.length) {
        yield ops.pop();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzc2lvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9yZW5kZXIvZXhwcmVzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwyQ0FBdUM7QUFDdkMsNkNBQStDO0FBRS9DLGtEQUFpRDtBQUlqRCx5RUFBbUU7QUFFbkUsbURBQTBDO0FBRTFDLHlDQUFzRDtBQUV0RCxNQUFhLFVBQVU7SUFHckIsWUFBb0IsTUFBK0I7UUFDakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUNNLENBQUUsUUFBUSxDQUFFLEdBQVksRUFBRSxPQUFnQjtRQUMvQyxJQUFBLGVBQU0sRUFBQyxHQUFHLEVBQUUseUNBQXlDLENBQUMsQ0FBQTtRQUN0RCxNQUFNLFFBQVEsR0FBVSxFQUFFLENBQUE7UUFDMUIsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hDLElBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDckMsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFBO2dCQUN4QixNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQ3hCLE1BQU0sTUFBTSxHQUFHLE1BQU0saUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7YUFDdEI7aUJBQU07Z0JBQ0wsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMs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