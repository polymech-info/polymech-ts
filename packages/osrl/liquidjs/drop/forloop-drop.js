"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForloopDrop = void 0;
const drop_1 = require("./drop");
class ForloopDrop extends drop_1.Drop {
    constructor(length, collection, variable) {
        super();
        this.i = 0;
        this.length = length;
        this.name = `${variable}-${collection}`;
    }
    next() {
        this.i++;
    }
    index0() {
        return this.i;
    }
    index() {
        return this.i + 1;
    }
    first() {
        return this.i === 0;
    }
    last() {
        return this.i === this.length - 1;
    }
    rindex() {
        return this.length - this.i;
    }
    rindex0() {
        return this.length - this.i - 1;
    }
    valueOf() {
        return JSON.stringify(this);
    }
}
exports.ForloopDrop = ForloopDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybG9vcC1kcm9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL2Ryb3AvZm9ybG9vcC1kcm9wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUE2QjtBQUU3QixNQUFhLFdBQVksU0FBUSxXQUFJO0lBSW5DLFlBQW9CLE1BQWMsRUFBRSxVQUFrQixFQUFFLFFBQWdCO1FBQ3RFLEtBQUssRUFBRSxDQUFBO1FBSkMsTUFBQyxHQUFHLENBQUMsQ0FBQTtRQUtiLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxRQUFRLElBQUksVUFBVSxFQUFFLENBQUE7SUFDekMsQ0FBQztJQUNNLElBQUk7UUFDVCxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUE7SUFDVixDQUFDO0lBQ00sTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUNmLENBQUM7SUFDTSxLQUFLO1FBQ1YsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNuQixDQUFDO0lBQ00sS0FBSztRQUNWLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDckIsQ0FBQztJQUNNLElBQUk7UUFDVCxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7SUFDbkMsQ0FBQztJQUNNLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBQ00sT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBQ00sT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QixDQUFDO0NBQ0Y7QUFqQ0Qsa0NBaUNDIn0=