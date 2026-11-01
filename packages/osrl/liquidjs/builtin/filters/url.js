"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncode = exports.urlDecode = void 0;
const underscore_1 = require("../../util/underscore");
const urlDecode = (x) => (0, underscore_1.stringify)(x).split('+').map(decodeURIComponent).join(' ');
exports.urlDecode = urlDecode;
const urlEncode = (x) => (0, underscore_1.stringify)(x).split(' ').map(encodeURIComponent).join('+');
exports.urlEncode = urlEncode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpcXVpZGpzL2J1aWx0aW4vZmlsdGVycy91cmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0RBQWlEO0FBRTFDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNCQUFTLEVBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUFwRixRQUFBLFNBQVMsYUFBMkU7QUFDMUYsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLElBQUEsc0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQXBGLFFBQUEsU0FBUyxhQUEyRSJ9