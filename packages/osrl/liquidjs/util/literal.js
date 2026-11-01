"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.literalValues = void 0;
const null_drop_1 = require("../drop/null-drop");
const empty_drop_1 = require("../drop/empty-drop");
const blank_drop_1 = require("../drop/blank-drop");
const nil = new null_drop_1.NullDrop();
exports.literalValues = {
    'true': true,
    'false': false,
    'nil': nil,
    'null': nil,
    'empty': new empty_drop_1.EmptyDrop(),
    'blank': new blank_drop_1.BlankDrop()
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGl0ZXJhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy91dGlsL2xpdGVyYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaURBQTRDO0FBQzVDLG1EQUE4QztBQUM5QyxtREFBOEM7QUFFOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxvQkFBUSxFQUFFLENBQUE7QUFDYixRQUFBLGFBQWEsR0FBRztJQUMzQixNQUFNLEVBQUUsSUFBSTtJQUNaLE9BQU8sRUFBRSxLQUFLO0lBQ2QsS0FBSyxFQUFFLEdBQUc7SUFDVixNQUFNLEVBQUUsR0FBRztJQUNYLE9BQU8sRUFBRSxJQUFJLHNCQUFTLEVBQUU7SUFDeEIsT0FBTyxFQUFFLElBQUksc0JBQVMsRUFBRTtDQUN6QixDQUFBIn0=