"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFilePath = exports.parseFilePath = void 0;
const tslib_1 = require("tslib");
const assert_1 = require("../../util/assert");
const forloop_drop_1 = require("../../drop/forloop-drop");
const collection_1 = require("../../util/collection");
const types_1 = require("../../types");
exports.default = {
    parseFilePath,
    renderFilePath,
    parse: function (token) {
        const args = token.args;
        const tokenizer = new types_1.Tokenizer(args, this.liquid.options.operatorsTrie);
        this['file'] = this.parseFilePath(tokenizer, this.liquid);
        this['currentFile'] = token.file;
        while (!tokenizer.end()) {
            tokenizer.skipBlank();
            const begin = tokenizer.p;
            const keyword = tokenizer.readIdentifier();
            if (keyword.content === 'with' || keyword.content === 'for') {
                tokenizer.skipBlank();
                // can be normal key/value pair, like "with: true"
                if (tokenizer.peek() !== ':') {
                    const value = tokenizer.readValue();
                    // can be normal key, like "with,"
                    if (value) {
                        const beforeAs = tokenizer.p;
                        const asStr = tokenizer.readIdentifier();
                        let alias;
                        if (asStr.content === 'as')
                            alias = tokenizer.readIdentifier();
                        else
                            tokenizer.p = beforeAs;
                        this[keyword.content] = { value, alias: alias && alias.content };
                        tokenizer.skipBlank();
                        if (tokenizer.peek() === ',')
                            tokenizer.advance();
                        // matched!
                        continue;
                    }
                }
            }
            /**
             * restore cursor if with/for not matched
             */
            tokenizer.p = begin;
            break;
        }
        this.hash = new types_1.Hash(tokenizer.remaining());
    },
    render: function* (ctx, emitter) {
        const { liquid, hash } = this;
        const filepath = yield this.renderFilePath(this['file'], ctx, liquid);
        (0, assert_1.assert)(filepath, () => `illegal filename "${filepath}"`);
        const childCtx = new types_1.Context({}, ctx.opts, { sync: ctx.sync, globals: ctx.globals, strictVariables: ctx.strictVariables });
        const scope = childCtx.bottom();
        (0, tslib_1.__assign)(scope, yield hash.render(ctx));
        if (this['with']) {
            const { value, alias } = this['with'];
            scope[alias || filepath] = (0, types_1.evalToken)(value, ctx);
        }
        if (this['for']) {
            const { value, alias } = this['for'];
            let collection = (0, types_1.evalToken)(value, ctx);
            collection = (0, collection_1.toEnumerable)(collection);
            scope['forloop'] = new forloop_drop_1.ForloopDrop(collection.length, value.getText(), alias);
            for (const item of collection) {
                scope[alias] = item;
                const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this['currentFile']);
                yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
                scope['forloop'].next();
            }
        }
        else {
            const templates = yield liquid._parsePartialFile(filepath, childCtx.sync, this['currentFile']);
            yield liquid.renderer.renderTemplates(templates, childCtx, emitter);
        }
    }
};
/**
 * @return null for "none",
 * @return Template[] for quoted with tags and/or filters
 * @return Token for expression (not quoted)
 * @throws TypeError if cannot read next token
 */
function parseFilePath(tokenizer, liquid) {
    if (liquid.options.dynamicPartials) {
        const file = tokenizer.readValue();
        if (file === undefined)
            throw new TypeError(`illegal argument "${tokenizer.input}"`);
        if (file.getText() === 'none')
            return null;
        if (types_1.TypeGuards.isQuotedToken(file)) {
            // for filenames like "files/{{file}}", eval as liquid template
            const templates = liquid.parse((0, types_1.evalQuotedToken)(file));
            return optimize(templates);
        }
        return file;
    }
    const tokens = [...tokenizer.readFileNameTemplate(liquid.options)];
    const templates = optimize(liquid.parser.parseTokens(tokens));
    return templates === 'none' ? null : templates;
}
exports.parseFilePath = parseFilePath;
function optimize(templates) {
    // for filenames like "files/file.liquid", extract the string directly
    if (templates.length === 1 && types_1.TypeGuards.isHTMLToken(templates[0].token))
        return templates[0].token.getContent();
    return templates;
}
function renderFilePath(file, ctx, liquid) {
    if (typeof file === 'string')
        return file;
    if (Array.isArray(file))
        return liquid.renderer.renderTemplates(file, ctx);
    return (0, types_1.evalToken)(file, ctx);
}
exports.renderFilePath = renderFilePath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9yZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWdDO0FBQ2hDLDhDQUEwQztBQUMxQywwREFBcUQ7QUFDckQsc0RBQW9EO0FBRXBELHVDQUFrSjtBQUVsSixrQkFBZTtJQUNiLGFBQWE7SUFDYixjQUFjO0lBQ2QsS0FBSyxFQUFFLFVBQVUsS0FBZTtRQUM5QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQTtRQUNoQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3ZCLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNyQixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFBO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUMxQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssTUFBTSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFO2dCQUMzRCxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3JCLGtEQUFrRDtnQkFDbEQsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO29CQUM1QixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ25D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