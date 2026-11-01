"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelimitedToken = void 0;
const token_1 = require("./token");
const underscore_1 = require("../util/underscore");
class DelimitedToken extends token_1.Token {
    constructor(kind, content, input, begin, end, trimLeft, trimRight, file) {
        super(kind, input, begin, end, file);
        this.trimLeft = false;
        this.trimRight = false;
        this.content = this.getText();
        const tl = content[0] === '-';
        const tr = (0, underscore_1.last)(content) === '-';
        this.content = content
            .slice(tl ? 1 : 0, tr ? -1 : content.length)
            .trim();
        this.trimLeft = tl || trimLeft;
        this.trimRight = tr || trimRight;
    }
}
exports.DelimitedToken = DelimitedToken;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsaW1pdGVkLXRva2VuLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3Rva2Vucy9kZWxpbWl0ZWQtdG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQStCO0FBRS9CLG1EQUF5QztBQUV6QyxNQUFzQixjQUFlLFNBQVEsYUFBSztJQUloRCxZQUNFLElBQWUsRUFDZixPQUFlLEVBQ2YsS0FBYSxFQUNiLEtBQWEsRUFDYixHQUFXLEVBQ1gsUUFBaUIsRUFDakIsU0FBa0IsRUFDbEIsSUFBYTtRQUViLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFiL0IsYUFBUSxHQUFHLEtBQUssQ0FBQTtRQUNoQixjQUFTLEdBQUcsS0FBSyxDQUFBO1FBYXRCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQzdCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUE7UUFDN0IsTUFBTSxFQUFFLEdBQUcsSUFBQSxpQkFBSSxFQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQTtRQUNoQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU87YUFDbkIsS0FBSyxDQUNKLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ1YsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FDekI7YUFDQSxJQUFJLEVBQUUsQ0FBQTtRQUNULElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxJQUFJLFFBQVEsQ0FBQTtRQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsSUFBSSxTQUFTLENBQUE7SUFDbEMsQ0FBQztDQUNGO0FBM0JELHdDQTJCQyJ9