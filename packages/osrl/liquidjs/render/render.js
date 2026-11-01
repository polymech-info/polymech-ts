"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Render = void 0;
const error_1 = require("../util/error");
const simple_emitter_1 = require("../emitters/simple-emitter");
const streamed_emitter_1 = require("../emitters/streamed-emitter");
const async_1 = require("../util/async");
const keeping_type_emitter_1 = require("../emitters/keeping-type-emitter");
class Render {
    renderTemplatesToNodeStream(templates, ctx) {
        const emitter = new streamed_emitter_1.StreamedEmitter();
        Promise.resolve().then(() => (0, async_1.toPromise)(this.renderTemplates(templates, ctx, emitter)))
            .then(() => emitter.end(), err => emitter.error(err));
        return emitter.stream;
    }
    *renderTemplates(templates, ctx, emitter) {
        if (!emitter) {
            emitter = ctx.opts.keepOutputType ? new keeping_type_emitter_1.KeepingTypeEmitter() : new simple_emitter_1.SimpleEmitter();
        }
        for (const tpl of templates) {
            try {
                // if tpl.render supports emitter, it'll return empty `html`
                const html = yield tpl.render(ctx, emitter);
                // if not, it'll return an `html`, write to the emitter for it
                html && emitter.write(html);
                if (emitter['break'] || emitter['continue'])
                    break;
            }
            catch (e) {
                const err = error_1.RenderError.is(e) ? e : new error_1.RenderError(e, tpl);
                throw err;
            }
        }
        return emitter.buffer;
    }
}
exports.Render = Render;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3JlbmRlci9yZW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUNBQTJDO0FBSTNDLCtEQUEwRDtBQUMxRCxtRUFBOEQ7QUFDOUQseUNBQXlDO0FBQ3pDLDJFQUFxRTtBQUVyRSxNQUFhLE1BQU07SUFDViwyQkFBMkIsQ0FBRSxTQUFxQixFQUFFLEdBQVk7UUFDckUsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQ0FBZSxFQUFFLENBQUE7UUFDckMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLGlCQUFTLEVBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDbkYsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUN2RCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDdkIsQ0FBQztJQUNNLENBQUUsZUFBZSxDQUFFLFNBQXFCLEVBQUUsR0FBWSxFQUFFLE9BQWlCO1FBQzlFLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUkseUNBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSw4QkFBYSxFQUFFLENBQUE7U0FDbkY7UUFDRCxLQUFLLE1BQU0sR0FBRyxJQUFJLFNBQVMsRUFBRTtZQUMzQixJQUFJO2dCQUNGLDREQUE0RDtnQkFDNUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtnQkFDM0MsOERBQThEO2dCQUM5RCxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDM0IsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQztvQkFBRSxNQUFLO2FBQ25EO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsTUFBTSxHQUFHLEdBQUcsbUJBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQkFBVyxDQUFDLENBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQTtnQkFDcEUsTUFBTSxHQUFHLENBQUE7YUFDVjtTQUNGO1FBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQ3ZCLENBQUM7Q0FDRjtBQXpCRCx3QkF5QkMifQ==