"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assign_1 = require("./assign");
const for_1 = require("./for");
const capture_1 = require("./capture");
const case_1 = require("./case");
const comment_1 = require("./comment");
const include_1 = require("./include");
const render_1 = require("./render");
const decrement_1 = require("./decrement");
const cycle_1 = require("./cycle");
const if_1 = require("./if");
const increment_1 = require("./increment");
const layout_1 = require("./layout");
const block_1 = require("./block");
const raw_1 = require("./raw");
const tablerow_1 = require("./tablerow");
const unless_1 = require("./unless");
const break_1 = require("./break");
const continue_1 = require("./continue");
const echo_1 = require("./echo");
const liquid_1 = require("./liquid");
const inline_comment_1 = require("./inline-comment");
const tags = {
    assign: assign_1.default, 'for': for_1.default, capture: capture_1.default, 'case': case_1.default, comment: comment_1.default, include: include_1.default, render: render_1.default, decrement: decrement_1.default, increment: increment_1.default, cycle: cycle_1.default, 'if': if_1.default, layout: layout_1.default, block: block_1.default, raw: raw_1.default, tablerow: tablerow_1.default, unless: unless_1.default, 'break': break_1.default, 'continue': continue_1.default, echo: echo_1.default, liquid: liquid_1.default, '#': inline_comment_1.default
};
exports.default = tags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGlxdWlkanMvYnVpbHRpbi90YWdzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQTZCO0FBQzdCLCtCQUF1QjtBQUN2Qix1Q0FBK0I7QUFDL0IsaUNBQXlCO0FBQ3pCLHVDQUErQjtBQUMvQix1Q0FBK0I7QUFDL0IscUNBQTZCO0FBQzdCLDJDQUFtQztBQUNuQyxtQ0FBMkI7QUFDM0IsNkJBQXFCO0FBQ3JCLDJDQUFtQztBQUNuQyxxQ0FBNkI7QUFDN0IsbUNBQTJCO0FBQzNCLCtCQUF1QjtBQUN2Qix5Q0FBaUM7QUFDakMscUNBQTZCO0FBQzdCLG1DQUEyQjtBQUMzQix5Q0FBaUM7QUFDakMsaUNBQXlCO0FBQ3pCLHFDQUE2QjtBQUM3QixxREFBNEM7QUFHNUMsTUFBTSxJQUFJLEdBQXNDO0lBQzlDLE1BQU0sRUFBTixnQkFBTSxFQUFFLEtBQUssRUFBRSxhQUFHLEVBQUUsT0FBTyxFQUFQLGlCQUFPLEVBQUUsTUFBTSxFQUFFLGNBQUksRUFBRSxPQUFPLEVBQVAsaUJBQU8sRUFBRSxPQUFPLEVBQVAsaUJBQU8sRUFBRSxNQUFNLEVBQU4sZ0JBQU0sRUFBRSxTQUFTLEVBQVQsbUJBQVMsRUFBRSxTQUFTLEVBQVQsbUJBQVMsRUFBRSxLQUFLLEVBQUwsZUFBSyxFQUFFLElBQUksRUFBRSxZQUFFLEVBQUUsTUFBTSxFQUFOLGdCQUFNLEVBQUUsS0FBSyxFQUFMLGVBQUssRUFBRSxHQUFHLEVBQUgsYUFBRyxFQUFFLFFBQVEsRUFBUixrQkFBUSxFQUFFLE1BQU0sRUFBTixnQkFBTSxFQUFFLE9BQU8sRUFBRSxlQUFLLEVBQUUsVUFBVSxFQUFFLGtCQUFRLEVBQUUsSUFBSSxFQUFKLGNBQUksRUFBRSxNQUFNLEVBQU4sZ0JBQU0sRUFBRSxHQUFHLEVBQUUsd0JBQWE7Q0FDek4sQ0FBQTtBQUVELGtCQUFlLElBQUksQ0FBQSJ9