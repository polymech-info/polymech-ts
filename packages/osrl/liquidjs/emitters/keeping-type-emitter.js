"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeepingTypeEmitter = void 0;
const underscore_1 = require("../util/underscore");
class KeepingTypeEmitter {
    constructor() {
        this.buffer = '';
    }
    write(html) {
        html = (0, underscore_1.toValue)(html);
        // This will only preserve the type if the value is isolated.
        // I.E:
        // {{ my-port }} -> 42
        // {{ my-host }}:{{ my-port }} -> 'host:42'
        if (typeof html !== 'string' && this.buffer === '') {
            this.buffer = html;
        }
        else {
            this.buffer = (0, underscore_1.stringify)(this.buffer) + (0, underscore_1.stringify)(html);
        }
    }
}
exports.KeepingTypeEmitter = KeepingTypeEmitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2VlcGluZy10eXBlLWVtaXR0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvZW1pdHRlcnMva2VlcGluZy10eXBlLWVtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQXVEO0FBR3ZELE1BQWEsa0JBQWtCO0lBQS9CO1FBQ1MsV0FBTSxHQUFRLEVBQUUsQ0FBQztJQWMxQixDQUFDO0lBWlEsS0FBSyxDQUFFLElBQVM7UUFDckIsSUFBSSxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLENBQUMsQ0FBQTtRQUNwQiw2REFBNkQ7UUFDN0QsT0FBTztRQUNQLHNCQUFzQjtRQUN0QiwyQ0FBMkM7UUFDM0MsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUU7WUFDbEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7U0FDbkI7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFBLHNCQUFTLEVBQUMsSUFBSSxDQUFDLENBQUE7U0FDdkQ7SUFDSCxDQUFDO0NBQ0Y7QUFmRCxnREFlQyJ9