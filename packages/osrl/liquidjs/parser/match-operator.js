"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchOperator = void 0;
const character_1 = require("../util/character");
function matchOperator(str, begin, trie, end = str.length) {
    let node = trie;
    let i = begin;
    let info;
    while (node[str[i]] && i < end) {
        node = node[str[i++]];
        if (node['end'])
            info = node;
    }
    if (!info)
        return -1;
    if (info['needBoundary'] && (character_1.TYPES[str.charCodeAt(i)] & character_1.IDENTIFIER))
        return -1;
    return i;
}
exports.matchOperator = matchOperator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2gtb3BlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvcGFyc2VyL21hdGNoLW9wZXJhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUFxRDtBQUdyRCxTQUFnQixhQUFhLENBQUUsR0FBVyxFQUFFLEtBQWEsRUFBRSxJQUFVLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNO0lBQ3JGLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTtJQUNmLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQTtJQUNiLElBQUksSUFBSSxDQUFBO0lBQ1IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRTtRQUM5QixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDckIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQUUsSUFBSSxHQUFHLElBQUksQ0FBQTtLQUM3QjtJQUNELElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtJQUNwQixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGlCQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLHNCQUFVLENBQUM7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFBO0lBQzlFLE9BQU8sQ0FBQyxDQUFBO0FBQ1YsQ0FBQztBQVhELHNDQVdDIn0=