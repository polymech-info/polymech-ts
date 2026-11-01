"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseStream = void 0;
const type_guards_1 = require("../util/type-guards");
class ParseStream {
    constructor(tokens, parseToken) {
        this.handlers = {};
        this.stopRequested = false;
        this.tokens = tokens;
        this.parseToken = parseToken;
    }
    on(name, cb) {
        this.handlers[name] = cb;
        return this;
    }
    trigger(event, arg) {
        const h = this.handlers[event];
        return h ? (h.call(this, arg), true) : false;
    }
    start() {
        this.trigger('start');
        let token;
        while (!this.stopRequested && (token = this.tokens.shift())) {
            if (this.trigger('token', token))
                continue;
            if ((0, type_guards_1.isTagToken)(token) && this.trigger(`tag:${token.name}`, token)) {
                continue;
            }
            const template = this.parseToken(token, this.tokens);
            this.trigger('template', template);
        }
        if (!this.stopRequested)
            this.trigger('end');
        return this;
    }
    stop() {
        this.stopRequested = true;
        return this;
    }
}
exports.ParseStream = ParseStream;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2Utc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3BhcnNlci9wYXJzZS1zdHJlYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQWdEO0FBS2hELE1BQWEsV0FBVztJQU10QixZQUFvQixNQUFXLEVBQUUsVUFBeUI7UUFKbEQsYUFBUSxHQUF3QyxFQUFFLENBQUE7UUFDbEQsa0JBQWEsR0FBRyxLQUFLLENBQUE7UUFJM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDcEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7SUFDOUIsQ0FBQztJQUNNLEVBQUUsQ0FBdUMsSUFBWSxFQUFFLEVBQXdDO1FBQ3BHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO1FBQ3hCLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUNPLE9BQU8sQ0FBK0IsS0FBYSxFQUFFLEdBQU87UUFDbEUsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM5QixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO0lBQzlDLENBQUM7SUFDTSxLQUFLO1FBQ1YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNyQixJQUFJLEtBQW9CLENBQUE7UUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFO1lBQzNELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO2dCQUFFLFNBQVE7WUFDMUMsSUFBSSxJQUFBLHdCQUFVLEVBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDakUsU0FBUTthQUNUO1lBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3BELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1NBQ25DO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM1QyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDTSxJQUFJO1FBQ1QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7UUFDekIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0NBQ0Y7QUFwQ0Qsa0NBb0NDIn0=