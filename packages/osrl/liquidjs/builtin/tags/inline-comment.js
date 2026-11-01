"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    parse: function (tagToken, remainTokens) {
        if (tagToken.args.search(/\n\s*[^#\s]/g) !== -1) {
            throw new Error('every line of an inline comment must start with a \'#\' character');
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLWNvbW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL2lubGluZS1jb21tZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsa0JBQWU7SUFDYixLQUFLLEVBQUUsVUFBVSxRQUFrQixFQUFFLFlBQTZCO1FBQ2hFLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxtRUFBbUUsQ0FBQyxDQUFBO1NBQ3JGO0lBQ0gsQ0FBQztDQUNnQixDQUFBIn0=