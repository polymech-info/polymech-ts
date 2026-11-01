"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.Liquid = exports.version = void 0;
const context_1 = require("./context/context");
const underscore_1 = require("./util/underscore");
const loader_1 = require("./fs/loader");
const render_1 = require("./render/render");
const parser_1 = require("./parser/parser");
const value_1 = require("./template/value");
const tags_1 = require("./builtin/tags");
const builtinFilters = require("./builtin/filters");
const tag_map_1 = require("./template/tag/tag-map");
const filter_map_1 = require("./template/filter/filter-map");
const liquid_options_1 = require("./liquid-options");
const async_1 = require("./util/async");
__exportStar(require("./util/error"), exports);
__exportStar(require("./types"), exports);
exports.version = '[VI]{version}[/VI]';
class Liquid {
    constructor(opts = {}) {
        this.options = (0, liquid_options_1.normalize)(opts);
        this.parser = new parser_1.default(this);
        this.renderer = new render_1.Render();
        this.filters = new filter_map_1.FilterMap(this.options.strictFilters, this);
        this.tags = new tag_map_1.TagMap();
        (0, underscore_1.forOwn)(tags_1.default, (conf, name) => this.registerTag((0, underscore_1.snakeCase)(name), conf));
        (0, underscore_1.forOwn)(builtinFilters, (handler, name) => this.registerFilter((0, underscore_1.snakeCase)(name), handler));
    }
    parse(html, filepath) {
        return this.parser.parse(html, filepath);
    }
    _render(tpl, scope, renderOptions) {
        const ctx = new context_1.Context(scope, this.options, renderOptions);
        return this.renderer.renderTemplates(tpl, ctx);
    }
    render(tpl, scope, renderOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, async_1.toPromise)(this._render(tpl, scope, Object.assign(Object.assign({}, renderOptions), { sync: false })));
        });
    }
    renderSync(tpl, scope, renderOptions) {
        return (0, async_1.toValueSync)(this._render(tpl, scope, Object.assign(Object.assign({}, renderOptions), { sync: true })));
    }
    renderToNodeStream(tpl, scope, renderOptions = {}) {
        const ctx = new context_1.Context(scope, this.options, renderOptions);
        return this.renderer.renderTemplatesToNodeStream(tpl, ctx);
    }
    _parseAndRender(html, scope, renderOptions) {
        const tpl = this.parse(html);
        return this._render(tpl, scope, renderOptions);
    }
    parseAndRender(html, scope, renderOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, async_1.toPromise)(this._parseAndRender(html, scope, Object.assign(Object.assign({}, renderOptions), { sync: false })));
        });
    }
    parseAndRenderSync(html, scope, renderOptions) {
        return (0, async_1.toValueSync)(this._parseAndRender(html, scope, Object.assign(Object.assign({}, renderOptions), { sync: true })));
    }
    _parsePartialFile(file, sync, currentFile) {
        return this.parser.parseFile(file, sync, loader_1.LookupType.Partials, currentFile);
    }
    _parseLayoutFile(file, sync, currentFile) {
        return this.parser.parseFile(file, sync, loader_1.LookupType.Layouts, currentFile);
    }
    parseFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, async_1.toPromise)(this.parser.parseFile(file, false));
        });
    }
    parseFileSync(file) {
        return (0, async_1.toValueSync)(this.parser.parseFile(file, true));
    }
    renderFile(file, ctx, renderOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield this.parseFile(file);
            return this.render(templates, ctx, renderOptions);
        });
    }
    renderFileSync(file, ctx, renderOptions) {
        const templates = this.parseFileSync(file);
        return this.renderSync(templates, ctx, renderOptions);
    }
    renderFileToNodeStream(file, scope, renderOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const templates = yield this.parseFile(file);
            return this.renderToNodeStream(templates, scope, renderOptions);
        });
    }
    _evalValue(str, ctx) {
        const value = new value_1.Value(str, this);
        return value.value(ctx, false);
    }
    evalValue(str, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, async_1.toPromise)(this._evalValue(str, ctx));
        });
    }
    evalValueSync(str, ctx) {
        return (0, async_1.toValueSync)(this._evalValue(str, ctx));
    }
    registerFilter(name, filter) {
        this.filters.set(name, filter);
    }
    registerTag(name, tag) {
        this.tags.set(name, tag);
    }
    plugin(plugin) {
        return plugin.call(this, Liquid);
    }
    express() {
        const self = this; // eslint-disable-line
        let firstCall = true;
        return function (filePath, ctx, callback) {
            if (firstCall) {
                firstCall = false;
                const dirs = (0, liquid_options_1.normalizeDirectoryList)(this.root);
                self.options.root.unshift(...dirs);
                self.options.layouts.unshift(...dirs);
                self.options.partials.unshift(...dirs);
            }
            self.renderFile(filePath, ctx).then(html => callback(null, html), callback);
        };
    }
}
exports.Liquid = Liquid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpcXVpZGpzL2xpcXVpZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUEyQztBQUMzQyxrREFBcUQ7QUFFckQsd0NBQXdDO0FBQ3hDLDRDQUF3QztBQUN4Qyw0Q0FBb0M7QUFFcEMsNENBQXdDO0FBQ3hDLHlDQUF3QztBQUN4QyxvREFBbUQ7QUFDbkQsb0RBQStDO0FBQy9DLDZEQUF3RDtBQUN4RCxxREFBeUg7QUFFekgsd0NBQXFEO0FBRXJELCtDQUE0QjtBQUM1QiwwQ0FBdUI7QUFDVixRQUFBLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQTtBQUUzQyxNQUFhLE1BQU07SUFPakIsWUFBb0IsT0FBc0IsRUFBRTtRQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsMEJBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksZUFBTSxFQUFFLENBQUE7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLHNCQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDOUQsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLGdCQUFNLEVBQUUsQ0FBQTtRQUV4QixJQUFBLG1CQUFNLEVBQUMsY0FBVyxFQUFFLENBQUMsSUFBb0IsRUFBRSxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBQSxzQkFBUyxFQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDcEcsSUFBQSxtQkFBTSxFQUFDLGNBQWMsRUFBRSxDQUFDLE9BQTBCLEVBQUUsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMs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