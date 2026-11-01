"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.targetsNext = exports.targets = exports.fileAsBuffer = void 0;
const path = require("path");
const exists_1 = require("@polymech/fs/exists");
const read_1 = require("@polymech/fs/read");
const commons_1 = require("@polymech/commons");
const commons_2 = require("@polymech/commons");
const fileAsBuffer = (path) => (0, read_1.sync)(path, 'buffer') || Buffer.from("-");
exports.fileAsBuffer = fileAsBuffer;
const clone = (obj) => {
    if (null == obj || "object" != typeof obj)
        return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
};
const targets = (f, options) => {
    const srcParts = path.parse(f);
    const variables = clone(options.variables || {});
    const targets = [];
    const rel = path.relative(options.srcInfo.DIR, srcParts.dir);
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            let targetPath = (0, commons_2.substitute)(options.alt, variables.DST_PATH, variables);
            targetPath = targetPath.replace(variables.DST_GLOB, '');
            if (variables.DST_FILE_EXT) {
                targetPath = targetPath.replace('.' + variables.DST_FILE_EXT, '');
            }
            const parts = path.parse(targetPath);
            //back compat
            if (variables.DST_NAME === '*') {
                variables.DST_NAME = '';
            }
            if (!parts.ext) {
                if (variables.DST_PATH.indexOf(`{SRC_NAME}`) === -1) {
                    targetPath = path.join(targetPath, rel, srcParts.name + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e);
                }
                else {
                    targetPath = targetPath + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e;
                }
            }
            //src.base contains dots
            if (!targetPath.endsWith('.' + e)) {
                targetPath += '.' + e;
            }
            targets.push(path.resolve(targetPath));
        });
    }
    else {
        let targetPath = '';
        if (!variables.DST_PATH) {
            targetPath = path.join(srcParts.dir, srcParts.base);
        }
        else {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            targetPath = (0, commons_2.substitute)(options.alt, variables.DST_PATH, variables);
            if ((0, commons_1.isFile)(f) && (0, exists_1.sync)(f)) {
                // targetPath = path.join(targetPath, srcParts.base)
            }
            else {
                targetPath = path.join(targetPath, srcParts.base);
            }
            const targetParts = path.parse(targetPath);
            if (!targetParts.ext) {
                targetPath = path.join(targetPath, srcParts.base);
            }
        }
        targets.push(path.resolve((0, commons_1.resolve)(targetPath, options.alt, variables)));
    }
    return targets;
};
exports.targets = targets;
const targetsNext = (f, options) => {
    const srcParts = path.parse(f);
    const variables = clone(options.variables || {});
    const targets = [];
    const rel = path.relative(options.srcInfo.DIR, srcParts.dir);
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            let targetPath = (0, commons_2.substitute)(options.alt, variables.DST_PATH, variables);
            targetPath = targetPath.replace(variables.DST_GLOB, '');
            if (variables.DST_FILE_EXT) {
                targetPath = targetPath.replace('.' + variables.DST_FILE_EXT, '');
            }
            const parts = path.parse(targetPath);
            //back compat
            if (variables.DST_NAME === '*') {
                variables.DST_NAME = '';
            }
            if (!parts.ext) {
                if (variables.DST_PATH.indexOf(`{SRC_NAME}`) === -1) {
                    targetPath = path.join(targetPath, rel, srcParts.name + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e);
                }
                else {
                    targetPath = targetPath + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e;
                }
            }
            //src.base contains dots
            if (!targetPath.endsWith('.' + e)) {
                targetPath += '.' + e;
            }
            targets.push(path.resolve(targetPath));
        });
    }
    else {
        let targetPath = '';
        if (!variables.DST_PATH) {
            targetPath = path.join(srcParts.dir, srcParts.base);
        }
        else {
            variables.SRC_NAME = srcParts.name;
            variables.SRC_DIR = srcParts.dir;
            variables.SRC_DIR = srcParts.dir;
            targetPath = (0, commons_2.substitute)(options.alt, variables.DST_PATH, variables);
            if ((0, commons_1.isFile)(f) && (0, exists_1.sync)(f)) {
                // targetPath = path.join(targetPath, srcParts.base)
            }
            else {
                targetPath = path.join(targetPath, srcParts.base);
            }
            const targetParts = path.parse(targetPath);
            if (!targetParts.ext) {
                targetPath = path.join(targetPath, srcParts.base);
            }
        }
        targets.push(path.resolve((0, commons_1.resolve)(targetPath, options.alt, variables)));
    }
    return targets;
};
exports.targetsNext = targetsNext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1QixnREFBb0Q7QUFDcEQsNENBQWdEO0FBQ2hELCtDQUFtRDtBQUVuRCwrQ0FBOEM7QUFHdkMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRSxDQUFDLElBQUEsV0FBSSxFQUFDLElBQUksRUFBRSxRQUFRLENBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQW5GLFFBQUEsWUFBWSxnQkFBdUU7QUFFaEcsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUNsQixJQUFJLElBQUksSUFBSSxHQUFHLElBQUksUUFBUSxJQUFJLE9BQU8sR0FBRztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBQ3RELElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QixLQUFLLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRTtRQUNsQixJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO1lBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN4RDtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQTtBQUVNLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBUyxFQUFFLE9BQXVCLEVBQUUsRUFBRTtJQUMxRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzlCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELE1BQU0sT0FBTyxHQUFhLEVBQUUsQ0FBQTtJQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FB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