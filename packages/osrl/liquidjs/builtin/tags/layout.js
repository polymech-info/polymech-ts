"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const block_mode_1 = require("../../context/block-mode");
const render_1 = require("./render");
exports.default = {
    parseFilePath: render_1.parseFilePath,
    renderFilePath: render_1.renderFilePath,
    parse: function (token, remainTokens) {
        const tokenizer = new types_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
        this['file'] = this.parseFilePath(tokenizer, this.liquid);
        this['currentFile'] = token.file;
        this.hash = new types_1.Hash(tokenizer.remaining());
        this.tpls = this.liquid.parser.parseTokens(remainTokens);
    },
    render: function* (ctx, emitter) {
        const { liquid, hash, file } = this;
        const { renderer } = liquid;
        if (file === null) {
            ctx.setRegister('blockMode', block_mode_1.default.OUTPUT);
            yield renderer.renderTemplates(this.tpls, ctx, emitter);
            return;
        }
        const filepath = yield this.renderFilePath(this['file'], ctx, liquid);
        (0, types_1.assert)(filepath, () => `illegal filename "${filepath}"`);
        const templates = yield liquid._parseLayoutFile(filepath, ctx.sync, this['currentFile']);
        // render remaining contents and store rendered results
        ctx.setRegister('blockMode', block_mode_1.default.STORE);
        const html = yield renderer.renderTemplates(this.tpls, ctx);
        const blocks = ctx.getRegister('blocks');
        // set whole content to anonymous block if anonymous doesn't specified
        if (blocks[''] === undefined)
            blocks[''] = (parent, emitter) => emitter.write(html);
        ctx.setRegister('blockMode', block_mode_1.default.OUTPUT);
        // render the layout file use stored blocks
        ctx.push(yield hash.render(ctx));
        yield renderer.renderTemplates(templates, ctx, emitter);
        ctx.pop();
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9sYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBZ0g7QUFDaEgseURBQWdEO0FBQ2hELHFDQUF3RDtBQUd4RCxrQkFBZTtJQUNiLGFBQWEsRUFBYixzQkFBYTtJQUNiLGNBQWMsRUFBZCx1QkFBYztJQUNkLEtBQUssRUFBRSxVQUFVLEtBQWUsRUFBRSxZQUE2QjtRQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLGlCQUFTLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUM5RSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3pELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1FBQ2hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxZQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUE7SUFDMUQsQ0FBQztJQUNELE1BQU0sRUFBRSxRQUFTLENBQUMsRUFBRSxHQUFZLEVBQUUsT0FBZ0I7UUFDaEQsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBQ25DLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxNQUFNLENBQUE7UUFDM0IsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1lBQ2pCLEdBQUcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLG9CQUFTLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDOUMsTUFBTSxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3ZELE9BQU07U0FDUDtRQUNELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3JFLElBQUEsY0FBTSxFQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsUUFBUSxHQUFHLENBQUMsQ0FBQTtRQUN4RCxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQTtRQUV4Rix1REFBdUQ7UUFDdkQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsb0JBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM3QyxNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUMzRCxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRXhDLHNFQUFzRTtRQUN0RSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxTQUFTO1lBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBaUIsRUFBRSxPQUFnQixFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3ZHLEdBQUcsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLG9CQUFTLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFOUMsMkNBQTJDO1FBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDaEMsTUFBTSxRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDdkQsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ1gsQ0FBQztDQUNnQixDQUFBIn0=