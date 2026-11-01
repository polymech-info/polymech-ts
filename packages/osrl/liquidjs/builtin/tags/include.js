"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const block_mode_1 = require("../../context/block-mode");
const render_1 = require("./render");
exports.default = {
    parseFilePath: render_1.parseFilePath,
    renderFilePath: render_1.renderFilePath,
    parse: function (token) {
        const args = token.args;
        const tokenizer = new types_1.Tokenizer(args, this.liquid.options.operatorsTrie);
        this['file'] = this.parseFilePath(tokenizer, this.liquid);
        this['currentFile'] = token.file;
        const begin = tokenizer.p;
        const withStr = tokenizer.readIdentifier();
        if (withStr.content === 'with') {
            tokenizer.skipBlank();
            if (tokenizer.peek() !== ':') {
                this.withVar = tokenizer.readValue();
            }
            else
                tokenizer.p = begin;
        }
        else
            tokenizer.p = begin;
        this.hash = new types_1.Hash(tokenizer.remaining(), this.liquid.options.jekyllInclude);
    },
    render: function* (ctx, emitter) {
        const { liquid, hash, withVar } = this;
        const { renderer } = liquid;
        const filepath = yield this.renderFilePath(this['file'], ctx, liquid);
        (0, types_1.assert)(filepath, () => `illegal filename "${filepath}"`);
        const saved = ctx.saveRegister('blocks', 'blockMode');
        ctx.setRegister('blocks', {});
        ctx.setRegister('blockMode', block_mode_1.default.OUTPUT);
        const scope = yield hash.render(ctx);
        if (withVar)
            scope[filepath] = (0, types_1.evalToken)(withVar, ctx);
        const templates = yield liquid._parsePartialFile(filepath, ctx.sync, this['currentFile']);
        ctx.push(ctx.opts.jekyllInclude ? { include: scope } : scope);
        yield renderer.renderTemplates(templates, ctx, emitter);
        ctx.pop();
        ctx.restoreRegister(saved);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5jbHVkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL3RhZ3MvaW5jbHVkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUE0RztBQUM1Ryx5REFBZ0Q7QUFDaEQscUNBQXdEO0FBRXhELGtCQUFlO0lBQ2IsYUFBYSxFQUFiLHNCQUFhO0lBQ2IsY0FBYyxFQUFkLHVCQUFjO0lBQ2QsS0FBSyxFQUFFLFVBQVUsS0FBZTtRQUM5QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLElBQUksaUJBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN6RCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQTtRQUVoQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUMxQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssTUFBTSxFQUFFO1lBQzlCLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtZQUNyQixJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFBO2FBQ3JDOztnQkFBTSxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTtTQUMzQjs7WUFBTSxTQUFTLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQTtRQUUxQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksWUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUNoRixDQUFDO0lBQ0QsTUFBTSxFQUFFLFFBQVMsQ0FBQyxFQUFFLEdBQVksRUFBRSxPQUFnQjtRQUNoRCxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFDdEMsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQTtRQUMzQixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNyRSxJQUFBLGNBQU0sRUFBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMscUJBQXFCLFFBQVEsR0FBRyxDQUFDLENBQUE7UUFFeEQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUE7UUFDckQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDN0IsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsb0JBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM5QyxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDcEMsSUFBSSxPQUFPO1lBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUEsaUJBQVMsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDdEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUE7UUFDekYsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzdELE1BQU0sUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3ZELEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNULEdBQUcsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDNUIsQ0FBQztDQUNnQixDQUFBIn0=