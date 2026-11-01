"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
class Token {
    constructor(kind, input, begin, end, file) {
        this.kind = kind;
        this.input = input;
        this.begin = begin;
        this.end = end;
        this.file = file;
    }
    getText() {
        return this.input.slice(this.begin, this.end);
    }
    getPosition() {
        let [row, col] = [1, 1];
        for (let i = 0; i < this.begin; i++) {
            if (this.input[i] === '\n') {
                row++;
                col = 1;
            }
            else
                col++;
        }
        return [row, col];
    }
    size() {
        return this.end - this.begin;
    }
}
exports.Token = Token;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdG9rZW5zL3Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQXNCLEtBQUs7SUFDekIsWUFDUyxJQUFlLEVBQ2YsS0FBYSxFQUNiLEtBQWEsRUFDYixHQUFXLEVBQ1gsSUFBYTtRQUpiLFNBQUksR0FBSixJQUFJLENBQVc7UUFDZixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUNiLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFDWCxTQUFJLEdBQUosSUFBSSxDQUFTO0lBQ25CLENBQUM7SUFDRyxPQUFPO1FBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBQ00sV0FBVztRQUNoQixJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ25DLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQzFCLEdBQUcsRUFBRSxDQUFBO2dCQUNMLEdBQUcsR0FBRyxDQUFDLENBQUE7YUFDUjs7Z0JBQU0sR0FBRyxFQUFFLENBQUE7U0FDYjtRQUNELE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDbkIsQ0FBQztJQUNNLElBQUk7UUFDVCxPQUFPLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUM5QixDQUFDO0NBQ0Y7QUF4QkQsc0JBd0JDIn0=