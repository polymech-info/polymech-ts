"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const collection_1 = require("../../util/collection");
const types_1 = require("../../types");
const tablerowloop_drop_1 = require("../../drop/tablerowloop-drop");
const tokenizer_1 = require("../../parser/tokenizer");
exports.default = {
    parse: function (tagToken, remainTokens) {
        const tokenizer = new tokenizer_1.Tokenizer(tagToken.args, this.liquid.options.operatorsTrie);
        const variable = tokenizer.readIdentifier();
        tokenizer.skipBlank();
        const tmp = tokenizer.readIdentifier();
        (0, types_1.assert)(tmp && tmp.content === 'in', () => `illegal tag: ${tagToken.getText()}`);
        this.variable = variable.content;
        this.collection = tokenizer.readValue();
        this.hash = new types_1.Hash(tokenizer.remaining());
        this.templates = [];
        let p;
        const stream = this.liquid.parser.parseStream(remainTokens)
            .on('start', () => (p = this.templates))
            .on('tag:endtablerow', () => stream.stop())
            .on('template', (tpl) => p.push(tpl))
            .on('end', () => {
            throw new Error(`tag ${tagToken.getText()} not closed`);
        });
        stream.start();
    },
    render: function* (ctx, emitter) {
        let collection = (0, collection_1.toEnumerable)(yield (0, types_1.evalToken)(this.collection, ctx));
        const hash = yield this.hash.render(ctx);
        const offset = hash.offset || 0;
        const limit = (hash.limit === undefined) ? collection.length : hash.limit;
        collection = collection.slice(offset, offset + limit);
        const cols = hash.cols || collection.length;
        const r = this.liquid.renderer;
        const tablerowloop = new tablerowloop_drop_1.TablerowloopDrop(collection.length, cols, this.collection.getText(), this.variable);
        const scope = { tablerowloop };
        ctx.push(scope);
        for (let idx = 0; idx < collection.length; idx++, tablerowloop.next()) {
            scope[this.variable] = collection[idx];
            if (tablerowloop.col0() === 0) {
                if (tablerowloop.row() !== 1)
                    emitter.write('</tr>');
                emitter.write(`<tr class="row${tablerowloop.row()}">`);
            }
            emitter.write(`<td class="col${tablerowloop.col()}">`);
            yield r.renderTemplates(this.templates, ctx, emitter);
            emitter.write('</td>');
        }
        if (collection.length)
            emitter.write('</tr>');
        ctx.pop();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVyb3cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL3RhYmxlcm93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0RBQW9EO0FBQ3BELHVDQUF1STtBQUN2SSxvRUFBK0Q7QUFDL0Qsc0RBQWtEO0FBRWxELGtCQUFlO0lBQ2IsS0FBSyxFQUFFLFVBQVUsUUFBa0IsRUFBRSxZQUE2QjtRQUNoRSxNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUVqRixNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDM0MsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBRXJCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUN0QyxJQUFBLGNBQU0sRUFBQyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFL0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQ3ZDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxZQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFFbkIsSUFBSSxDQUFDLENBQUE7UUFDTCxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQzthQUNyRSxFQUFFLENBQUMsT0FBTyxFQUFF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