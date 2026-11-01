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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeSharp = exports.resize = exports.getResizePatterns = exports.format = exports.meta = exports.getFormats = exports.files = exports.GLOB_MIN = exports.GLOB_BASIC = void 0;
__exportStar(require("./resize"), exports);
__exportStar(require("./convert"), exports);
__exportStar(require("./watermark"), exports);
const pMap = require("p-map");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const exists_1 = require("@plastichub/fs/exists");
const dir_1 = require("@plastichub/fs/dir");
const fg = require('fast-glob');
const glob = require('glob');
const index_1 = require("../../../index");
//https://www.lightgalleryjs.com/demos/responsive/
exports.GLOB_BASIC = 'png|jpg|tiff|jpeg|webp';
exports.GLOB_MIN = '*.{png,jpg,jpeg,PNG,JPG,JPEG}';
const files = (dir, glob) => fg.sync(glob, {
    dot: true,
    cwd: dir,
    absolute: true
});
exports.files = files;
const getFormats = (product, folder) => {
    return [{
            src: `${product}/${folder}/${exports.GLOB_MIN}`,
            dist: `${product}/${folder}/webp`,
            format: 'webp',
        }];
};
exports.getFormats = getFormats;
const meta = async (file) => {
    try {
        return await sharp(file).metadata();
    }
    catch (err) {
        index_1.logger.error(`Error retrieving meta data for ${file}`, err);
    }
};
exports.meta = meta;
const format = async (formats, options = {
    cache: true,
    png: false
}) => {
    return await pMap(formats, async (format) => {
        (0, dir_1.sync)(format.dist);
        let files = glob.sync(format.src);
        return await pMap(files, async (file) => {
            let fileParts = path.parse(file);
            const target = path.resolve(`${format.dist}/${fileParts.name}.${format.format}`);
            if (options.cache !== false && (0, exists_1.sync)(target)) {
                return;
            }
            const image = sharp(file).keepExif();
            const metadata = await image.metadata();
            if (options.png) {
                await image
                    .withMetadata()
                    .png()
                    .toFile(target)
                    .catch(index_1.logger.error);
            }
            else {
                await image
                    .withMetadata()
                    .toFile(target)
                    .catch(index_1.logger.error);
            }
            return metadata;
        });
    });
};
exports.format = format;
const getResizePatterns = (product, folder) => {
    return [
        {
            src: `${product}/${folder}/${exports.GLOB_MIN}`,
            dist: `${product}/${folder}/20`,
            percent: 20
        }
    ];
};
exports.getResizePatterns = getResizePatterns;
const resize = async (patterns) => {
    return pMap(patterns, async (resize) => {
        if (!fs.existsSync(resize.dist)) {
            (0, dir_1.sync)(resize.dist);
        }
        let files = glob.sync(resize.src);
        return await pMap(files, async (file) => {
            let filename = path.basename(file);
            if ((0, exists_1.sync)(`${resize.dist}/${filename}`)) {
                return;
            }
            try {
                const image = sharp(file).keepExif().withMetadata();
                const metadata = await image.metadata();
                await image
                    .resize(Math.round(metadata.width * (resize.percent / 100)))
                    .keepExif()
                    .withMetadata()
                    .toFile(`${resize.dist}/${filename}`);
            }
            catch (err) {
                index_1.logger.error(err);
            }
        });
    });
};
exports.resize = resize;
const resizeSharp = async (patterns) => {
    return await pMap(patterns, async (resize) => {
        (0, dir_1.sync)(resize.dist);
        let files = glob.sync(resize.src);
        return await pMap(files, async (file) => {
            let filename = path.basename(file);
            const image = sharp(file);
            const metadata = await image.metadata();
            if ((0, exists_1.sync)(`${resize.dist}/${filename}`)) {
                return metadata;
            }
            try {
                const metadata = await image.metadata();
                await image
                    .resize(Math.round(metadata.width * (resize.percent / 100)))
                    .toFile(`${resize.dist}/${filename}`);
                return metadata;
            }
            catch (err) {
                console.error(err);
            }
        });
    });
};
exports.resizeSharp = resizeSharp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL21lZGlhL2ltYWdlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUF3QjtBQUN4Qiw0Q0FBeUI7QUFDekIsOENBQTJCO0FBRTNCLDhCQUE2QjtBQUM3Qiw2QkFBNEI7QUFDNUIseUJBQXdCO0FBQ3hCLCtCQUE4QjtBQUU5QixrREFBc0Q7QUFDdEQsNENBQWtEO0FBRWxELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNoQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFFNUIsMENBQXVDO0FBRXZDLGtEQUFrRDtBQUNyQyxRQUFBLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQTtBQUVyQyxRQUFBLFFBQVEsR0FBRywrQkFBK0IsQ0FBQTtBQUVoRCxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO0lBQzlDLEdBQUcsRUFBRSxJQUFJO0lBQ1QsR0FBRyxFQUFFLEdBQUc7SUFDUixRQUFRLEVBQUUsSUFBSTtDQUNqQixDQUFDLENBQUE7QUFKVyxRQUFBLEtBQUssU0FJaEI7QUFFSyxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtJQUMxQyxPQUFPLENBQUM7WUFDSixHQUFHLEVBQUUsR0FBRyxPQUFPLElBQUksTUFBTSxJQUFJLGdCQUFRLEVBQUU7WUFDdkMsSUFBSSxFQUFFLEdBQUcsT0FBTyxJQUFJLE1BQU0sT0FBTztZQUNqQyxNQUFNLEVBQUUsTUFBTTtTQUNqQixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFOWSxRQUFBLFVBQVUsY0FNdEI7QUFFTSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7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