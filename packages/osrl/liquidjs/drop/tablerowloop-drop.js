"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablerowloopDrop = void 0;
const forloop_drop_1 = require("./forloop-drop");
class TablerowloopDrop extends forloop_drop_1.ForloopDrop {
    constructor(length, cols, collection, variable) {
        super(length, collection, variable);
        this.length = length;
        this.cols = cols;
    }
    row() {
        return Math.floor(this.i / this.cols) + 1;
    }
    col0() {
        return (this.i % this.cols);
    }
    col() {
        return this.col0() + 1;
    }
    col_first() {
        return this.col0() === 0;
    }
    col_last() {
        return this.col() === this.cols;
    }
}
exports.TablerowloopDrop = TablerowloopDrop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFibGVyb3dsb29wLWRyb3AuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvZHJvcC90YWJsZXJvd2xvb3AtZHJvcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpREFBNEM7QUFFNUMsTUFBYSxnQkFBaUIsU0FBUSwwQkFBVztJQUUvQyxZQUFvQixNQUFjLEVBQUUsSUFBWSxFQUFFLFVBQWtCLEVBQUUsUUFBZ0I7UUFDcEYsS0FBSyxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDcEIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDbEIsQ0FBQztJQUNNLEdBQUc7UUFDUixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFDTSxJQUFJO1FBQ1QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFDTSxHQUFHO1FBQ1IsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3hCLENBQUM7SUFDTSxTQUFTO1FBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFDTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQTtJQUNqQyxDQUFDO0NBQ0Y7QUF0QkQsNENBc0JDIn0=