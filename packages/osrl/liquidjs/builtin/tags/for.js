"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const collection_1 = require("../../util/collection");
const forloop_drop_1 = require("../../drop/forloop-drop");
const hash_1 = require("../../template/tag/hash");
const MODIFIERS = ['offset', 'limit', 'reversed'];
exports.default = {
    type: 'block',
    parse: function (token, remainTokens) {
        const tokenizer = new types_1.Tokenizer(token.args, this.liquid.options.operatorsTrie);
        const variable = tokenizer.readIdentifier();
        const inStr = tokenizer.readIdentifier();
        const collection = tokenizer.readValue();
        (0, types_1.assert)(variable.size() && inStr.content === 'in' && collection, () => `illegal tag: ${token.getText()}`);
        this.variable = variable.content;
        this.collection = collection;
        this.hash = new hash_1.Hash(tokenizer.remaining());
        this.templates = [];
        this.elseTemplates = [];
        let p;
        const stream = this.liquid.parser.parseStream(remainTokens)
            .on('start', () => (p = this.templates))
            .on('tag:else', () => (p = this.elseTemplates))
            .on('tag:endfor', () => stream.stop())
            .on('template', (tpl) => p.push(tpl))
            .on('end', () => {
            throw new Error(`tag ${token.getText()} not closed`);
        });
        stream.start();
    },
    render: function* (ctx, emitter) {
        const r = this.liquid.renderer;
        let collection = (0, collection_1.toEnumerable)(yield (0, types_1.evalToken)(this.collection, ctx));
        if (!collection.length) {
            yield r.renderTemplates(this.elseTemplates, ctx, emitter);
            return;
        }
        const continueKey = 'continue-' + this.variable + '-' + this.collection.getText();
        ctx.push({ continue: ctx.getRegister(continueKey) });
        const hash = yield this.hash.render(ctx);
        ctx.pop();
        const modifiers = this.liquid.options.orderedFilterParameters
            ? Object.keys(hash).filter(x => MODIFIERS.includes(x))
            : MODIFIERS.filter(x => hash[x] !== undefined);
        collection = modifiers.reduce((collection, modifier) => {
            if (modifier === 'offset')
                return offset(collection, hash['offset']);
            if (modifier === 'limit')
                return limit(collection, hash['limit']);
            return reversed(collection);
        }, collection);
        ctx.setRegister(continueKey, (hash['offset'] || 0) + collection.length);
        const scope = { forloop: new forloop_drop_1.ForloopDrop(collection.length, this.collection.getText(), this.variable) };
        ctx.push(scope);
        for (const item of collection) {
            scope[this.variable] = item;
            yield r.renderTemplates(this.templates, ctx, emitter);
            if (emitter['break']) {
                emitter['break'] = false;
                break;
            }
            emitter['continue'] = false;
            scope.forloop.next();
        }
        ctx.pop();
    }
};
function reversed(arr) {
    return [...arr].reverse();
}
function offset(arr, count) {
    return arr.slice(count);
}
function limit(arr, count) {
    return arr.slice(0, count);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vdGFncy9mb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1Q0FBNEk7QUFDNUksc0RBQW9EO0FBQ3BELDBEQUFxRDtBQUNyRCxrREFBeUQ7QUFFekQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBSWpELGtCQUFlO0lBQ2IsSUFBSSxFQUFFLE9BQU87SUFDYixLQUFLLEVBQUUsVUFBVSxLQUFlLEVBQUUsWUFBNkI7UUFDN0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQkFBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFOUUsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQzNDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUN4QyxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDeEMsSUFBQSxjQUFNLEVBQ0osUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFJLFVBQVUsRUFDdkQsR0FBRyxFQUFFLENBQUMsZ0JBQWdCLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUN4QyxDQUFBO1FBRUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFDbkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUE7UUFFdkIsSUFBSSxDQUFDLENBQUE7UUFDTCxNQUFNLE1BQU0sR0FBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQzthQUNyRSxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUN2QyxFQUFFLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUM5QyxFQUFFLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNyQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzlDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUE7UUFDdEQsQ0FBQyxDQUFDLENBQUE7UUFFSixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDaEIsQ0FBQztJQUNELE1BQU0sRUFBRSxRQUFTLENBQUMsRUFBRSxHQUFZLEVBQUUsT0FBZ0I7UUFDaEQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUE7UUFDOUIsSUFBSSxVQUFVLEdBQUcsSUFBQSx5QkFBWSxFQUFDLE1BQU0sSUFBQSxpQkFBUyxFQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUVwRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUN0QixNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDekQsT0FBTTtTQUNQO1FBRUQsTUFBTSxXQUFXLEdBQUcsV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDakYsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNwRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3hDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUVULE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHVCQUF1QjtZQUMzRCxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFBO1FBRWhELFVBQVUsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxFQUFFLFFBQW1DLEVBQUUsRUFBRTtZQUNoRixJQUFJLFFBQVEsS0FBSyxRQUFRO2dCQUFFLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtZQUNwRSxJQUFJLFFBQVEsS0FBSyxPQUFPO2dCQUFFLE9BQU8sS0FBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtZQUNqRSxPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUM3QixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUE7UUFFZCxHQUFHLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSwwQkFBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQTtRQUN2RyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2YsS0FBSyxNQUFNLElBQUksSUFBSSxVQUFVLEVBQUU7WUFDN0IsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUE7WUFDM0IsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ3JELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNwQixPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFBO2dCQUN4QixNQUFLO2FBQ047WUFDRCxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBQzNCLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUE7U0FDckI7UUFDRCxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDWCxDQUFDO0NBQ2dCLENBQUE7QUFFbkIsU0FBUyxRQUFRLENBQUssR0FBYTtJQUNqQyxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUMzQixDQUFDO0FBRUQsU0FBUyxNQUFNLENBQUssR0FBYSxFQUFFLEtBQWE7SUFDOUMsT0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3pCLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBSyxHQUFhLEVBQUUsS0FBYTtJQUM3QyxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQzVCLENBQUMifQ==