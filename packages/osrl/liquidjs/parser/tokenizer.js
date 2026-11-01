"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tokenizer = void 0;
const whitespace_ctrl_1 = require("./whitespace-ctrl");
const number_token_1 = require("../tokens/number-token");
const identifier_token_1 = require("../tokens/identifier-token");
const literal_1 = require("../util/literal");
const literal_token_1 = require("../tokens/literal-token");
const operator_token_1 = require("../tokens/operator-token");
const property_access_token_1 = require("../tokens/property-access-token");
const assert_1 = require("../util/assert");
const filter_token_1 = require("../tokens/filter-token");
const hash_token_1 = require("../tokens/hash-token");
const quoted_token_1 = require("../tokens/quoted-token");
const underscore_1 = require("../util/underscore");
const html_token_1 = require("../tokens/html-token");
const tag_token_1 = require("../tokens/tag-token");
const range_token_1 = require("../tokens/range-token");
const output_token_1 = require("../tokens/output-token");
const error_1 = require("../util/error");
const liquid_options_1 = require("../liquid-options");
const character_1 = require("../util/character");
const match_operator_1 = require("./match-operator");
const expression_1 = require("../render/expression");
const liquid_tag_token_1 = require("../tokens/liquid-tag-token");
class Tokenizer {
    constructor(input, trie, file = '') {
        this.input = input;
        this.trie = trie;
        this.file = file;
        this.p = 0;
        this.rawBeginAt = -1;
        this.N = input.length;
    }
    readExpression() {
        return new expression_1.Expression(this.readExpressionTokens());
    }
    *readExpressionTokens() {
        const operand = this.readValue();
        if (!operand)
            return;
        yield operand;
        while (this.p < this.N) {
            const operator = this.readOperator();
            if (!operator)
                return;
            const operand = this.readValue();
            if (!operand)
                return;
            yield operator;
            yield operand;
        }
    }
    readOperator() {
        this.skipBlank();
        const end = (0, match_operator_1.matchOperator)(this.input, this.p, this.trie);
        if (end === -1)
            return;
        return new operator_token_1.OperatorToken(this.input, this.p, (this.p = end), this.file);
    }
    readFilters() {
        const filters = [];
        while (true) {
            const filter = this.readFilter();
            if (!filter)
                return filters;
            filters.push(filter);
        }
    }
    readFilter() {
        this.skipBlank();
        if (this.end())
            return null;
        (0, assert_1.assert)(this.peek() === '|', () => `unexpected token at ${this.snapshot()}`);
        this.p++;
        const begin = this.p;
        const name = this.readIdentifier();
        if (!name.size())
            return null;
        const args = [];
        this.skipBlank();
        if (this.peek() === ':') {
            do {
                ++this.p;
                const arg = this.readFilterArg();
                arg && args.push(arg);
                this.skipBlank();
                (0, assert_1.assert)(this.end() || this.peek() === ',' || this.peek() === '|', () => `unexpected character ${this.snapshot()}`);
            } while (this.peek() === ',');
        }
        return new filter_token_1.FilterToken(name.getText(), args, this.input, begin, this.p, this.file);
    }
    readFilterArg() {
        const key = this.readValue();
        if (!key)
            return;
        this.skipBlank();
        if (this.peek() !== ':')
            return key;
        ++this.p;
        const value = this.readValue();
        return [key.getText(), value];
    }
    readTopLevelTokens(options = liquid_options_1.defaultOptions) {
        const tokens = [];
        while (this.p < this.N) {
            const token = this.readTopLevelToken(options);
            tokens.push(token);
        }
        (0, whitespace_ctrl_1.whiteSpaceCtrl)(tokens, options);
        return tokens;
    }
    readTopLevelToken(options) {
        const { tagDelimiterLeft, outputDelimiterLeft } = options;
        if (this.rawBeginAt > -1)
            return this.readEndrawOrRawContent(options);
        if (this.match(tagDelimiterLeft))
            return this.readTagToken(options);
        if (this.match(outputDelimiterLeft))
            return this.readOutputToken(options);
        return this.readHTMLToken([tagDelimiterLeft, outputDelimiterLeft]);
    }
    readHTMLToken(stopStrings) {
        const begin = this.p;
        while (this.p < this.N) {
            if (stopStrings.some(str => this.match(str)))
                break;
            ++this.p;
        }
        return new html_token_1.HTMLToken(this.input, begin, this.p, this.file);
    }
    readTagToken(options = liquid_options_1.defaultOptions) {
        const { file, input } = this;
        const begin = this.p;
        if (this.readToDelimiter(options.tagDelimiterRight) === -1) {
            throw this.mkError(`tag ${this.snapshot(begin)} not closed`, begin);
        }
        const token = new tag_token_1.TagToken(input, begin, this.p, options, file);
        if (token.name === 'raw')
            this.rawBeginAt = begin;
        return token;
    }
    readToDelimiter(delimiter) {
        while (this.p < this.N) {
            if ((this.peekType() & character_1.QUOTE)) {
                this.readQuoted();
                continue;
            }
            ++this.p;
            if (this.rmatch(delimiter))
                return this.p;
        }
        return -1;
    }
    readOutputToken(options = liquid_options_1.defaultOptions) {
        const { file, input } = this;
        const { outputDelimiterRight } = options;
        const begin = this.p;
        if (this.readToDelimiter(outputDelimiterRight) === -1) {
            throw this.mkError(`output ${this.snapshot(begin)} not closed`, begin);
        }
        return new output_token_1.OutputToken(input, begin, this.p, options, file);
    }
    readEndrawOrRawContent(options) {
        const { tagDelimiterLeft, tagDelimiterRight } = options;
        const begin = this.p;
        let leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
        while (this.p < this.N) {
            if (this.readIdentifier().getText() !== 'endraw') {
                leftPos = this.readTo(tagDelimiterLeft) - tagDelimiterLeft.length;
                continue;
            }
            while (this.p <= this.N) {
                if (this.rmatch(tagDelimiterRight)) {
                    const end = this.p;
                    if (begin === leftPos) {
                        this.rawBeginAt = -1;
                        return new tag_token_1.TagToken(this.input, begin, end, options, this.file);
                    }
                    else {
                        this.p = leftPos;
                        return new html_token_1.HTMLToken(this.input, begin, leftPos, this.file);
                    }
                }
                if (this.rmatch(tagDelimiterLeft))
                    break;
                this.p++;
            }
        }
        throw this.mkError(`raw ${this.snapshot(this.rawBeginAt)} not closed`, begin);
    }
    readLiquidTagTokens(options = liquid_options_1.defaultOptions) {
        const tokens = [];
        while (this.p < this.N) {
            const token = this.readLiquidTagToken(options);
            if (token.name)
                tokens.push(token);
        }
        return tokens;
    }
    readLiquidTagToken(options) {
        const { file, input } = this;
        const begin = this.p;
        let end = this.N;
        if (this.readToDelimiter('\n') !== -1)
            end = this.p;
        return new liquid_tag_token_1.LiquidTagToken(input, begin, end, options, file);
    }
    mkError(msg, begin) {
        return new error_1.TokenizationError(msg, new identifier_token_1.IdentifierToken(this.input, begin, this.N, this.file));
    }
    snapshot(begin = this.p) {
        return JSON.stringify((0, underscore_1.ellipsis)(this.input.slice(begin), 16));
    }
    /**
     * @deprecated
     */
    readWord() {
        console.warn('Tokenizer#readWord() will be removed, use #readIdentifier instead');
        return this.readIdentifier();
    }
    readIdentifier() {
        this.skipBlank();
        const begin = this.p;
        while (this.peekType() & character_1.IDENTIFIER)
            ++this.p;
        return new identifier_token_1.IdentifierToken(this.input, begin, this.p, this.file);
    }
    readTagName() {
        this.skipBlank();
        // Handle inline comment tags
        if (this.input[this.p] === '#')
            return this.input.slice(this.p, ++this.p);
        return this.readIdentifier().getText();
    }
    readHashes(jekyllStyle) {
        const hashes = [];
        while (true) {
            const hash = this.readHash(jekyllStyle);
            if (!hash)
                return hashes;
            hashes.push(hash);
        }
    }
    readHash(jekyllStyle) {
        this.skipBlank();
        if (this.peek() === ',')
            ++this.p;
        const begin = this.p;
        const name = this.readIdentifier();
        if (!name.size())
            return;
        let value;
        this.skipBlank();
        const sep = jekyllStyle ? '=' : ':';
        if (this.peek() === sep) {
            ++this.p;
            value = this.readValue();
        }
        return new hash_token_1.HashToken(this.input, begin, this.p, name, value, this.file);
    }
    remaining() {
        return this.input.slice(this.p);
    }
    advance(i = 1) {
        this.p += i;
    }
    end() {
        return this.p >= this.N;
    }
    readTo(end) {
        while (this.p < this.N) {
            ++this.p;
            if (this.rmatch(end))
                return this.p;
        }
        return -1;
    }
    readValue() {
        const value = this.readQuoted() || this.readRange();
        if (value)
            return value;
        if (this.peek() === '[') {
            this.p++;
            const prop = this.readQuoted();
            if (!prop)
                return;
            if (this.peek() !== ']')
                return;
            this.p++;
            return new property_access_token_1.PropertyAccessToken(prop, [], this.p);
        }
        const variable = this.readIdentifier();
        if (!variable.size())
            return;
        let isNumber = variable.isNumber(true);
        const props = [];
        while (true) {
            if (this.peek() === '[') {
                isNumber = false;
                this.p++;
                const prop = this.readValue() || new identifier_token_1.IdentifierToken(this.input, this.p, this.p, this.file);
                this.readTo(']');
                props.push(prop);
            }
            else if (this.peek() === '.' && this.peek(1) !== '.') { // skip range syntax
                this.p++;
                const prop = this.readIdentifier();
                if (!prop.size())
                    break;
                if (!prop.isNumber())
                    isNumber = false;
                props.push(prop);
            }
            else
                break;
        }
        if (!props.length && literal_1.literalValues.hasOwnProperty(variable.content)) {
            return new literal_token_1.LiteralToken(this.input, variable.begin, variable.end, this.file);
        }
        if (isNumber)
            return new number_token_1.NumberToken(variable, props[0]);
        return new property_access_token_1.PropertyAccessToken(variable, props, this.p);
    }
    readRange() {
        this.skipBlank();
        const begin = this.p;
        if (this.peek() !== '(')
            return;
        ++this.p;
        const lhs = this.readValueOrThrow();
        this.p += 2;
        const rhs = this.readValueOrThrow();
        ++this.p;
        return new range_token_1.RangeToken(this.input, begin, this.p, lhs, rhs, this.file);
    }
    readValueOrThrow() {
        const value = this.readValue();
        (0, assert_1.assert)(value, () => `unexpected token ${this.snapshot()}, value expected`);
        return value;
    }
    readQuoted() {
        this.skipBlank();
        const begin = this.p;
        if (!(this.peekType() & character_1.QUOTE))
            return;
        ++this.p;
        let escaped = false;
        while (this.p < this.N) {
            ++this.p;
            if (this.input[this.p - 1] === this.input[begin] && !escaped)
                break;
            if (escaped)
                escaped = false;
            else if (this.input[this.p - 1] === '\\')
                escaped = true;
        }
        return new quoted_token_1.QuotedToken(this.input, begin, this.p, this.file);
    }
    *readFileNameTemplate(options) {
        const { outputDelimiterLeft } = options;
        const htmlStopStrings = [',', ' ', outputDelimiterLeft];
        const htmlStopStringSet = new Set(htmlStopStrings);
        // break on ',' and ' ', outputDelimiterLeft only stops HTML token
        while (this.p < this.N && !htmlStopStringSet.has(this.peek())) {
            yield this.match(outputDelimiterLeft)
                ? this.readOutputToken(options)
                : this.readHTMLToken(htmlStopStrings);
        }
    }
    match(word) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] !== this.input[this.p + i])
                return false;
        }
        return true;
    }
    rmatch(pattern) {
        for (let i = 0; i < pattern.length; i++) {
            if (pattern[pattern.length - 1 - i] !== this.input[this.p - 1 - i])
                return false;
        }
        return true;
    }
    peekType(n = 0) {
        return character_1.TYPES[this.input.charCodeAt(this.p + n)];
    }
    peek(n = 0) {
        return this.input[this.p + n];
    }
    skipBlank() {
        while (this.peekType() & character_1.BLANK)
            ++this.p;
    }
}
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3BhcnNlci90b2tlbml6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdURBQWtEO0FBQ2xELHlEQUFvRDtBQUNwRCxpRUFBNEQ7QUFDNUQsNkNBQStDO0FBQy9DLDJEQUFzRDtBQUN0RCw2REFBd0Q7QUFDeEQsMkVBQXFFO0FBQ3JFLDJDQUF1QztBQUd2Qyx5REFBb0Q7QUFDcEQscURBQWdEO0FBQ2hELHlEQUFvRDtBQUNwRCxtREFBNkM7QUFDN0MscURBQWdEO0FBQ2hELG1EQUE4QztBQUU5Qyx1REFBa0Q7QUFFbEQseURBQW9EO0FBQ3BELHlDQUFpRDtBQUNqRCxzREFBeUU7QUFDekUsaURBQW1FO0FBQ25FLHFEQUFnRDtBQUVoRCxxREFBaUQ7QUFDakQsaUVBQTJEO0FBRTNELE1BQWEsU0FBUztJQUtwQixZQUNTLEtBQWEsRUFDWixJQUFVLEVBQ1gsT0FBZSxFQUFFO1FBRmpCLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDWixTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ1gsU0FBSSxHQUFKLElBQUksQ0FBYTtRQVAxQixNQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRUcsZUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBT3JCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQTtJQUN2QixDQUFDO0lBRUQsY0FBYztRQUNaLE9BQU8sSUFBSSx1QkFBVSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUE7SUFDcEQsQ0FBQztJQUVELENBQUUsb0JBQW9CO1FBQ3BCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNoQyxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU07UUFFcEIsTUFBTSxPQUFPLENBQUE7UUFFYixPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMs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