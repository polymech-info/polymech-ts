"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resize = exports._resize = exports.resizeFile = void 0;
const path = require("path");
const pMap = require("p-map");
const sharp = require("sharp");
const exists_1 = require("@plastichub/fs/exists");
const move_1 = require("@plastichub/fs/move");
const dir_1 = require("@plastichub/fs/dir");
const inspect_1 = require("@plastichub/fs/inspect");
const index_1 = require("../../../index");
const lib_1 = require("./lib");
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
    const srcParts = path.parse(source);
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
    if (percent && metaData.width) {
        image = image.resize({
            width: Math.round(metaData.width * (percent / 100)),
            fastShrinkOnLoad: options.fastShrinkOnLoad,
            withoutEnlargement: options.withoutEnlargement,
            withoutReduction: options.withoutReduction,
            fit: options.fit,
            position: options.position
        });
    }
    else if (options.width || options.height) {
        image = image.resize({
            width: options.width,
            height: options.height,
            fastShrinkOnLoad: options.fastShrinkOnLoad,
            withoutEnlargement: options.withoutEnlargement,
            withoutReduction: options.withoutReduction,
            fit: options.fit,
            position: options.position
        });
    }
    else {
        index_1.logger.error(`Error resizing, invalid options for ${source} - no width, height or percent`);
        return image;
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
    const onNode = (data) => reports.push(data);
    if (options.srcInfo) {
        options.verbose && index_1.logger.info(`Convert ${options.srcInfo.FILES.length} files`);
        return await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = (0, lib_1.targets)(f, options);
            index_1.logger.info(`Convert ${f} to `, outputs);
            return (0, exports._resize)(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        index_1.logger.error(`Invalid source info`);
    }
};
exports.resize = resize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvcmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1Qiw4QkFBNkI7QUFDN0IsK0JBQThCO0FBRTlCLGtEQUFzRDtBQUN0RCw4Q0FBbUQ7QUFDbkQsNENBQWdEO0FBRWhELG9EQUE2RDtBQUU3RCwwQ0FNdUI7QUFFdkIsK0JBR2M7QUFHUCxNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUE4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBdUIsRUFBb0MsRUFBRTtJQUVuSiwrQkFBK0I7SUFDL0IsbUZBQW1GO0lBQ25GLGdFQUFnRTtJQUVoRSxNQUFNLFNBQVMsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFBO0lBRTdCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQTtJQUVuQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUMvQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2hDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzlELE9BQU8sR0FBRyxJQUFJLENBQUE7S0FDakI7SUFFRCxJQUFJLEtBQUssQ0FBQTtJQUNULElBQUk7UUFDQSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0tBQ3hCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDUixjQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUNoRCxPQUFN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