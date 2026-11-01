"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrie = void 0;
const character_1 = require("../util/character");
function createTrie(operators) {
    const trie = {};
    for (const [name, handler] of Object.entries(operators)) {
        let node = trie;
        for (let i = 0; i < name.length; i++) {
            const c = name[i];
            node[c] = node[c] || {};
            if (i === name.length - 1 && (character_1.TYPES[name.charCodeAt(i)] & character_1.IDENTIFIER)) {
                node[c].needBoundary = true;
            }
            node = node[c];
        }
        node.handler = handler;
        node.end = true;
    }
    return trie;
}
exports.createTrie = createTrie;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0b3ItdHJpZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy91dGlsL29wZXJhdG9yLXRyaWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaURBQXFEO0FBTXJELFNBQWdCLFVBQVUsQ0FBRSxTQUFvQjtJQUM5QyxNQUFNLElBQUksR0FBUyxFQUFFLENBQUE7SUFDckIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDdkQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBRWYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDcEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2pCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO1lBRXZCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsc0JBQVUsQ0FBQyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTthQUM1QjtZQUVELElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDZjtRQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFBO0tBQ2hCO0lBQ0QsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDO0FBcEJELGdDQW9CQyJ9