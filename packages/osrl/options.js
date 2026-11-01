"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.parseProfile = void 0;
const path = require("path");
const constants_1 = require("@plastichub/core/constants");
const read_1 = require("@plastichub/fs/read");
const exists_1 = require("@plastichub/fs/exists");
const primitives_1 = require("@plastichub/core/primitives");
const osr_commons_1 = require("@plastichub/osr-commons");
const _1 = require("./");
const lib_1 = require("./lib/");
const constants_2 = require("./constants");
const parseProfile = (profilePath, profile, options, rel) => {
    var _a;
    profilePath = path.resolve((0, osr_commons_1.resolve)(profilePath, false, profile.variables));
    if (!(0, exists_1.sync)(profilePath)) {
        _1.logger.warn(`Profile file not found: ${profilePath}`);
        return;
    }
    const _profile = (0, read_1.sync)(profilePath, 'json') || { includes: [], variables: {} };
    _profile.includes = _profile.includes || [];
    _profile.variables = _profile.variables || {};
    if (options.env && _profile.env && _profile.env[options.env] && _profile.env[options.env].includes) {
        profile.includes = [
            ...profile.includes,
            ..._profile.includes,
            ..._profile.env[options.env].includes
        ];
    }
    else {
        profile.includes = [
            ...profile.includes,
            ..._profile.includes
        ];
    }
    if (options.env && _profile.env && _profile.env[options.env] && _profile.env[options.env].variables) {
        profile.variables = Object.assign(Object.assign(Object.assign({}, profile.variables), _profile.variables), _profile.env[options.env].variables);
    }
    for (const k in _profile.variables) {
        if ((0, primitives_1.isString)(_profile.variables[k])) {
            _profile.variables[k] = (0, _1.substitute)(false, _profile.variables[k], profile.variables);
        }
    }
    profile.variables = Object.assign(Object.assign(Object.assign({}, profile.variables), _profile.variables), ((_a = _profile.env[options.env]) === null || _a === void 0 ? void 0 : _a.variables) || {});
    for (const k in profile.variables) {
        if ((0, primitives_1.isString)(profile.variables[k])) {
            profile.variables[k] = (0, _1.substitute)(false, profile.variables[k], profile.variables);
        }
    }
    profile.includes = Array.from(new Set(profile.includes));
    profile.includes = [
        ...profile.includes.map((i) => {
            if (!path.isAbsolute(i) && rel && !i.match(constants_1.REGEX_VAR)) {
                return path.resolve(`${rel}/${i}`);
            }
            let ret = (0, osr_commons_1.resolve)(i, false, profile.variables);
            ret = path.resolve((0, _1.substitute)(false, ret, profile.variables));
            return ret;
        })
    ];
    profile.includes = profile.includes.filter((include) => include !== null &&
        include !== '');
    profile.includes = Array.from(new Set(profile.includes));
    return profile;
};
exports.parseProfile = parseProfile;
const parse = (options, argv) => {
    var _a;
    for (const k in argv) {
        if (!(k in options.variables)
            && k !== '_'
            && k !== '$0'
            && k !== 'variables'
            && k !== 'source'
            && k !== 'language'
            && k !== 'envVariables'
            && k !== 'env-variables'
            && k !== 'format'
            && k !== 'profile'
            && k !== 'output'
            && k !== 'plugins'
            && k !== 'dry'
            && k !== 'stdout'
            && k !== 'alt'
            && k !== 'template'
            && k !== 'trace'
            && k !== 'string'
            && k !== 'bootstrap') {
            options.variables[k] = argv[k];
        }
    }
    const variables = Object.assign(Object.assign(Object.assign({}, osr_commons_1.DEFAULT_ROOTS), options.variables), { sourceLanguage: argv.sourceLanguage, targetLanguage: argv.targetLanguage, cwd: ((_a = options.variables) === null || _a === void 0 ? void 0 : _a.cwd) || options.cwd, trace: argv.trace });
    (0, lib_1.resolveConfig)(variables);
    const profile = { variables: Object.assign({}, variables), includes: [] };
    const srcInfo = (0, osr_commons_1.pathInfo)(options.source);
    if (argv.profile) {
        if (typeof argv.profile === 'string') {
            argv.profile = [argv.profile];
        }
        else if ((0, primitives_1.isArray)(argv.profile)) {
            argv.profile = argv.profile;
        }
        else {
            argv.profile = [];
        }
    }
    if (options.source) {
        if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
            options.srcInfo = srcInfo;
            for (const key in srcInfo) {
                if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                    options.variables['SRC_' + key] = srcInfo[key];
                }
            }
        }
        else {
            options.source = path.resolve((0, _1.substitute)(options.alt, options.source, profile.variables));
        }
    }
    if (argv.profile) {
        argv.profile.forEach((p) => (0, exports.parseProfile)(p, profile, options));
    }
    if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
        options.srcInfo = srcInfo;
        for (const key in srcInfo) {
            if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                options.variables['SRC_' + key] = srcInfo[key];
            }
        }
        srcInfo.FILES.forEach((f) => {
            const srcParts = path.parse(f);
            const profilePath = path.resolve(`${srcParts.dir}/${constants_2.PROFILE_FILE_NAME}`);
            if ((0, exists_1.sync)(profilePath)) {
                (0, exports.parseProfile)(profilePath, profile, options, srcParts.dir);
            }
        });
    }
    options.profile = profile;
    if (options.plugins) {
        options.plugins = options.plugins.map((p) => {
            let dir = path.resolve((0, _1.substitute)(false, p, options.variables));
            if ((0, exists_1.sync)(dir)) {
                return dir;
            }
        });
    }
    if (options.output) {
        const out = (0, _1.substitute)(options.alt, options.output, options.variables);
        let targetInfo = (0, osr_commons_1.pathInfo)(out);
        if (options.srcInfo && targetInfo) {
            targetInfo.PATH = options.output;
            for (const key in targetInfo) {
                if (Object.prototype.hasOwnProperty.call(targetInfo, key)) {
                    options.variables['DST_' + key] = targetInfo[key];
                }
            }
            options.targetInfo = targetInfo;
        }
        else {
            options.output = path.resolve((0, _1.substitute)(options.alt, options.output || '', options.variables));
        }
    }
    else {
        options.stdout = true;
    }
    options.pathVariables = options.variables;
    options.sourceLanguage = argv.sourceLanguage || 'en';
    options.targetLanguage = argv.targetLanguage || 'en';
    options.logLevel = argv.logLevel || 'warn';
    return options;
};
exports.parse = parse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy9vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUU1QiwwREFBc0Q7QUFDdEQsOENBQWtEO0FBQ2xELGtEQUFzRDtBQUN0RCw0REFBK0Q7QUFDL0QseURBQW1GO0FBR25GLHlCQUF1QztBQUN2QyxnQ0FBc0M7QUFDdEMsMkNBQStDO0FBRXhDLE1BQU0sWUFBWSxHQUFHLENBQUMsV0FBbUIsRUFBRSxPQUFpQixFQUFFLE9BQWlCLEVBQUUsR0FBWSxFQUFFLEVBQUU7O0lBQ3ZHLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUEscUJBQU8sRUFBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO0lBQzFFLElBQUksQ0FBQyxJQUFBLGFBQU0sRUFBQyxXQUFxQixDQUFDLEVBQUU7UUFDbkMsU0FBTSxDQUFDLElBQUksQ0FBQywyQkFBMkIsV0FBVyxFQUFFLENBQUMsQ0FBQTtRQUNyRCxPQUFNO0tBQ047SUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFBLFdBQUksRUFBQyxXQUFxQixFQUFFLE1BQU0sQ0FBUSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFjLENBQUE7SUFFMUcsUUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtJQUMzQyxRQUFRLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFBO0lBRTdDLElBQUksT0FBTyxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRTtRQUNuRyxPQUFPLENB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