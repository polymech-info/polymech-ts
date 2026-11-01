"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash = void 0;
const expression_1 = require("../../render/expression");
const tokenizer_1 = require("../../parser/tokenizer");
/**
 * Key-Value Pairs Representing Tag Arguments
 * Example:
 *    For the markup `, foo:'bar', coo:2 reversed %}`,
 *    hash['foo'] === 'bar'
 *    hash['coo'] === 2
 *    hash['reversed'] === undefined
 */
class Hash {
    constructor(markup, jekyllStyle) {
        this.hash = {};
        const tokenizer = new tokenizer_1.Tokenizer(markup, {});
        for (const hash of tokenizer.readHashes(jekyllStyle)) {
            this.hash[hash.name.content] = hash.value;
        }
    }
    *render(ctx) {
        const hash = {};
        for (const key of Object.keys(this.hash)) {
            hash[key] = this.hash[key] === undefined ? true : yield (0, expression_1.evalToken)(this.hash[key], ctx);
        }
        return hash;
    }
}
exports.Hash = Hash;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy90ZW1wbGF0ZS90YWcvaGFzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3REFBbUQ7QUFFbkQsc0RBQWtEO0FBTWxEOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLElBQUk7SUFFZixZQUFhLE1BQWMsRUFBRSxXQUFxQjtRQURsRCxTQUFJLEdBQWMsRUFBRSxDQUFBO1FBRWxCLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDM0MsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3BELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1NBQzFDO0lBQ0gsQ0FBQztJQUNELENBQUUsTUFBTSxDQUFFLEdBQVk7UUFDcEIsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQ2YsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN4QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFBLHNCQUFTLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtTQUN2RjtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBZkQsb0JBZUMifQ==