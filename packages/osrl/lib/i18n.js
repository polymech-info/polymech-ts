"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = exports.hash = exports.clean = void 0;
const crypto_1 = require("crypto");
const read_1 = require("@plastichub/fs/read");
const write_1 = require("@plastichub/fs/write");
const removeNonPrintableCharacters = (text) => text.replace(/[^\x20-\x7E]/g, '');
const clean = (text = "") => text.trim();
exports.clean = clean;
const hash = (text) => (0, crypto_1.createHash)('md5').update((0, exports.clean)(text)).digest('base64');
exports.hash = hash;
const store = (storePath, text, file = '') => {
    const _hash = (0, exports.hash)(text);
    const store = (0, read_1.sync)(storePath, 'json') || {};
    store[_hash] = (0, exports.clean)(text);
    (0, write_1.sync)(storePath, store);
};
exports.store = store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtQ0FBbUM7QUFDbkMsOENBQWtEO0FBQ2xELGdEQUFvRDtBQUVwRCxNQUFNLDRCQUE0QixHQUFHLENBQUMsSUFBWSxFQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUV6RixNQUFNLEtBQUssR0FBRyxDQUFDLE9BQWUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7QUFBMUMsUUFBQSxLQUFLLFNBQXFDO0FBQ2hELE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFBLG1CQUFVLEVBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUEsYUFBSyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQS9FLFFBQUEsSUFBSSxRQUEyRTtBQUVyRixNQUFNLEtBQUssR0FBRyxDQUFDLFNBQWdCLEVBQUUsSUFBWSxFQUFFLE9BQWUsRUFBRSxFQUFFLEVBQUU7SUFDMUUsTUFBTSxLQUFLLEdBQVcsSUFBQSxZQUFJLEVBQUMsSUFBSSxDQUFDLENBQUE7SUFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUMzQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBQSxhQUFLLEVBQUMsSUFBSSxDQUFDLENBQUE7SUFDMUIsSUFBQSxZQUFLLEVBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFBO0FBQ3hCLENBQUMsQ0FBQTtBQUxZLFFBQUEsS0FBSyxTQUtqQiJ9