"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./_cli"), exports);
__exportStar(require("./argv"), exports);
var debug_1 = require("@plastichub/core/debug");
var constants_1 = require("./constants");
exports.logger = debug_1.logger(constants_1.MODULE_NAME);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUF1QjtBQUN2Qix5Q0FBc0I7QUFDdEIseUNBQXNCO0FBRXRCLGdEQUEwRDtBQUMxRCx5Q0FBeUM7QUFFNUIsUUFBQSxNQUFNLEdBQUcsY0FBTyxDQUFDLHVCQUFXLENBQUMsQ0FBQSJ9