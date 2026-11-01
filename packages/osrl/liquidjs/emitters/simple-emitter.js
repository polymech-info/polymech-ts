"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEmitter = void 0;
const underscore_1 = require("../util/underscore");
class SimpleEmitter {
    constructor() {
        this.buffer = '';
    }
    write(html) {
        this.buffer += (0, underscore_1.stringify)(html);
    }
}
exports.SimpleEmitter = SimpleEmitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlLWVtaXR0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvZW1pdHRlcnMvc2ltcGxlLWVtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQThDO0FBRzlDLE1BQWEsYUFBYTtJQUExQjtRQUNTLFdBQU0sR0FBRyxFQUFFLENBQUM7SUFLckIsQ0FBQztJQUhRLEtBQUssQ0FBRSxJQUFTO1FBQ3JCLElBQUksQ0FBQyxNQUFNLElBQUksSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxDQUFBO0lBQ2hDLENBQUM7Q0FDRjtBQU5ELHNDQU1DIn0=