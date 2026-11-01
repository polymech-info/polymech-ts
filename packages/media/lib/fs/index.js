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
exports.resize_images = exports.forward_slash = exports.images = exports.files = exports.write = exports.dir = exports.exists = exports.read = void 0;
const fg = require('fast-glob');
const path = require("path");
const bluebird = require("bluebird");
var read_1 = require("@plastichub/fs/read");
Object.defineProperty(exports, "read", { enumerable: true, get: function () { return read_1.sync; } });
var exists_1 = require("@plastichub/fs/exists");
Object.defineProperty(exports, "exists", { enumerable: true, get: function () { return exists_1.sync; } });
var dir_1 = require("@plastichub/fs/dir");
Object.defineProperty(exports, "dir", { enumerable: true, get: function () { return dir_1.sync; } });
var write_1 = require("@plastichub/fs/write");
Object.defineProperty(exports, "write", { enumerable: true, get: function () { return write_1.sync; } });
const index_1 = require("../process/index");
const IMAGES_GLOB = '*.+(JPG|jpg|png|PNG|gif)';
const files = (dir, glob) => fg.sync(glob, { dot: true, cwd: dir, absolute: true });
exports.files = files;
const images = (source) => (0, exports.files)(source, IMAGES_GLOB);
exports.images = images;
const forward_slash = (path) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
};
exports.forward_slash = forward_slash;
function resize_images(files) {
    return __awaiter(this, void 0, void 0, function* () {
        return bluebird.mapSeries(files, (file) => {
            const inParts = path.parse(file);
            const promise = index_1.Helper.run(inParts.dir, 'convert', [
                `"${inParts.base}"`,
                '-quality 70',
                '-resize 1980',
                '-sharpen 0x1.0',
                `"${inParts.name}${inParts.ext}"`
            ]);
            return promise;
        });
    });
}
exports.resize_images = resize_images;
const jekyllNop = "---\n#jekyll\n---\n";
const frontMatter = /^---[.\r\n]*---/;
//# sourceMappingURL=index.js.map