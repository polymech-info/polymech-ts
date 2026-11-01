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
exports.Engine = exports.LiquidEx = exports.getContext = exports.getEngine = exports.dir = void 0;
const path = require("path");
const liquid_1 = require("./liquidjs/liquid");
const liquid_2 = require("./liquid");
const fs_1 = require("./fs");
const yaml_1 = require("yaml");
var dir_1 = require("@plastichub/fs/dir");
Object.defineProperty(exports, "dir", { enumerable: true, get: function () { return dir_1.sync; } });
const read_1 = require("@plastichub/fs/read");
const write_1 = require("@plastichub/fs/write");
const remove_1 = require("@plastichub/fs/remove");
const osr_commons_1 = require("@plastichub/osr-commons");
const js_1 = require("./plugins/js");
const ds_1 = require("./plugins/ds");
const js_2 = require("./plugins/js");
const i18n_1 = require("./plugins/i18n");
const print_1 = require("./plugins/print");
const osr_ai_1 = require("./plugins/osr-ai");
const turndown_1 = require("./plugins/turndown");
const html_1 = require("./plugins/html");
const minclude_1 = require("./plugins/minclude");
const get_1 = require("./plugins/get");
const fs_2 = require("./fs");
const filters_1 = require("./filters");
const index_1 = require("./index");
const js_beautify_1 = require("js-beautify");
const fm = require('front-matter');
let _engine;
const getEngine = () => _engine;
exports.getEngine = getEngine;
const getContext = () => _engine.context;
exports.getContext = getContext;
class LiquidEx extends liquid_1.Liquid {
}
exports.LiquidEx = LiquidEx;
class Engine {
    constructor(options) {
        this.engine = (0, liquid_2.engineDefault)(options);
        this.options = options || {};
        this.expressionCache = {};
        this.global = {};
        this.stats = {
            imports: []
        };
        _engine = this;
    }
    render(sourceFile, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            vars = Object.assign(Object.assign({ targetLanguage: this.options.targetLanguage || 'en', sourceLanguage: this.options.sourceLanguage || 'en', i18n: '${OSR_ROOT}/i18n-store/store-en.json' }, this.options.profile.variables), vars);
            let owner = this;
            let _engine = this.engine;
            _engine.owner = owner;
            this.variables = vars;
            const src = '' + sourceFile;
            const resolveFs = (f) => (0, osr_commons_1.resolve)(f, false, vars);
            let options_ = Object.assign(Object.assign({ fs: (0, fs_2.defaultFS)(resolveFs) }, this.options), { resolve: resolveFs });
            this.options = options_;
            let source = (0, read_1.sync)(sourceFile);
            let tmpFile = (sourceFile + '.tmp').replace('.md', '._md');
            tmpFile = (sourceFile + '.tmp').replace('.html', '._html');
            if (this.options.template && (0, fs_1.exists)(this.options.template)) {
                const template = (0, read_1.sync)(this.options.template, 'string');
                if (!template) {
                    index_1.logger.error(`Invalid template file: ${this.options.template}`);
                    return false;
                }
                source = (0, index_1.substitute)(false, template, Object.assign({ SOURCE: source }, this.variables));
                (0, write_1.sync)(tmpFile, source);
                sourceFile = tmpFile;
            }
            //@todo
            _engine.options['string'] = source;
            (0, ds_1.register)(_engine);
            (0, js_2.register)(_engine);
            (0, i18n_1.register)(_engine);
            (0, osr_ai_1.register)(_engine);
            (0, print_1.register)(_engine);
            (0, minclude_1.register)(_engine);
            (0, get_1.register)(_engine);
            let _fm = { fm: {} };
            try {
                if (fm.test(_engine.options['string'])) {
                    _fm = {
                        fm: fm(_engine.options['string']).attributes,
                        body: fm(_engine.options['string']).body
                    };
                    vars.fm ? _fm.fm = Object.assign(Object.assign({}, vars.fm), _fm.fm) : null;
                }
            }
            catch (e) {
                index_1.logger.error(`Error parsing front matter: ${e.message} : ${sourceFile}`);
            }
            let parsed = yield _engine.parseFile(sourceFile);
            _engine.registerFilter('jseval', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, js_1.runJS)(x, options_, owner, parsed); }));
            _engine.registerFilter('jsexp', x => (0, js_1.runJSExpressionEx)(x, options_, _engine, parsed, _engine, {}, ""));
            _engine.registerFilter('i18n', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, i18n_1.i18n)(x, options_, this, parsed, _engine, {}, ""); }));
            _engine.registerFilter('html', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, html_1.html)(x, options_, this); }));
            _engine.registerFilter('turndown', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, turndown_1.markdown)(x, options_, this); }));
            _engine.registerFilter('pretty', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, html_1.pretty)(x, options_, this); }));
            _engine.registerFilter('openAI', (x) => __awaiter(this, void 0, void 0, function* () { return yield (0, osr_ai_1.openAI)(x, options_, this, parsed, _engine, {}, ""); }));
            let fmChanged = false;
            if (Object.keys(_fm.fm) && Object.keys(_fm.fm).length > 0) {
                for (let k in _fm.fm) {
                    if (k.endsWith('_i18n')) {
                        const val = yield (0, i18n_1.i18n)(_fm.fm[k], options_, this, parsed, _engine, {}, "");
                        if (val) {
                            _fm.fm[k] = val;
                            delete _fm.fm[k];
                            _fm.fm[k.replace('_i18n', '')] = val;
                            fmChanged = true;
                        }
                    }
                }
            }
            fmChanged = true;
            if (fmChanged && _fm.fm && Object.keys(_fm.fm).length > 0) {
                source = '---\n' + (0, yaml_1.stringify)(_fm.fm) + '---\n' + _fm.body;
                (0, write_1.sync)(tmpFile, source);
                sourceFile = tmpFile;
                options_['source'] = tmpFile;
            }
            const childCtx = new liquid_1.Context({}, this.options, {
                sync: false,
                globals: Object.assign(Object.assign(Object.assign({}, _fm.fm), this.variables), { fm: _fm.fm }),
                strictVariables: false,
                ownPropertyOnly: false
            });
            let ret = null;
            debugger;
            try {
                ret = yield _engine.renderFile(sourceFile, childCtx, {
                    globals: Object.assign(Object.assign(Object.assign({}, _fm.fm), this.variables), { fm: _fm.fm })
                });
            }
            catch (e) {
                index_1.logger.error(`Error rendering file: ${sourceFile} \n\t : ${e.message}`);
                (0, remove_1.sync)(tmpFile);
                return false;
            }
            (0, remove_1.sync)(tmpFile);
            options_['source'] = src;
            if (options_.format === 'html') {
                ret = (0, js_beautify_1.html_beautify)((0, filters_1.md2html)(ret));
            }
            if (options_.format === 'pretty') {
                ret = (0, js_beautify_1.html_beautify)(ret);
            }
            if (this.options.trace) {
                const traceFile = resolveFs(this.options.trace);
                (0, write_1.sync)(traceFile, Object.assign(Object.assign({}, this.stats), this.options.profile));
            }
            return ret;
        });
    }
    parse(string, vars, iterations = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            let _engine = this.engine;
            _engine.options['string'] = string;
            let _fm = { fm: {} };
            if (fm.test(_engine.options['string'])) {
                _fm = {
                    fm: fm(_engine.options['string']).attributes
                };
            }
            this.variables = Object.assign(Object.assign({}, vars), _fm.fm);
            let owner = this;
            _engine.owner = this;
            let options_ = Object.assign({ fs: {
                    exists: (f) => {
                        return (0, fs_1.exists)(f);
                    },
                    existsSync: fs_1.existsSync,
                    readFile: (f) => (0, fs_1.readFile)(path.resolve((0, osr_commons_1.resolve)(f))),
                    readFileSync: fs_1.readFileSync,
                    resolve: fs_1.resolve
                } }, this.options);
            (0, ds_1.register)(_engine);
            (0, js_2.register)(_engine);
            (0, minclude_1.register)(_engine);
            let parsed = _engine.parse(string);
            _engine.registerFilter('jseval', x => (0, js_1.runJS)(x, options_, owner, parsed));
            _engine.registerFilter('jsexp', x => (0, js_1.runJSExpression)(x, options_, owner, parsed));
            parsed = _engine.parse(string);
            let t = yield _engine.render(parsed, vars, options_);
            for (let i = 0; i < iterations; i++) {
                t = yield this.engine.render(parsed, vars, options_);
            }
            if (options_.format === 'html') {
                t = (0, js_beautify_1.html_beautify)((0, filters_1.md2html)(t));
            }
            return t;
        });
    }
}
exports.Engine = Engine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL0VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw2QkFBNEI7QUFFNUIsOENBQStEO0FBQy9ELHFDQUF3QztBQUN4Qyw2QkFBMEU7QUFFMUUsK0JBQWdDO0FBRWhDLDBDQUFnRDtBQUF2QywwRkFBQSxJQUFJLE9BQU87QUFDcEIsOENBQWtEO0FBQ2xELGdEQUFvRDtBQUNwRCxrREFBa0Q7QUFDbEQseURBQWlFO0FBRWpFLHFDQUF3RTtBQUN4RSxxQ0FBd0Q7QUFDeEQscUNBQXFEO0FBQ3JELHlDQUErRDtBQUMvRCwyQ0FBMkQ7QUFDM0QsNkNBQXFFO0FBQ3JFLGlEQUE2QztBQUM3Qyx5Q0FBNkM7QUFDN0MsaURBQWlFO0FBQ2pFLHVDQUF1RDtBQUl2RCw2QkFBZ0M7QUFDaEMsdUNBQW1DO0FBQ25DLG1DQUE0QztBQUU1Qyw2Q0FBMkM7QUFDM0MsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBRWxDLElBQUksT0FBZSxDQUFBO0FBQ1osTUFBTSxTQUFTLEdBQUcsR0FBVyxFQUFFLENBQUMsT0FBTyxDQUFBO0FBQWpDLFFBQUEsU0FBUyxhQUF3QjtBQUN2QyxNQUFNLFVBQVUsR0FBRyxHQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFBO0FBQTNDLFFBQUEsVUFBVSxjQUFpQztBQUV4RCxNQUFhLFFBQVMsU0FBUSxlQUFNO0NBRW5DO0FBRkQsNEJBRUM7QUFFRCxNQUFhLE1BQU07SUFDbEIsWUFBWSxPQUFpQjtRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEsc0JBQWEsRUFBQyxPQUFPLENBQWEsQ0FBQTtRQUNoRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFjLENBQUE7UUFDeEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUE7UUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFF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