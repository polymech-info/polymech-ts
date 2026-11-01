"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockDrop = void 0;
const drop_1 = require("./drop");
class BlockDrop extends drop_1.Drop {
    constructor(
    // the block render from layout template
    superBlockRender = () => '') {
        super();
        this.superBlockRender = superBlockRender;
    }
    /**
     * Provide parent access in child block by
     * {{ block.super }}
     */
    super() {
        return this.superBlockRender();
    }
}
exports.BlockDrop = BlockDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2stZHJvcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9kcm9wL2Jsb2NrLWRyb3AudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQTZCO0FBRTdCLE1BQWEsU0FBVSxTQUFRLFdBQUk7SUFDakM7SUFDRSx3Q0FBd0M7SUFDaEMsbUJBQXdDLEdBQUcsRUFBRSxDQUFDLEVBQUU7UUFFeEQsS0FBSyxFQUFFLENBQUE7UUFGQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWdDO0lBRzFELENBQUM7SUFDRDs7O09BR0c7SUFDSSxLQUFLO1FBQ1YsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0NBQ0Y7QUFkRCw4QkFjQyJ9