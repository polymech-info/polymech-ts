"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJSProperty = exports.readProperty = exports.Context = void 0;
const drop_1 = require("../drop/drop");
const tslib_1 = require("tslib");
const liquid_options_1 = require("../liquid-options");
const underscore_1 = require("../util/underscore");
const error_1 = require("../util/error");
class Context {
    constructor(env = {}, opts = liquid_options_1.defaultOptions, renderOptions = {}) {
        var _a, _b;
        /**
         * insert a Context-level empty scope,
         * for tags like `{% capture %}` `{% assign %}` to operate
         */
        this.scopes = [{}];
        this.registers = {};
        this.sync = !!renderOptions.sync;
        this.opts = opts;
        this.globals = (_a = renderOptions.globals) !== null && _a !== void 0 ? _a : opts.globals;
        this.environments = env;
        this.strictVariables = (_b = renderOptions.strictVariables) !== null && _b !== void 0 ? _b : this.opts.strictVariables;
    }
    getRegister(key) {
        return (this.registers[key] = this.registers[key] || {});
    }
    setRegister(key, value) {
        return (this.registers[key] = value);
    }
    saveRegister(...keys) {
        return keys.map(key => [key, this.getRegister(key)]);
    }
    restoreRegister(keyValues) {
        return keyValues.forEach(([key, value]) => this.setRegister(key, value));
    }
    getAll() {
        return [this.globals, this.environments, ...this.scopes]
            .reduce((ctx, val) => (0, tslib_1.__assign)(ctx, val), {});
    }
    get(paths) {
        const scope = this.findScope(paths[0]);
        return this.getFromScope(scope, paths);
    }
    getFromScope(scope, paths) {
        if ((0, underscore_1.isString)(paths))
            paths = paths.split('.');
        return paths.reduce((scope, path, i) => {
            scope = readProperty(scope, path, this.opts.ownPropertyOnly);
            if ((0, underscore_1.isNil)(scope) && this.strictVariables) {
                throw new error_1.InternalUndefinedVariableError(paths.slice(0, i + 1).join('.'));
            }
            return scope;
        }, scope);
    }
    push(ctx) {
        return this.scopes.push(ctx);
    }
    pop() {
        return this.scopes.pop();
    }
    bottom() {
        return this.scopes[0];
    }
    findScope(key) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const candidate = this.scopes[i];
            if (key in candidate)
                return candidate;
        }
        if (key in this.environments)
            return this.environments;
        return this.globals;
    }
}
exports.Context = Context;
function readProperty(obj, key, ownPropertyOnly) {
    if ((0, underscore_1.isNil)(obj))
        return obj;
    obj = (0, underscore_1.toLiquid)(obj);
    if ((0, underscore_1.isArray)(obj) && key < 0)
        return obj[obj.length + +key];
    const jsProperty = readJSProperty(obj, key, ownPropertyOnly);
    if (jsProperty === undefined && obj instanceof drop_1.Drop)
        return obj.liquidMethodMissing(key);
    if ((0, underscore_1.isFunction)(jsProperty))
        return jsProperty.call(obj);
    if (key === 'size')
        return readSize(obj);
    else if (key === 'first')
        return readFirst(obj);
    else if (key === 'last')
        return readLast(obj);
    return jsProperty;
}
exports.readProperty = readProperty;
function readJSProperty(obj, key, ownPropertyOnly) {
    if (ownPropertyOnly && !Object.hasOwnProperty.call(obj, key))
        return undefined;
    return obj[key];
}
exports.readJSProperty = readJSProperty;
function readFirst(obj) {
    if ((0, underscore_1.isArray)(obj))
        return obj[0];
    return obj['first'];
}
function readLast(obj) {
    if ((0, underscore_1.isArray)(obj))
        return obj[obj.length - 1];
    return obj['last'];
}
function readSize(obj) {
    if (obj.hasOwnProperty('size') || obj['size'] !== undefined)
        return obj['size'];
    if ((0, underscore_1.isArray)(obj) || (0, underscore_1.isString)(obj))
        return obj.length;
    if (typeof obj === 'object')
        return Object.keys(obj).length;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9jb250ZXh0L2NvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQW1DO0FBQ25DLGlDQUFnQztBQUNoQyxzREFBd0Y7QUFFeEYsbURBQW1GO0FBQ25GLHlDQUE4RDtBQUk5RCxNQUFhLE9BQU87SUEwQmxCLFlBQW9CLE1BQWMsRUFBRSxFQUFFLE9BQThCLCtCQUFjLEVBQUUsZ0JBQStCLEVBQUU7O1FBekJySDs7O1dBR0c7UUFDSyxXQUFNLEdBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN0QixjQUFTLEdBQUcsRUFBRSxDQUFBO1FBcUJwQixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFBO1FBQ2hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1FBQ2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBQSxhQUFhLENBQUMsT0FBTyxtQ0FBSSxJQUFJLENBQUMsT0FBTyxDQUFBO1FBQ3BELElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBQSxhQUFhLENBQUMsZUFBZSxtQ0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQTtJQUNuRixDQUFDO0lBQ00sV0FBVyxDQUFFLEdBQVc7UUFDN0IsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUMxRCxDQUFDO0lBQ00sV0FBVyxDQUFFLEdBQVcsRUFBRSxLQUFVO1FBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO0lBQ3RDLENBQUM7SUFDTSxZQUFZLENBQUUsR0FBRyxJQUFjO1FB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