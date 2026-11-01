"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = void 0;
const error_1 = require("./error");
function assert(predicate, message) {
    if (!predicate) {
        const msg = typeof message === 'function'
            ? message()
            : (message || `expect ${predicate} to be true`);
        throw new error_1.AssertionError(msg);
    }
}
exports.assert = assert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL3V0aWwvYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUF3QztBQUV4QyxTQUFnQixNQUFNLENBQU0sU0FBK0IsRUFBRSxPQUFpQztJQUM1RixJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsTUFBTSxHQUFHLEdBQUcsT0FBTyxPQUFPLEtBQUssVUFBVTtZQUN2QyxDQUFDLENBQUMsT0FBTyxFQUFFO1lBQ1gsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLFVBQVUsU0FBUyxhQUFhLENBQUMsQ0FBQTtRQUNqRCxNQUFNLElBQUksc0JBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUM5QjtBQUNILENBQUM7QUFQRCx3QkFPQyJ9