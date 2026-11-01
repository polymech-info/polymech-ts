"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluate = void 0;
const vm = require("vm");
const isBuffer = Buffer.isBuffer;
const requireLike = require("require-like");
function merge(a, b) {
    if (!a || !b)
        return a;
    var keys = Object.keys(b);
    for (var k, i = 0, n = keys.length; i < n; i++) {
        k = keys[i];
        a[k] = b[k];
    }
    return a;
}
// Return the exports/module.exports variable set in the content
// content (String|VmScript): required
const evaluate = (content, filename, scope, includeGlobals) => {
    if (typeof filename !== 'string') {
        if (typeof filename === 'object') {
            includeGlobals = scope;
            scope = filename;
            filename = '';
        }
        else if (typeof filename === 'boolean') {
            includeGlobals = filename;
            scope = {};
            filename = '';
        }
    }
    // Expose standard Node globals
    let sandbox = {};
    let exports = {};
    let _filename = filename || module.parent.filename;
    if (includeGlobals) {
        merge(sandbox, global);
        // console is non-enumerable in node v10 and above
        sandbox.console = global.console;
        // process is non-enumerable in node v12 and above
        sandbox.process = global.process;
        sandbox.URL = global.URL;
        sandbox.require = requireLike(_filename);
    }
    if (typeof scope === 'object') {
        merge(sandbox, scope);
    }
    sandbox.exports = exports;
    sandbox.module = {
        exports: exports,
        filename: _filename,
        id: _filename,
        parent: module.parent,
        require: sandbox.require || requireLike(_filename)
    };
    sandbox.global = sandbox;
    var options = {
        filename: filename,
        displayErrors: false
    };
    if (isBuffer(content)) {
        content = content.toString();
    }
    // Evaluate the content with the given scope
    if (typeof content === 'string') {
        var stringScript = content.replace(/^\#\!.*/, '');
        var script = new vm.Script(stringScript, options);
        script.runInNewContext(sandbox, options);
    }
    else {
        content.runInNewContext(sandbox, options);
    }
    return sandbox.module.exports;
};
exports.evaluate = evaluate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy92bS9ldmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlCQUF3QjtBQUN4QixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFBO0FBQ2hDLDRDQUE2QztBQUU3QyxTQUFTLEtBQUssQ0FBRSxDQUFDLEVBQUUsQ0FBQztJQUNsQixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ3RCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDekIsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNYLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FDWjtJQUNELE9BQU8sQ0FBQyxDQUFBO0FBQ1YsQ0FBQztBQUVELGdFQUFnRTtBQUNoRSxzQ0FBc0M7QUFDL0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsRUFBRTtJQUVuRSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNoQyxjQUFjLEdBQUcsS0FBSyxDQUFBO1lBQ3RCLEtBQUssR0FBRyxRQUFRLENBQUE7WUFDaEIsUUFBUSxHQUFHLEVBQUUsQ0FBQTtTQUNkO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDeEMsY0FBYyxHQUFHLFFBQVEsQ0FBQTtZQUN6QixLQUFLLEdBQUcsRUFBRSxDQUFBO1lBQ1YsUUFBUSxHQUFHLEVBQUUsQ0FBQTtTQUNkO0tBQ0Y7SUFFRCwrQkFBK0I7SUFDL0IsSUFBSSxPQUFPLEdBQU8sRUFBRSxDQUFBO0lBQ3BCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUNoQixJQUFJLFNBQVMsR0FBRyxRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFFbkQsSUFBSSxjQUFjLEVBQUU7UUFDbEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUN0QixrREFBa0Q7UUFDbEQsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1FBQ2hDLGtEQUFrRDtRQUNsRCxPQUFPLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDaEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBO1FBQ3hCLE9BQU8sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0tBQ3pDO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUN0QjtJQUVELE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO0lBQ3pCLE9BQU8sQ0FBQyxNQUFNLEdBQUc7UUFDZixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsU0FBUztRQUNuQixFQUFFLEVBQUUsU0FBUztRQUNiLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtRQUNyQixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDO0tBQ25ELENBQUE7SUFDRCxPQUFPLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQTtJQUV4QixJQUFJLE9BQU8sR0FBRztRQUNaLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLGFBQWEsRUFBRSxLQUFLO0tBQ3JCLENBQUE7SUFFRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNyQixPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFBO0tBQzdCO0lBRUQsNENBQTRDO0lBQzVDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1FBQy9CLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2pELElBQUksTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDakQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUE7S0FDekM7U0FBTTtRQUNMLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQzFDO0lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtBQUMvQixDQUFDLENBQUE7QUE5RFksUUFBQSxRQUFRLFlBOERwQiJ9