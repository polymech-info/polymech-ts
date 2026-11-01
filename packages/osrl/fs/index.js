"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFS = exports.resolve = exports.readFileSync = exports.existsSync = exports.readFile = exports.exists = exports.dir = void 0;
const path = require("path");
const path_1 = require("path");
const fs_1 = require("fs");
var dir_1 = require("@plastichub/fs/dir");
Object.defineProperty(exports, "dir", { enumerable: true, get: function () { return dir_1.sync; } });
const read_1 = require("@plastichub/fs/read");
const read_2 = require("@plastichub/fs/read");
const _ = require("../liquid/underscore");
const exists = (filepath) => statAsync(filepath).then(() => true).catch(() => false);
exports.exists = exists;
const filters_1 = require("../filters");
const plugins_1 = require("../plugins/");
const statAsync = _.promisify(fs_1.stat);
const csv = (file) => {
    let content = (0, read_1.sync)(file);
    return new Promise((resolve) => {
        resolve((0, plugins_1.csvToMarkdown)(content));
    });
};
const plugins = {
    '.csv': csv
};
function readFile(filepath) {
    const parts = path.parse(filepath);
    if (plugins[parts.ext]) {
        return plugins[parts.ext](filepath);
    }
    if (filepath.includes('.md.') || filepath.endsWith('.md')) {
        let content = (0, read_1.sync)(filepath);
        return new Promise((resolve) => {
            resolve((0, filters_1.md2html)(content));
        });
    }
    return (0, read_2.async)(filepath);
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
const defaultFS = (resolve) => {
    return {
        exists: (f) => (0, exports.exists)(f),
        existsSync: existsSync,
        readFile: (f) => readFile(resolve(f)),
        readFileSync: readFileSync,
        resolve
    };
};
exports.defaultFS = defaultFS;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNkJBQTRCO0FBQzVCLCtCQUFzRDtBQUN0RCwyQkFBcUU7QUFFckUsMENBQWdEO0FBQXZDLDBGQUFBLElBQUksT0FBTztBQUNwQiw4Q0FBa0Q7QUFDbEQsOENBQXdEO0FBQ3hELDBDQUF5QztBQUVsQyxNQUFNLE1BQU0sR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQXZGLFFBQUEsTUFBTSxVQUFpRjtBQUVwRyx3Q0FBb0M7QUFDcEMseUNBQTJDO0FBRzNDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsU0FBSSxDQUFDLENBQUE7QUFDbkMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtJQUN6QixJQUFJLE9BQU8sR0FBRyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQVcsQ0FBQztJQUNuQyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDM0IsT0FBTyxDQUFDLElBQUEsdUJBQWEsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFBO0FBRUQsTUFBTSxPQUFPLEdBQUc7SUFDWixNQUFNLEVBQUUsR0FBRztDQUNkLENBQUE7QUFFRCxTQUFnQixRQUFRLENBQUMsUUFBZ0I7SUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDcEIsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdkQsSUFBSSxPQUFPLEdBQUcsSUFBQSxXQUFJLEVBQUMsUUFBUSxDQUFXLENBQUM7UUFDdkMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxJQUFBLGlCQUFPLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxJQUFBLFlBQVMsRUFBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBWkQsNEJBWUM7QUFDRCxTQUFnQixVQUFVLENBQUMsUUFBZ0I7SUFDdkMsSUFBSTtRQUNBLElBQUEsYUFBUSxFQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2xCLE9BQU8sSUFBSSxDQUFBO0tBQ2Q7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE9BQU8sS0FBSyxDQUFBO0tBQ2Y7QUFDTCxDQUFDO0FBUEQsZ0NBT0M7QUFDRCxTQUFnQixZQUFZLENBQUMsUUFBZ0I7SUFDekMsT0FBTyxJQUFBLGlCQUFnQixFQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM3QyxDQUFDO0FBRkQsb0NBRUM7QUFDRCxTQUFnQixPQUFPLENBQUMsSUFBWSxFQUFFLElBQVksRUFBRSxHQUFXO0lBQzNELElBQUksQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLENBQUM7UUFBRSxJQUFJLElBQUksR0FBRyxDQUFBO0lBQy9CLE9BQU8sSUFBQSxjQUFXLEVBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ2xDLENBQUM7QUFIRCwwQkFHQztBQUVNLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDakMsT0FBTztRQUNILE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBQSxjQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQ3hCLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQyxZQUFZLEVBQUUsWUFBWTtRQUMxQixPQUFPO0tBQ1YsQ0FBQTtBQUNMLENBQUMsQ0FBQTtBQVJZLFFBQUEsU0FBUyxhQVFyQiJ9