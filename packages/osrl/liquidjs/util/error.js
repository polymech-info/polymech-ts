"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertionError = exports.InternalUndefinedVariableError = exports.UndefinedVariableError = exports.RenderError = exports.ParseError = exports.TokenizationError = exports.LiquidError = void 0;
const _ = require("./underscore");
class LiquidError extends Error {
    constructor(err, token) {
        super(err.message);
        this.originalError = err;
        this.token = token;
        this.context = '';
    }
    update() {
        const err = this.originalError;
        this.context = mkContext(this.token);
        this.message = mkMessage(err.message, this.token);
        this.stack = this.message + '\n' + this.context +
            '\n' + this.stack + '\nFrom ' + err.stack;
    }
}
exports.LiquidError = LiquidError;
class TokenizationError extends LiquidError {
    constructor(message, token) {
        super(new Error(message), token);
        this.name = 'TokenizationError';
        super.update();
    }
}
exports.TokenizationError = TokenizationError;
class ParseError extends LiquidError {
    constructor(err, token) {
        super(err, token);
        this.name = 'ParseError';
        this.message = err.message;
        super.update();
    }
}
exports.ParseError = ParseError;
class RenderError extends LiquidError {
    constructor(err, tpl) {
        super(err, tpl.token);
        this.name = 'RenderError';
        this.message = err.message;
        super.update();
    }
    static is(obj) {
        return obj.name === 'RenderError';
    }
}
exports.RenderError = RenderError;
class UndefinedVariableError extends LiquidError {
    constructor(err, token) {
        super(err, token);
        this.name = 'UndefinedVariableError';
        this.message = err.message;
        super.update();
    }
}
exports.UndefinedVariableError = UndefinedVariableError;
// only used internally; raised where we don't have token information,
// so it can't be an UndefinedVariableError.
class InternalUndefinedVariableError extends Error {
    constructor(variableName) {
        super(`undefined variable: ${variableName}`);
        this.name = 'InternalUndefinedVariableError';
        this.variableName = variableName;
    }
}
exports.InternalUndefinedVariableError = InternalUndefinedVariableError;
class AssertionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AssertionError';
        this.message = message + '';
    }
}
exports.AssertionError = AssertionError;
function mkContext(token) {
    const [line] = token.getPosition();
    const lines = token.input.split('\n');
    const begin = Math.max(line - 2, 1);
    const end = Math.min(line + 3, lines.length);
    const context = _
        .range(begin, end + 1)
        .map(lineNumber => {
        const indicator = (lineNumber === line) ? '>> ' : '   ';
        const num = _.padStart(String(lineNumber), String(end).length);
        const text = lines[lineNumber - 1];
        return `${indicator}${num}| ${text}`;
    })
        .join('\n');
    return context;
}
function mkMessage(msg, token) {
    if (token.file)
        msg += `, file:${token.file}`;
    const [line, col] = token.getPosition();
    msg += `, line:${line}, col:${col}`;
    return msg;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdXRpbC9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrQ0FBaUM7QUFJakMsTUFBc0IsV0FBWSxTQUFRLEtBQUs7SUFJN0MsWUFBb0IsR0FBVSxFQUFFLEtBQVk7UUFDMUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNsQixJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQTtRQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUNuQixDQUFDO0lBQ1MsTUFBTTtRQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUE7UUFDOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU87WUFDN0MsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7SUFDN0MsQ0FBQztDQUNGO0FBakJELGtDQWlCQztBQUVELE1BQWEsaUJBQWtCLFNBQVEsV0FBVztJQUNoRCxZQUFvQixPQUFlLEVBQUUsS0FBWTtRQUMvQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLElBQUksR0FBRyxtQkFBbUIsQ0FBQTtRQUMvQixLQUFLLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDaEIsQ0FBQztD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LE1BQU0sQ0FBQyxDQUFBO1FBQzlELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDbEMsT0FBTyxHQUFHLFNBQVMsR0FBRyxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUE7SUFDdEMsQ0FBQyxDQUFDO1NBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRWIsT0FBTyxPQUFPLENBQUE7QUFDaEIsQ0FBQztBQUVELFNBQVMsU0FBUyxDQUFFLEdBQVcsRUFBRSxLQUFZO0lBQzNDLElBQUksS0FBSyxDQUFDLElBQUk7UUFBRSxHQUFHLElBQUksVUFBVSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDN0MsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDdkMsR0FBRyxJQUFJLFVBQVUsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFBO0lBQ25DLE9BQU8sR0FBRyxDQUFBO0FBQ1osQ0FBQyJ9