"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.substitute = exports.getContext = exports.logger = void 0;
__exportStar(require("./liquid"), exports);
__exportStar(require("./Engine"), exports);
__exportStar(require("./options"), exports);
__exportStar(require("./types"), exports);
const constants_1 = require("./constants");
const debug_1 = require("@plastichub/core/debug");
const strings_1 = require("@plastichub/core/strings");
exports.logger = (0, debug_1.logger)(constants_1.MODULE_NAME);
var Engine_1 = require("./Engine");
Object.defineProperty(exports, "getContext", { enumerable: true, get: function () { return Engine_1.getContext; } });
const substitute = (alt, template, vars) => alt ? (0, strings_1.substituteAlt)(template, vars) : (0, strings_1.substitute)(template, vars);
exports.substitute = substitute;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBd0I7QUFDeEIsMkNBQXdCO0FBQ3hCLDRDQUF5QjtBQUN6QiwwQ0FBdUI7QUFFdkIsMkNBQXlDO0FBQ3pDLGtEQUEwRDtBQUMxRCxzREFBcUc7QUFHeEYsUUFBQSxNQUFNLEdBQUcsSUFBQSxjQUFPLEVBQUMsdUJBQVcsQ0FBQyxDQUFBO0FBQzFDLG1DQUFxQztBQUE1QixvR0FBQSxVQUFVLE9BQUE7QUFDWixNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQVksRUFBRSxRQUFnQixFQUFFLElBQW9CLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBQSx1QkFBYyxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxvQkFBVyxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUExSSxRQUFBLFVBQVUsY0FBZ0kifQ==