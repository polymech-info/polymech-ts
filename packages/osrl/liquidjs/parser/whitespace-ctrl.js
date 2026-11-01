"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whiteSpaceCtrl = void 0;
const type_guards_1 = require("../util/type-guards");
const character_1 = require("../util/character");
function whiteSpaceCtrl(tokens, options) {
    let inRaw = false;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!(0, type_guards_1.isDelimitedToken)(token))
            continue;
        if (!inRaw && token.trimLeft) {
            trimLeft(tokens[i - 1], options.greedy);
        }
        if ((0, type_guards_1.isTagToken)(token)) {
            if (token.name === 'raw')
                inRaw = true;
            else if (token.name === 'endraw')
                inRaw = false;
        }
        if (!inRaw && token.trimRight) {
            trimRight(tokens[i + 1], options.greedy);
        }
    }
}
exports.whiteSpaceCtrl = whiteSpaceCtrl;
function trimLeft(token, greedy) {
    if (!token || !(0, type_guards_1.isHTMLToken)(token))
        return;
    const mask = greedy ? character_1.BLANK : character_1.INLINE_BLANK;
    while (character_1.TYPES[token.input.charCodeAt(token.end - 1 - token.trimRight)] & mask)
        token.trimRight++;
}
function trimRight(token, greedy) {
    if (!token || !(0, type_guards_1.isHTMLToken)(token))
        return;
    const mask = greedy ? character_1.BLANK : character_1.INLINE_BLANK;
    while (character_1.TYPES[token.input.charCodeAt(token.begin + token.trimLeft)] & mask)
        token.trimLeft++;
    if (token.input.charAt(token.begin + token.trimLeft) === '\n')
        token.trimLeft++;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hpdGVzcGFjZS1jdHJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3BhcnNlci93aGl0ZXNwYWNlLWN0cmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQStFO0FBRS9FLGlEQUE4RDtBQUU5RCxTQUFnQixjQUFjLENBQUUsTUFBZSxFQUFFLE9BQThCO0lBQzdFLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQTtJQUVqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDdkIsSUFBSSxDQUFDLElBQUEsOEJBQWdCLEVBQUMsS0FBSyxDQUFDO1lBQUUsU0FBUTtRQUN0QyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDNUIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQ3hDO1FBRUQsSUFBSSxJQUFBLHdCQUFVLEVBQUMsS0FBSyxDQUFDLEVBQUU7WUFDckIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUs7Z0JBQUUsS0FBSyxHQUFHLElBQUksQ0FBQTtpQkFDakMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQTtTQUNoRDtRQUVELElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRTtZQUM3QixTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDekM7S0FDRjtBQUNILENBQUM7QUFuQkQsd0NBbUJDO0FBRUQsU0FBUyxRQUFRLENBQUUsS0FBWSxFQUFFLE1BQWU7SUFDOUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUEseUJBQVcsRUFBQyxLQUFLLENBQUM7UUFBRSxPQUFNO0lBRXpDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUJBQUssQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQTtJQUMxQyxPQUFPLGlCQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSTtRQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQTtBQUNqRyxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUUsS0FBWSxFQUFFLE1BQWU7SUFDL0MsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUEseUJBQVcsRUFBQyxLQUFLLENBQUM7UUFBRSxPQUFNO0lBRXpDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsaUJBQUssQ0FBQyxDQUFDLENBQUMsd0JBQVksQ0FBQTtJQUMxQyxPQUFPLGlCQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJO1FBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQzNGLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSTtRQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtBQUNqRixDQUFDIn0=