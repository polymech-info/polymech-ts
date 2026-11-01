"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filters = exports.isValidUrl = exports.cleanArray = exports.applyFilters = exports.toFilters = exports.beautify = exports.md2html = void 0;
const showdown_1 = require("showdown");
const js_beautify_1 = require("js-beautify");
const turndown_1 = require("../plugins/turndown");
const __1 = require("..");
const index_1 = require("../index");
//////////////////////////////////////////////////////
//
// Filters
const md2html = (content) => {
    let converter = new showdown_1.Converter({
        tables: true,
        parseImgDimensions: true,
        simplifiedAutoLink: true,
        tasklists: true
    });
    converter.setOption('literalMidWordUnderscores', 'true');
    return converter.makeHtml(content);
};
exports.md2html = md2html;
const beautify = (content) => (0, js_beautify_1.html_beautify)(content, {});
exports.beautify = beautify;
//////////////////////////////////////////////////////
//
// Filter Utils
const toFilters = (src, Filters) => {
    src = (src || '').split(',');
    const ret = [];
    src.forEach((f) => {
        if (Filters[f]) {
            ret.push(Filters[f]);
        }
    });
    return ret;
};
exports.toFilters = toFilters;
const applyFilters = (src, _filters, filters) => __awaiter(void 0, void 0, void 0, function* () {
    (0, exports.toFilters)(_filters, filters).forEach((f) => {
        let _ret = f(src);
        if (_ret) {
            src = _ret;
        }
    });
    return src;
});
exports.applyFilters = applyFilters;
function cleanArray(arr) {
    const uniqueItems = Array.from(new Set(arr.map(item => JSON.stringify(item))))
        .map(item => JSON.parse(item));
    return uniqueItems.filter(item => {
        if (Array.isArray(item)) {
            return item.length > 0; // Exclude empty arrays
        }
        else if (typeof item === 'object' && item !== null) {
            return Object.keys(item).length > 0; // Exclude empty objects
        }
        else if (typeof item === 'string') {
            return (item);
        }
        return true;
    }).map(item => {
        if (typeof item === 'string') {
            return item;
        }
        return item;
    });
}
exports.cleanArray = cleanArray;
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch (_) {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
const Filters = (options) => {
    return {
        html: exports.md2html,
        beautify: exports.beautify,
        substitute: (str) => (0, __1.substitute)(false, str, options.variables),
        markdown: (str) => (0, turndown_1.markdownSync)(str, options, null),
        JSONParse: (str) => {
            try {
                return JSON.parse(str);
            }
            catch (e) {
                index_1.logger.error(`Filter Error : JSONParse: ${e} : ${str} @ ${options.source}`);
                return str;
            }
        }
    };
};
exports.Filters = Filters;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZmlsdGVycy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBb0M7QUFDcEMsNkNBQTJDO0FBQzNDLGtEQUE0RTtBQUU1RSwwQkFBK0I7QUFDL0Isb0NBQWlDO0FBSWpDLHNEQUFzRDtBQUN0RCxFQUFFO0FBQ0YsVUFBVTtBQUNILE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDL0IsSUFBSSxTQUFTLEdBQUcsSUFBSSxvQkFBUyxDQUFDO1FBQzFCLE1BQU0sRUFBRSxJQUFJO1FBQ1osa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLFNBQVMsRUFBRSxJQUFJO0tBQ2xCLENBQUMsQ0FBQztJQUNILFNBQVMsQ0FBQyxTQUFTLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDeEQsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3RDLENBQUMsQ0FBQTtBQVRZLFFBQUEsT0FBTyxXQVNuQjtBQUNNLE1BQU0sUUFBUSxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFBLDJCQUFhLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQWxELFFBQUEsUUFBUSxZQUEwQztBQUUvRCxzREFBc0Q7QUFDdEQsRUFBRTtBQUNGLGVBQWU7QUFDUixNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQVEsRUFBRSxPQUFrQixFQUFZLEVBQUU7SUFDaEUsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUM1QixNQUFNLEdBQUcsR0FBYSxFQUFFLENBQUE7SUFDeEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ2QsSUFBSSxPQUFPLENBQUMsQ0FBQyxD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