"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagMap = void 0;
const assert_1 = require("../../util/assert");
class TagMap {
    constructor() {
        this.impls = {};
    }
    get(name) {
        const impl = this.impls[name];
        (0, assert_1.assert)(impl, () => `tag "${name}" not found`);
        return impl;
    }
    set(name, impl) {
        this.impls[name] = impl;
    }
}
exports.TagMap = TagMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFnLW1hcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy90ZW1wbGF0ZS90YWcvdGFnLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4Q0FBMEM7QUFFMUMsTUFBYSxNQUFNO0lBQW5CO1FBQ1UsVUFBSyxHQUFvQyxFQUFFLENBQUE7SUFXckQsQ0FBQztJQVRDLEdBQUcsQ0FBRSxJQUFZO1FBQ2YsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM3QixJQUFBLGVBQU0sRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxJQUFJLGFBQWEsQ0FBQyxDQUFBO1FBQzdDLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELEdBQUcsQ0FBRSxJQUFZLEVBQUUsSUFBb0I7UUFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7SUFDekIsQ0FBQztDQUNGO0FBWkQsd0JBWUMifQ==