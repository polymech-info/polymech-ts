"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forward_slash = exports.files = exports.isFolder = exports.isFile = exports.getExtensions = exports.sizeToString = exports.write = exports.dir = exports.exists = exports.read = void 0;
const fg = require('fast-glob');
var read_1 = require("@plastichub/fs/read");
Object.defineProperty(exports, "read", { enumerable: true, get: function () { return read_1.sync; } });
var exists_1 = require("@plastichub/fs/exists");
Object.defineProperty(exports, "exists", { enumerable: true, get: function () { return exists_1.sync; } });
var dir_1 = require("@plastichub/fs/dir");
Object.defineProperty(exports, "dir", { enumerable: true, get: function () { return dir_1.sync; } });
var write_1 = require("@plastichub/fs/write");
Object.defineProperty(exports, "write", { enumerable: true, get: function () { return write_1.sync; } });
const parseGlob = require('parse-glob');
const GLOB_GROUP_PATTERN = /[!*+?@]\(.*\)/;
const fs = require("fs");
const sizeToString = (bytes, si = true) => {
    var units;
    var u;
    var b = bytes;
    var thresh = si ? 1000 : 1024;
    if (Math.abs(b) < thresh) {
        return b + ' B';
    }
    units = si
        ? ['kB', 'MB', 'GB', 'TB']
        : ['KiB', 'MiB', 'GiB', 'TiB'];
    u = -1;
    do {
        b /= thresh;
        ++u;
    } while (Math.abs(b) >= thresh && u < units.length - 1);
    return b.toFixed(1) + ' ' + units[u];
};
exports.sizeToString = sizeToString;
const getExtensions = (glob) => {
    const match = glob.match(GLOB_GROUP_PATTERN);
    if (match) {
        return glob.substring(match.index + 2, glob.lastIndexOf(')')).split('|');
    }
    else {
        return [parseGlob(glob).path.ext];
    }
};
exports.getExtensions = getExtensions;
const isFile = (src) => {
    let srcIsFile = false;
    try {
        srcIsFile = fs.lstatSync(src).isFile();
    }
    catch (e) {
    }
    return srcIsFile;
};
exports.isFile = isFile;
const isFolder = (src) => {
    let srcIsFolder = false;
    try {
        srcIsFolder = fs.lstatSync(src).isDirectory();
    }
    catch (e) {
    }
    return srcIsFolder;
};
exports.isFolder = isFolder;
const files = (dir, glob, options) => fg.sync(glob, Object.assign({ dot: true, cwd: dir, absolute: true }, options || {}));
exports.files = files;
const forward_slash = (path) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }
    return path.replace(/\\/g, '/');
};
exports.forward_slash = forward_slash;
const jekyllNop = "---\n#jekyll\n---\n";
const frontMatter = /^---[.\r\n]*---/;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL2ZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNoQyw0Q0FBbUQ7QUFBMUMsNEZBQUEsSUFBSSxPQUFRO0FBQ3JCLGdEQUF1RDtBQUE5QyxnR0FBQSxJQUFJLE9BQVU7QUFDdkIsMENBQWlEO0FBQXhDLDBGQUFBLElBQUksT0FBTztBQUNwQiw4Q0FBcUQ7QUFBNUMsOEZBQUEsSUFBSSxPQUFTO0FBRXRCLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtBQUN2QyxNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQTtBQUUxQyx5QkFBd0I7QUFFakIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxLQUFhLEVBQUUsS0FBYyxJQUFJLEVBQUUsRUFBRTtJQUM5RCxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksQ0FBQyxDQUFDO0lBQ04sSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ2QsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUM5QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxFQUFFO1FBQ3RCLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNuQjtJQUNELEtBQUssR0FBRyxFQUFFO1FBQ04sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25DLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNQLEdBQUc7UUFDQyxDQUFDLElBQUksTUFBTSxDQUFDO1FBQ1osRUFBRSxDQUFDLENBQUM7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