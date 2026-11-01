"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Value = void 0;
const tokenizer_1 = require("../parser/tokenizer");
const filter_1 = require("./filter/filter");
class Value {
    /**
     * @param str the value to be valuated, eg.: "foobar" | truncate: 3
     */
    constructor(str, liquid) {
        this.filters = [];
        const tokenizer = new tokenizer_1.Tokenizer(str, liquid.options.operatorsTrie);
        this.initial = tokenizer.readExpression();
        this.filters = tokenizer.readFilters().map(({ name, args }) => new filter_1.Filter(name, liquid.filters.get(name), args, liquid));
    }
    *value(ctx, lenient) {
        lenient = lenient || (ctx.opts.lenientIf && this.filters.length > 0 && this.filters[0].name === 'default');
        let val = yield this.initial.evaluate(ctx, lenient);
        for (const filter of this.filters) {
            val = yield filter.render(val, ctx);
        }
        return val;
    }
}
exports.Value = Value;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsdWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdGVtcGxhdGUvdmFsdWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsbURBQStDO0FBQy9DLDRDQUF3QztBQUl4QyxNQUFhLEtBQUs7SUFJaEI7O09BRUc7SUFDSCxZQUFvQixHQUFXLEVBQUUsTUFBYztRQU4vQixZQUFPLEdBQWEsRUFBRSxDQUFBO1FBT3BDLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtRQUNsRSxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtRQUN6QyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO0lBQzFILENBQUM7SUFDTSxDQUFFLEtBQUssQ0FBRSxHQUFZLEVBQUUsT0FBZ0I7UUFDNUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQTtRQUMxRyxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUVuRCxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDakMsR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7U0FDcEM7UUFDRCxPQUFPLEdBQUcsQ0FBQTtJQUNaLENBQUM7Q0FDRjtBQXJCRCxzQkFxQkMifQ==