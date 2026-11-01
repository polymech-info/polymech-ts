"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resize = exports._resize = exports.resizeFile = void 0;
const path = require("path");
const pMap = require("p-map");
const sharp = require("sharp");
const exists_1 = require("@polymech/fs/exists");
const move_1 = require("@polymech/fs/move");
const dir_1 = require("@polymech/fs/dir");
const inspect_1 = require("@polymech/fs/inspect");
const index_1 = require("../../../index");
const lib_1 = require("./lib");
const __1 = require("../..");
const resizeFile = async (source, target, onNode = () => { }, options) => {
    //const osr_cache = OSR_CACHE()
    //const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }))
    //const cached = await get_cached(file, ca_options, MODULE_NAME)
    const targetOri = '' + target;
    let inPlace = false;
    if (path.resolve(source) === path.resolve(target)) {
        const parts = path.parse(target);
        target = path.join(parts.dir, parts.name + '_tmp' + parts.ext);
        inPlace = true;
    }
    let image;
    try {
        image = sharp(source);
    }
    catch (e) {
        index_1.logger.error(`Error reading file, ${source}`, e);
        return;
    }
    onNode(image);
    let metaData = await (0, lib_1.meta)(source, image) || {};
    const percent = options.percent;
    const dstParts = path.parse(target);
    const node = (0, inspect_1.createItem)(source, {
        size: true,
        mime: true
    });
    if (!(0, exists_1.sync)(dstParts.dir)) {
        (0, dir_1.sync)(dstParts.dir);
    }
    if (options.width && options.minWidth && options.width <= options.minWidth) {
        index_1.logger.error(`Error resizing : options.width <= options.minWidth`);
        return;
    }
    if (metaData.width && options.width && options.minWidth) {
        if (metaData.width <= options.minWidth) {
            return image;
        }
    }
    if (metaData.height && options.height && options.minHeight) {
        if (metaData.height <= options.minHeight) {
            return image;
        }
    }
    if (options.minSize && node.size && options.minSize >= node.size) {
        return image;
    }
    const resizeOptions = {
        height: options.height,
        fastShrinkOnLoad: options.fastShrinkOnLoad,
        withoutEnlargement: options.withoutEnlargement,
        withoutReduction: options.withoutReduction,
        fit: options.fit,
        position: options.position,
        background: options.background || 'white'
    };
    if (percent && metaData.width) {
        image = image.resize({
            width: Math.round(metaData.width * (percent / 100)),
            ...resizeOptions
        });
    }
    else if (options.width || options.height) {
        image = image.resize({
            width: options.width,
            ...resizeOptions
        });
    }
    else {
        index_1.logger.error(`Error resizing, invalid options for ${source} - no width, height or percent`);
        return image;
    }
    if (dstParts.ext.toLowerCase() === '.webp' ||
        dstParts.ext.toLowerCase() === '.png') {
        image = image.rotate();
    }
    if (metaData.width) {
        await image.withMetadata().toFile(target);
    }
    else {
        try {
            await image.toFile(target);
        }
        catch (e) {
            index_1.logger.error(`Error writing file out, ${source}`, e);
            return;
        }
    }
    if (inPlace) {
        const timeout = async (retry) => new Promise((resolve) => setTimeout(resolve, index_1.ERR_PERM_RETRY_DELAY * retry));
        const moveRetry = async (src, dst, retry = 0) => {
            if (retry > index_1.ERR_PERM_RETRY_MAX) {
                index_1.logger.error(`Error moving file failed, max retries reached ${src}`);
                return;
            }
            try {
                await (0, move_1.async)(target, targetOri);
            }
            catch (e) {
                if (e.code === 'EPERM') {
                    index_1.logger.warn(`Error moving file out, retry ${source}`, e);
                    await timeout(retry);
                    moveRetry(src, dst, retry + 1);
                }
            }
        };
        await moveRetry(source, targetOri);
    }
    index_1.logger.debug(`Resized Image ${source} to ${targetOri}`);
    return image;
};
exports.resizeFile = resizeFile;
const _resize = async (file, targets, onNode = () => { }, options) => {
    return pMap(targets, async (target) => {
        index_1.logger.debug(`Resizing ${file} to ${target}`);
        if (options.dry) {
            return Promise.resolve();
        }
        return (0, exports.resizeFile)(file, target, onNode, options);
    }, { concurrency: 1 });
};
exports._resize = _resize;
const resize = async (options) => {
    let reports = [];
    index_1.logger.setSettings({ minLevel: options.logLevel || 'info' });
    const onNode = (data) => reports.push(data);
    if (options.srcInfo) {
        index_1.logger.debug(`Convert ${options.srcInfo.FILES.length} files`);
        return await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = (0, __1.targetsNext)(f, options);
            index_1.logger.debug(`Convert ${f} to `, outputs);
            return (0, exports._resize)(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        index_1.logger.error(`Invalid source info`);
    }
    return reports;
};
exports.resize = resize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvcmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1Qiw4QkFBNkI7QUFDN0IsK0JBQThCO0FBRTlCLGdEQUFvRDtBQUNwRCw0Q0FBaUQ7QUFDakQsMENBQThDO0FBQzlDLGtEQUEyRDtBQUUzRCwwQ0FNdUI7QUFFdkIsK0JBRWM7QUFFZCw2QkFHYztBQUdQLE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxNQUFjLEVBQUUsTUFBYyxFQUFFLFNBQXNDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxPQUF1QixFQUFvQyxFQUFFO0lBQzNLLCtCQUErQjtJQUMvQixtRkFBbUY7SUFDbkYsZ0VBQWdFO0lBQ2hFLE1BQU0sU0FBUyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUE7SUFDN0IsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFBO0lBQ25CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQy9DLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDaEMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDOUQsT0FBTyxHQUFHLElBQUksQ0FBQTtLQUNqQjtJQUVELElBQUksS0FBa0IsQ0FBQTtJQUN0QixJQUFJO1FBQ0EsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtLQUN4QjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1IsY0FBTSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENB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