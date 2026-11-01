"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripHtml = exports.newlineToBr = exports.escapeOnce = exports.escape = void 0;
const underscore_1 = require("../../util/underscore");
const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&#34;',
    "'": '&#39;'
};
const unescapeMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&#34;': '"',
    '&#39;': "'"
};
function escape(str) {
    return (0, underscore_1.stringify)(str).replace(/&|<|>|"|'/g, m => escapeMap[m]);
}
exports.escape = escape;
function unescape(str) {
    return (0, underscore_1.stringify)(str).replace(/&(amp|lt|gt|#34|#39);/g, m => unescapeMap[m]);
}
function escapeOnce(str) {
    return escape(unescape((0, underscore_1.stringify)(str)));
}
exports.escapeOnce = escapeOnce;
function newlineToBr(v) {
    return (0, underscore_1.stringify)(v).replace(/\n/g, '<br />\n');
}
exports.newlineToBr = newlineToBr;
function stripHtml(v) {
    return (0, underscore_1.stringify)(v).replace(/<script.*?<\/script>|<!--.*?-->|<style.*?<\/style>|<.*?>/g, '');
}
exports.stripHtml = stripHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saXF1aWRqcy9idWlsdGluL2ZpbHRlcnMvaHRtbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxzREFBaUQ7QUFFakQsTUFBTSxTQUFTLEdBQUc7SUFDaEIsR0FBRyxFQUFFLE9BQU87SUFDWixHQUFHLEVBQUUsTUFBTTtJQUNYLEdBQUcsRUFBRSxNQUFNO0lBQ1gsR0FBRyxFQUFFLE9BQU87SUFDWixHQUFHLEVBQUUsT0FBTztDQUNiLENBQUE7QUFDRCxNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsR0FBRztJQUNaLE1BQU0sRUFBRSxHQUFHO0lBQ1gsTUFBTSxFQUFFLEdBQUc7SUFDWCxPQUFPLEVBQUUsR0FBRztJQUNaLE9BQU8sRUFBRSxHQUFHO0NBQ2IsQ0FBQTtBQUVELFNBQWdCLE1BQU0sQ0FBRSxHQUFXO0lBQ2pDLE9BQU8sSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNoRSxDQUFDO0FBRkQsd0JBRUM7QUFFRCxTQUFTLFFBQVEsQ0FBRSxHQUFXO0lBQzVCLE9BQU8sSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzlFLENBQUM7QUFFRCxTQUFnQixVQUFVLENBQUUsR0FBVztJQUNyQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBQSxzQkFBUyxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBRkQsZ0NBRUM7QUFFRCxTQUFnQixXQUFXLENBQUUsQ0FBUztJQUNwQyxPQUFPLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFBO0FBQ2hELENBQUM7QUFGRCxrQ0FFQztBQUVELFNBQWdCLFNBQVMsQ0FBRSxDQUFTO0lBQ2xDLE9BQU8sSUFBQSxzQkFBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQywyREFBMkQsRUFBRSxFQUFFLENBQUMsQ0FBQTtBQUM5RixDQUFDO0FBRkQsOEJBRUMifQ==