"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = exports.imageToBase64 = exports.base64ToBuffer = exports.targets = exports.fileAsBuffer = void 0;
const path = require("path");
const fs = require("fs");
const index_1 = require("../../../index");
const exists_1 = require("@plastichub/fs/exists");
const read_1 = require("@plastichub/fs/read");
const fs_1 = require("@plastichub/osr-commons");
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
            let targetPath = (0, index_1.substitute)(options.alt, variables.DST_PATH, variables);
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
            targetPath = (0, index_1.substitute)(options.alt, variables.DST_PATH, variables);
            if ((0, fs_1.isFile)(f) && (0, exists_1.sync)(f)) {
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
        targets.push(path.resolve((0, fs_1.resolve)(targetPath, options.alt, variables)));
    }
    return targets;
};
exports.targets = targets;
const base64ToBuffer = async (b64string) => {
    return Buffer.from(b64string, 'base64');
};
exports.base64ToBuffer = base64ToBuffer;
const imageToBase64 = async (imagePath) => {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = path.extname(imagePath).slice(1);
        const dataUri = `data:image/${mimeType};base64,${imageBase64}`;
        return dataUri;
    }
    catch (error) {
        throw new Error(`Failed to convert image to base64: ${error}`);
    }
};
exports.imageToBase64 = imageToBase64;
const meta = (file, image) => {
    return new Promise((resolve, reject) => {
        image.metadata().then((meta) => {
            resolve(meta);
        }).catch((e) => {
            console.error(`Error creating meta data ${file}`);
            resolve(null);
        });
    });
};
exports.meta = meta;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvbGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1Qix5QkFBd0I7QUFDeEIsMENBQTJDO0FBRzNDLGtEQUFzRDtBQUN0RCw4Q0FBa0Q7QUFDbEQsdURBQWdFO0FBTXpELE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLEVBQUUsUUFBUSxDQUFXLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUFuRixRQUFBLFlBQVksZ0JBQXVFO0FBRWhHLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDbEIsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFJLFFBQVEsSUFBSSxPQUFPLEdBQUc7UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN0RCxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDN0IsS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUU7UUFDbEIsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztZQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEQ7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDLENBQUE7QUFFTSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQVMsRUFBRSxPQUF1QixFQUFFLEVBQUU7SUFDMUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUM5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNoRCxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUE7SUFDNUIsTUFBTSxHQUFHLEdBQUcs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