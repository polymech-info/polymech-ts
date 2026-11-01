"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = exports.LookupType = void 0;
const underscore_1 = require("../util/underscore");
const assert_1 = require("../util/assert");
var LookupType;
(function (LookupType) {
    LookupType["Partials"] = "partials";
    LookupType["Layouts"] = "layouts";
    LookupType["Root"] = "root";
})(LookupType = exports.LookupType || (exports.LookupType = {}));
class Loader {
    constructor(options) {
        this.options = options;
        if (options.relativeReference) {
            const sep = options.fs.sep;
            (0, assert_1.assert)(sep, '`fs.sep` is required for relative reference');
            const rRelativePath = new RegExp(['.' + sep, '..' + sep, './', '../'].map(prefix => (0, underscore_1.escapeRegex)(prefix)).join('|'));
            this.shouldLoadRelative = (referencedFile) => rRelativePath.test(referencedFile);
        }
        else {
            this.shouldLoadRelative = (referencedFile) => false;
        }
        this.contains = this.options.fs.contains || (() => true);
    }
    *lookup(file, type, sync, currentFile) {
        const { fs } = this.options;
        const dirs = this.options[type];
        for (const filepath of this.candidates(file, dirs, currentFile, type !== LookupType.Root)) {
            if (sync ? fs.existsSync(filepath) : yield fs.exists(filepath))
                return filepath;
        }
        throw this.lookupError(file, dirs);
    }
    *candidates(file, dirs, currentFile, enforceRoot) {
        const { fs, extname } = this.options;
        if (this.shouldLoadRelative(file) && currentFile) {
            const referenced = fs.resolve(this.dirname(currentFile), file, extname);
            for (const dir of dirs) {
                if (!enforceRoot || this.contains(dir, referenced)) {
                    // the relatively referenced file is within one of root dirs
                    yield referenced;
                    break;
                }
            }
        }
        for (const dir of dirs) {
            const referenced = fs.resolve(dir, file, extname);
            if (!enforceRoot || this.contains(dir, referenced)) {
                yield referenced;
            }
        }
        if (fs.fallback !== undefined) {
            const filepath = fs.fallback(file);
            if (filepath !== undefined)
                yield filepath;
        }
    }
    dirname(path) {
        const fs = this.options.fs;
        (0, assert_1.assert)(fs.dirname, '`fs.dirname` is required for relative reference');
        return fs.dirname(path);
    }
    lookupError(file, roots) {
        const err = new Error('ENOENT');
        err.message = `ENOENT: Failed to lookup "${file}" in "${roots.join('\t\n')}"`;
        err.code = 'ENOENT';
        return err;
    }
}
exports.Loader = Loader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpcXVpZGpzL2ZzL2xvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtREFBZ0Q7QUFDaEQsMkNBQXVDO0FBVXZDLElBQVksVUFJWDtBQUpELFdBQVksVUFBVTtJQUNwQixtQ0FBcUIsQ0FBQTtJQUNyQixpQ0FBbUIsQ0FBQTtJQUNuQiwyQkFBYSxDQUFBO0FBQ2YsQ0FBQyxFQUpXLFVBQVUsR0FBVixrQkFBVSxLQUFWLGtCQUFVLFFBSXJCO0FBQ0QsTUFBYSxNQUFNO0lBS2pCLFlBQWEsT0FBc0I7UUFDakMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxPQUFPLENBQUMsaUJBQWlCLEVBQUU7WUFDN0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUE7WUFDMUIsSUFBQSxlQUFNLEVBQUMsR0FBRyxFQUFFLDZDQUE2QyxDQUFDLENBQUE7WUFDMUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFLElBQUksR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsd0JBQVcsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ25ILElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLGNBQXNCLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUE7U0FDekY7YUFBTTtZQUNMLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLGNBQXNCLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQTtTQUM1RDtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENB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