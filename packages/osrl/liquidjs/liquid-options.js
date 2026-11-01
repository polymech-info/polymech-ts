"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDirectoryList = exports.normalize = exports.defaultOptions = void 0;
const underscore_1 = require("./util/underscore");
const lru_1 = require("./cache/lru");
const fs = require("./fs/node");
const operator_1 = require("./render/operator");
const operator_trie_1 = require("./util/operator-trie");
const builtinFilters = require("./builtin/filters");
const types_1 = require("./types");
const filters = new Map();
(0, underscore_1.forOwn)(builtinFilters, (conf, name) => {
    filters.set((0, underscore_1.snakeCase)(name), conf);
});
exports.defaultOptions = {
    root: ['.'],
    layouts: ['.'],
    partials: ['.'],
    relativeReference: true,
    jekyllInclude: false,
    cache: undefined,
    extname: '',
    fs: fs,
    dynamicPartials: true,
    jsTruthy: false,
    trimTagRight: false,
    trimTagLeft: false,
    trimOutputRight: false,
    trimOutputLeft: false,
    greedy: true,
    tagDelimiterLeft: '{%',
    tagDelimiterRight: '%}',
    outputDelimiterLeft: '{{',
    outputDelimiterRight: '}}',
    preserveTimezones: false,
    strictFilters: false,
    strictVariables: false,
    ownPropertyOnly: false,
    lenientIf: false,
    globals: {},
    keepOutputType: false,
    operators: operator_1.defaultOperators,
    operatorsTrie: (0, operator_trie_1.createTrie)(operator_1.defaultOperators)
};
function normalize(options) {
    if (options.hasOwnProperty('operators')) {
        options.operatorsTrie = (0, operator_trie_1.createTrie)(options.operators);
    }
    if (options.hasOwnProperty('root')) {
        if (!options.hasOwnProperty('partials'))
            options.partials = options.root;
        if (!options.hasOwnProperty('layouts'))
            options.layouts = options.root;
    }
    if (options.hasOwnProperty('cache')) {
        let cache;
        if (typeof options.cache === 'number')
            cache = options.cache > 0 ? new lru_1.LRU(options.cache) : undefined;
        else if (typeof options.cache === 'object')
            cache = options.cache;
        else
            cache = options.cache ? new lru_1.LRU(1024) : undefined;
        options.cache = cache;
    }
    options = Object.assign(Object.assign(Object.assign({}, exports.defaultOptions), (options.jekyllInclude ? { dynamicPartials: false } : {})), options);
    if (!options.fs.dirname && options.relativeReference) {
        console.warn('[LiquidJS] `fs.dirname` is required for relativeReference, set relativeReference to `false` to suppress this warning, or provide implementation for `fs.dirname`');
        options.relativeReference = false;
    }
    options.root = normalizeDirectoryList(options.root);
    options.partials = normalizeDirectoryList(options.partials);
    options.layouts = normalizeDirectoryList(options.layouts);
    options.outputEscape = options.outputEscape && getOutputEscapeFunction(options.outputEscape);
    return options;
}
exports.normalize = normalize;
function getOutputEscapeFunction(nameOrFunction) {
    if ((0, underscore_1.isString)(nameOrFunction)) {
        const filterImpl = filters.get(nameOrFunction);
        (0, types_1.assert)((0, underscore_1.isFunction)(filterImpl), `filter "${nameOrFunction}" not found`);
        return filterImpl;
    }
    else {
        (0, types_1.assert)((0, underscore_1.isFunction)(nameOrFunction), '`outputEscape` need to be of type string or function');
        return nameOrFunction;
    }
}
function normalizeDirectoryList(value) {
    let list = [];
    if ((0, underscore_1.isArray)(value))
        list = value;
    if ((0, underscore_1.isString)(value))
        list = [value];
    return list;
}
exports.normalizeDirectoryList = normalizeDirectoryList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlxdWlkLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGlxdWlkanMvbGlxdWlkLW9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0RBQW9GO0FBRXBGLHFDQUFpQztBQUVqQyxnQ0FBK0I7QUFDL0IsZ0RBQStEO0FBQy9ELHdEQUF1RDtBQUN2RCxvREFBbUQ7QUFDbkQsbUNBQW1EO0FBRW5ELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7QUFDekIsSUFBQSxtQkFBTSxFQUFDLGNBQWMsRUFBRSxDQUFDLElBQXVCLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHNCQUFTLEVBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDcEMsQ0FBQyxDQUFDLENBQUE7QUErSFcsUUFBQSxjQUFjLEdBQTBCO0lBQ25ELElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNYLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNkLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQztJQUNmLGlCQUFpQixFQUFFLElBQUk7SUFDdkIsYUFBYSxFQUFFLEtBQUs7SUFDcEIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsT0FBTyxFQUFFLEVBQUU7SUFDWCxFQUFFLEVBQUUsRUFBRTtJQUNOLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLFFBQVEsRUFBRSxLQUFLO0lBQ2YsWUFBWSxFQUFFLEtBQUs7SUFDbkIsV0FBVyxFQUFFLEtBQUs7SUFDbEIsZUFBZSxFQUFFLEtBQUs7SUFDdEIsY0FBYyxFQUFFLEtBQUs7SUFDckIsTUFBTSxFQUFFLElBQUk7SUFDWixnQkFBZ0IsRUFBRSxJQUFJO0lBQ3RCLGlCQUFpQixFQUFFLElBQUk7SUFDdkIsbUJBQW1CLEVBQUUsSUFBSTtJQUN6QixvQkFBb0IsRUFBRSxJQUFJO0lBQzFCLGlCQUFpQixFQUFFLEtBQUs7SUFDeEIs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