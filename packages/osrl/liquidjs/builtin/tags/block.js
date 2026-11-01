"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const block_mode_1 = require("../../context/block-mode");
const block_drop_1 = require("../../drop/block-drop");
exports.default = {
    parse(token, remainTokens) {
        const match = /\w+/.exec(token.args);
        this.block = match ? match[0] : ' ';
        this.tpls = [];
        this.liquid.parser.parseStream(remainTokens)
            .on('tag:endblock', function () { this.stop(); })
            .on('template', (tpl) => this.tpls.push(tpl))
            .on('end', () => { throw new Error(`tag ${token.getText()} not closed`); })
            .start();
    },
    *render(ctx, emitter) {
        const blockRender = this.getBlockRender(ctx);
        if (ctx.getRegister('blockMode') === block_mode_1.default.STORE) {
            ctx.getRegister('blocks')[this.block] = blockRender;
        }
        else {
            yield blockRender(new block_drop_1.BlockDrop(), emitter);
        }
    },
    getBlockRender(ctx) {
        const { liquid, tpls } = this;
        const renderChild = ctx.getRegister('blocks')[this.block];
        const renderCurrent = function* (superBlock, emitter) {
            // add {{ block.super }} support when rendering
            ctx.push({ block: superBlock });
            yield liquid.renderer.renderTemplates(tpls, ctx, emitter);
            ctx.pop();
        };
        return renderChild
            ? (superBlock, emitter) => renderChild(new block_drop_1.BlockDrop(() => renderCurrent(superBlock, emitter)), emitter)
            : renderCurrent;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL2Jsb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQWdEO0FBQ2hELHNEQUFpRDtBQUdqRCxrQkFBZTtJQUNiLEtBQUssQ0FBaUIsS0FBZSxFQUFFLFlBQTZCO1FBQ2xFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQTtRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQWdCLENBQUE7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQzthQUN6QyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBLENBQUMsQ0FBQyxDQUFDO2FBQy9DLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFhLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3RELEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUM7YUFDekUsS0FBSyxFQUFFLENBQUE7SUFDWixDQUFDO0lBRUQsQ0FBRSxNQUFNLENBQWlCLEdBQVksRUFBRSxPQUFnQjtRQUNyRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzVDLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsS0FBSyxvQkFBUyxDQUFDLEtBQUssRUFBRTtZQUNwRCxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxXQUFXLENBQUE7U0FDcEQ7YUFBTTtZQUNMLE1BQU0sV0FBVyxDQUFDLElBQUksc0JBQVMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1NBQzVDO0lBQ0gsQ0FBQztJQUVELGNBQWMsQ0FBaUIsR0FBWTtRQUN6QyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtRQUM3QixNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN6RCxNQUFNLGFBQWEsR0FBRyxRQUFTLENBQUMsRUFBRSxVQUFxQixFQUFFLE9BQWdCO1lBQ3ZFLCtDQUErQztZQUMvQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7WUFDL0IsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3pELEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNYLENBQUMsQ0FBQTtRQUNELE9BQU8sV0FBVztZQUNoQixDQUFDLENBQUMsQ0FBQyxVQUFxQixFQUFFLE9BQWdCLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLHNCQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztZQUM1SCxDQUFDLENBQUMsYUFBYSxDQUFBO0lBQ25CLENBQUM7Q0FDRixDQUFBIn0=