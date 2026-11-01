"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterMap = void 0;
const filter_1 = require("./filter");
const assert_1 = require("../../util/assert");
class FilterMap {
    constructor(strictFilters, liquid) {
        this.strictFilters = strictFilters;
        this.liquid = liquid;
        this.impls = {};
    }
    get(name) {
        const impl = this.impls[name];
        (0, assert_1.assert)(impl || !this.strictFilters, () => `undefined filter: ${name}`);
        return impl;
    }
    set(name, impl) {
        this.impls[name] = impl;
    }
    create(name, args) {
        return new filter_1.Filter(name, this.get(name), args, this.liquid);
    }
}
exports.FilterMap = FilterMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyLW1hcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy90ZW1wbGF0ZS9maWx0ZXIvZmlsdGVyLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBaUM7QUFFakMsOENBQTBDO0FBRzFDLE1BQWEsU0FBUztJQUdwQixZQUNtQixhQUFzQixFQUN0QixNQUFjO1FBRGQsa0JBQWEsR0FBYixhQUFhLENBQVM7UUFDdEIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUp6QixVQUFLLEdBQXVDLEVBQUUsQ0FBQTtJQUtuRCxDQUFDO0lBRUosR0FBRyxDQUFFLElBQVk7UUFDZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzdCLElBQUEsZUFBTSxFQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFDLENBQUE7UUFDdEUsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsR0FBRyxDQUFFLElBQVksRUFBRSxJQUF1QjtRQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQTtJQUN6QixDQUFDO0lBRUQsTUFBTSxDQUFFLElBQVksRUFBRSxJQUFpQjtRQUNyQyxPQUFPLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDNUQsQ0FBQztDQUNGO0FBckJELDhCQXFCQyJ9