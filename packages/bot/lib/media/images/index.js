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
exports.resizeSharp = exports.resize = exports.getResizePatterns = exports.format = exports.meta = exports.thumbnails = exports.getThumbnailOptions = exports.getFormats = exports.files = exports.GLOB_MIN = exports.GLOB_BASIC = void 0;
__exportStar(require("./resize"), exports);
__exportStar(require("./convert"), exports);
__exportStar(require("./watermark"), exports);
const pMap = require("p-map");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const exists_1 = require("@polymech/fs/exists");
const dir_1 = require("@polymech/fs/dir");
const fg = require('fast-glob');
const glob = require('glob');
const __1 = require("../../..");
const _cli_1 = require("../../../_cli");
//https://www.lightgalleryjs.com/demos/responsive/
exports.GLOB_BASIC = 'png|jpg|tiff|jpeg|webp';
exports.GLOB_MIN = '*.{png,jpg,jpeg,PNG,JPG,JPEG}';
const resize_1 = require("./resize");
const files = (dir, glob) => fg.sync(glob, {
    dot: true,
    cwd: dir,
    absolute: true
});
exports.files = files;
const getFormats = (src, folder) => {
    return [{
            src: `${src}/${folder}/${exports.GLOB_MIN}`,
            dist: `${src}/${folder}/webp`,
            format: 'webp',
        }];
};
exports.getFormats = getFormats;
const getThumbnailOptions = (src, format) => {
    return [{
            src: `${src}/${exports.GLOB_MIN}`,
            dist: "${SRC_DIR}/${SRC_NAME}_thumb.${FORMAT}",
            format
        }];
};
exports.getThumbnailOptions = getThumbnailOptions;
const thumbnails = async (options) => {
    options = (0, _cli_1.sanitize)(options);
    debugger;
    __1.logger.setSettings({ minLevel: options.logLevel });
    return await (0, resize_1.resize)(options);
};
exports.thumbnails = thumbnails;
const meta = async (file) => {
    try {
        return await sharp(file).metadata();
    }
    catch (err) {
        __1.logger.error(`Error retrieving meta data for ${file}`, err);
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
                    .catch(__1.logger.error);
            }
            else {
                await image
                    .withMetadata()
                    .rotate()
                    .toFile(target)
                    .catch(__1.logger.error);
            }
            return metadata;
        });
    });
};
exports.format = format;
const getResizePatterns = (product, folder, percent = 20) => {
    return [
        {
            src: `${product}/${folder}/${exports.GLOB_MIN}`,
            dist: `${product}/${folder}/${percent}`,
            percent
        }
    ];
};
exports.getResizePatterns = getResizePatterns;
const resize = async (patterns, options = { cache: true }) => {
    return pMap(patterns, async (resize) => {
        if (!fs.existsSync(resize.dist)) {
            (0, dir_1.sync)(resize.dist);
        }
        let files = glob.sync(resize.src);
        return await pMap(files, async (file) => {
            let filename = path.basename(file);
            if (options.cache && (0, exists_1.sync)(`${resize.dist}/${filename}`)) {
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
                __1.logger.error(err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL21lZGlhL2ltYWdlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDJDQUF3QjtBQUN4Qiw0Q0FBeUI7QUFDekIsOENBQTJCO0FBRTNCLDhCQUE2QjtBQUM3Qiw2QkFBNEI7QUFDNUIseUJBQXdCO0FBQ3hCLCtCQUE4QjtBQUU5QixnREFBb0Q7QUFDcEQsMENBQWdEO0FBRWhELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNoQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7QUFFNUIsZ0NBQWlEO0FBQ2pELHdDQUF3QztBQUV4QyxrREFBa0Q7QUFDckMsUUFBQSxVQUFVLEdBQUcsd0JBQXdCLENBQUE7QUFFckMsUUFBQSxRQUFRLEdBQUcsK0JBQStCLENBQUE7QUFFdkQscUNBQWtEO0FBRTNDLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7SUFDOUMsR0FBRyxFQUFFLElBQUk7SUFDVCxHQUFHLEVBQUUsR0FBRztJQUNSLFFBQVEsRUFBRSxJQUFJO0NBQ2pCLENBQUMsQ0FBQTtBQUpXLFFBQUEsS0FBSyxTQUloQjtBQUVLLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQ3RDLE9BQU8sQ0FBQztZQUNKLEdBQUcsRUFBRSxHQUFHLEdBQUcsSUFBSSxNQUFNLElBQUksZ0JBQVEsRUFBRTtZQUNuQyxJQUFJLEVBQUUsR0FBRyxHQUFHLElBQUksTUFBTSxPQUFPO1lBQzdCLE1BQU0sRUFBRSxNQUFNO1NBQ2pCLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQU5ZLFFBQUEsVUFBVSxjQU10QjtBQUVNLE1BQU0sbUJBQW1CLEdB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