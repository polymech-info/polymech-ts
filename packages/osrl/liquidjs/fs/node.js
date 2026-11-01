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
exports.sep = exports.contains = exports.dirname = exports.fallback = exports.resolve = exports.readFileSync = exports.existsSync = exports.readFile = exports.exists = void 0;
const _ = require("../util/underscore");
const path_1 = require("path");
const fs_1 = require("fs");
const node_require_1 = require("./node-require");
const statAsync = _.promisify(fs_1.stat);
const readFileAsync = _.promisify(fs_1.readFile);
function exists(filepath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield statAsync(filepath);
            return true;
        }
        catch (err) {
            return false;
        }
    });
}
exports.exists = exists;
function readFile(filepath) {
    return readFileAsync(filepath, 'utf8');
}
exports.readFile = readFile;
function existsSync(filepath) {
    try {
        (0, fs_1.statSync)(filepath);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.existsSync = existsSync;
function readFileSync(filepath) {
    return (0, fs_1.readFileSync)(filepath, 'utf8');
}
exports.readFileSync = readFileSync;
function resolve(root, file, ext) {
    if (!(0, path_1.extname)(file))
        file += ext;
    return (0, path_1.resolve)(root, file);
}
exports.resolve = resolve;
function fallback(file) {
    try {
        return (0, node_require_1.requireResolve)(file);
    }
    catch (e) { }
}
exports.fallback = fallback;
function dirname(filepath) {
    return (0, path_1.dirname)(filepath);
}
exports.dirname = dirname;
function contains(root, file) {
    root = (0, path_1.resolve)(root);
    root = root.endsWith(path_1.sep) ? root : root + path_1.sep;
    return file.startsWith(root);
}
exports.contains = contains;
var path_2 = require("path");
Object.defineProperty(exports, "sep", { enumerable: true, get: function () { return path_2.sep; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saXF1aWRqcy9mcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLHdDQUF1QztBQUN2QywrQkFBbUY7QUFDbkYsMkJBQStGO0FBQy9GLGlEQUErQztBQUUvQyxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLFNBQUksQ0FBQyxDQUFBO0FBQ25DLE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQXlCLGFBQW1CLENBQUMsQ0FBQTtBQUU5RSxTQUFzQixNQUFNLENBQUUsUUFBZ0I7O1FBQzVDLElBQUk7WUFDRixNQUFNLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUN6QixPQUFPLElBQUksQ0FBQTtTQUNaO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLEtBQUssQ0FBQTtTQUNiO0lBQ0gsQ0FBQztDQUFBO0FBUEQsd0JBT0M7QUFDRCxTQUFnQixRQUFRLENBQUUsUUFBZ0I7SUFDeEMsT0FBUSxhQUFxQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBRkQsNEJBRUM7QUFDRCxTQUFnQixVQUFVLENBQUUsUUFBZ0I7SUFDMUMsSUFBSTtRQUNGLElBQUEsYUFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2xCLE9BQU8sSUFBSSxDQUFBO0tBQ1o7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sS0FBSyxDQUFBO0tBQ2I7QUFDSCxDQUFDO0FBUEQsZ0NBT0M7QUFDRCxTQUFnQixZQUFZLENBQUUsUUFBZ0I7SUFDNUMsT0FBTyxJQUFBLGlCQUFnQixFQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUMzQyxDQUFDO0FBRkQsb0NBRUM7QUFDRCxTQUFnQixPQUFPLENBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxHQUFXO0lBQzlELElBQUksQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUM7UUFBRSxJQUFJLElBQUksR0FBRyxDQUFBO0lBQy9CLE9BQU8sSUFBQSxjQUFXLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ2hDLENBQUM7QUFIRCwwQkFHQztBQUNELFNBQWdCLFFBQVEsQ0FBRSxJQUFZO0lBQ3BDLElBQUk7UUFDRixPQUFPLElBQUEsNkJBQWMsRUFBQyxJQUFJLENBQUMsQ0FBQTtLQUM1QjtJQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUU7QUFDaEIsQ0FBQztBQUpELDRCQUlDO0FBQ0QsU0FBZ0IsT0FBTyxDQUFFLFFBQWdCO0lBQ3ZDLE9BQU8sSUFBQSxjQUFXLEVBQUMsUUFBUSxDQUFDLENBQUE7QUFDOUIsQ0FBQztBQUZELDBCQUVDO0FBQ0QsU0FBZ0IsUUFBUSxDQUFFLElBQVksRUFBRSxJQUFZO0lBQ2xELElBQUksR0FBRyxJQUFBLGNBQVcsRUFBQyxJQUFJLENBQUMsQ0FBQTtJQUN4QixJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsVUFBRyxDQUFBO0lBQzdDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUM5QixDQUFDO0FBSkQsNEJBSUM7QUFFRCw2QkFBMEI7QUFBakIsMkZBQUEsR0FBRyxPQUFBIn0=