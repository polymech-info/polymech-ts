"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toThenable = exports.toValueSync = exports.toPromise = void 0;
const underscore_1 = require("./underscore");
// convert an async iterator to a Promise
function toPromise(val) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, underscore_1.isIterator)(val))
            return val;
        let value;
        let done = false;
        let next = 'next';
        do {
            const state = val[next](value);
            done = state.done;
            value = state.value;
            next = 'next';
            try {
                if ((0, underscore_1.isIterator)(value))
                    value = toPromise(value);
                if ((0, underscore_1.isPromise)(value))
                    value = yield value;
            }
            catch (err) {
                next = 'throw';
                value = err;
            }
        } while (!done);
        return value;
    });
}
exports.toPromise = toPromise;
// convert an async iterator to a value in a synchronous manner
function toValueSync(val) {
    if (!(0, underscore_1.isIterator)(val))
        return val;
    let value;
    let done = false;
    let next = 'next';
    do {
        const state = val[next](value);
        done = state.done;
        value = state.value;
        next = 'next';
        if ((0, underscore_1.isIterator)(value)) {
            try {
                value = toValueSync(value);
            }
            catch (err) {
                next = 'throw';
                value = err;
            }
        }
    } while (!done);
    return value;
}
exports.toValueSync = toValueSync;
exports.toThenable = toPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGlxdWlkanMvdXRpbC9hc3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBb0Q7QUFFcEQseUNBQXlDO0FBQ3pDLFNBQXNCLFNBQVMsQ0FBSyxHQUFvRDs7UUFDdEYsSUFBSSxDQUFDLElBQUEsdUJBQVUsRUFBQyxHQUFHLENBQUM7WUFBRSxPQUFPLEdBQUcsQ0FBQTtRQUNoQyxJQUFJLEtBQWMsQ0FBQTtRQUNsQixJQUFJLElBQUksR0FBRyxLQUFLLENBQUE7UUFDaEIsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFBO1FBQ2pCLEdBQUc7WUFDRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDOUIsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUE7WUFDakIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUE7WUFDbkIsSUFBSSxHQUFHLE1BQU0sQ0FBQTtZQUNiLElBQUk7Z0JBQ0YsSUFBSSxJQUFBLHVCQUFVLEVBQUMsS0FBSyxDQUFDO29CQUFFLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQy9DLElBQUksSUFBQSxzQkFBUyxFQUFDLEtBQUssQ0FBQztvQkFBRSxLQUFLLEdBQUcsTUFBTSxLQUFLLENBQUE7YUFDMUM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLEdBQUcsT0FBTyxDQUFBO2dCQUNkLEtBQUssR0FBRyxHQUFHLENBQUE7YUFDWjtTQUNGLFFBQVEsQ0FBQyxJQUFJLEVBQUM7UUFDZixPQUFPLEtBQVUsQ0FBQTtJQUNuQixDQUFDO0NBQUE7QUFuQkQsOEJBbUJDO0FBRUQsK0RBQStEO0FBQy9ELFNBQWdCLFdBQVcsQ0FBSyxHQUF1QztJQUNyRSxJQUFJLENBQUMsSUFBQSx1QkFBVSxFQUFDLEdBQUcsQ0FBQztRQUFFLE9BQU8sR0FBRyxDQUFBO0lBQ2hDLElBQUksS0FBVSxDQUFBO0lBQ2QsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFBO0lBQ2hCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQTtJQUNqQixHQUFHO1FBQ0QsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzlCLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1FBQ2pCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFBO1FBQ25CLElBQUksR0FBRyxNQUFNLENBQUE7UUFDYixJQUFJLElBQUEsdUJBQVUsRUFBQyxLQUFLLENBQUMsRUFBRTtZQUNyQixJQUFJO2dCQUNGLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDM0I7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLEdBQUcsT0FBTyxDQUFBO2dCQUNkLEtBQUssR0FBRyxHQUFHLENBQUE7YUFDWjtTQUNGO0tBQ0YsUUFBUSxDQUFDLElBQUksRUFBQztJQUNmLE9BQU8sS0FBSyxDQUFBO0FBQ2QsQ0FBQztBQXBCRCxrQ0FvQkM7QUFFWSxRQUFBLFVBQVUsR0FBRyxTQUFTLENBQUEifQ==