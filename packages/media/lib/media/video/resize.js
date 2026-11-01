"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resize = exports._resize = exports.resizeFile = exports.meta = void 0;
const path = require("path");
const bluebird = require("bluebird");
const bluebird_1 = require("bluebird");
const sharp = require("sharp");
const __1 = require("../../..");
const exists_1 = require("@polymech/fs/exists");
const move_1 = require("@polymech/fs/move");
const dir_1 = require("@polymech/fs/dir");
const inspect_1 = require("@polymech/fs/inspect");
const lib_1 = require("@polymech/cache/lib");
const constants_1 = require("../../../constants");
const commons_1 = require("@polymech/commons");
const __2 = require("../../");
const meta = (file, image) => {
    return new Promise((resolve, reject) => {
        image.metadata().then((meta) => {
            resolve(meta);
        }).catch((e) => {
            __1.logger.error(`Error creating meta data ${file}`);
            resolve(null);
        });
    });
};
exports.meta = meta;
const resizeFile = async (file, target, onNode = () => { }, options) => {
    const osr_cache = (0, commons_1.OSR_CACHE)();
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }));
    const cached = await (0, lib_1.get_cached)(file, ca_options, constants_1.MODULE_NAME);
    const targetOri = '' + target;
    let inPlace = false;
    if (path.resolve(file) === path.resolve(target)) {
        const parts = path.parse(target);
        target = path.join(parts.dir, parts.name + '_tmp' + parts.ext);
        inPlace = true;
    }
    let image;
    try {
        image = sharp(file);
    }
    catch (e) {
        __1.logger.error(`Error reading file, ${file}`, e);
        return null;
    }
    onNode(image);
    let metaData = await (0, exports.meta)(file, image) || {};
    const percent = options.percent;
    const srcParts = path.parse(file);
    const dstParts = path.parse(target);
    const node = (0, inspect_1.createItem)(file, {
        size: true,
        mime: true
    });
    if (!(0, exists_1.sync)(dstParts.dir)) {
        (0, dir_1.sync)(dstParts.dir);
    }
    if (options.width <= options.minWidth) {
        __1.logger.error(`Error resizing : options.width <= options.minWidth`);
        return;
    }
    if (metaData.width && options.width && options.minWidth) {
        if (metaData.width < options.minWidth) {
            return image;
        }
    }
    if (metaData.height && options.height && options.minHeight) {
        if (metaData.height < options.minHeight) {
            return image;
        }
    }
    if (options.minSize && options.minSize > node.size) {
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
        __1.logger.error(`Error resizing, invalid options for ${file} - no width, height or percent`);
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
            __1.logger.error(`Error writing file out, ${file}`, e);
            return null;
        }
    }
    if (inPlace) {
        const timeout = async (retry) => new Promise((resolve) => {
            setTimeout(resolve, 500 * retry);
        });
        const moveRetry = async (src, dst, retry = 0) => {
            if (retry > 6) {
                __1.logger.error(`Error moving file failed, max retries reached ${src}`);
                return;
            }
            try {
                await (0, move_1.async)(target, targetOri);
            }
            catch (e) {
                if (e.code === 'EPERM') {
                    __1.logger.warn(`Error moving file out, retry ${file}`, e);
                    await timeout(retry);
                    moveRetry(src, dst, retry + 1);
                }
            }
        };
        await moveRetry(file, targetOri);
    }
    options.debug && __1.logger.debug(`Resized Image ${file} to ${targetOri}`);
    return image;
};
exports.resizeFile = resizeFile;
const _resize = async (file, targets, onNode = () => { }, options) => {
    return bluebird_1.Promise.resolve(targets).map((target) => {
        options.verbose && __1.logger.debug(`Resizing ${file} to ${target}`);
        if (options.dry) {
            return bluebird.resolve();
        }
        return (0, exports.resizeFile)(file, target, onNode, options);
    }, { concurrency: 1 });
};
exports._resize = _resize;
const resize = async (options) => {
    let reports = [];
    const onNode = (data) => { reports.push(data); };
    options.verbose && __1.logger.info(`Convert ${options.srcInfo.FILES.length} files `);
    await bluebird_1.Promise.resolve(options.srcInfo.FILES).map((f) => {
        const outputs = (0, __2.targets)(f, options);
        options.verbose && __1.logger.info(`Convert ${f} to `, outputs);
        return (0, exports._resize)(f, outputs, onNode, options);
    }, { concurrency: 1 });
};
exports.resize = resize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS92aWRlby9yZXNpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTRCO0FBQzVCLHFDQUFvQztBQUNwQyx1Q0FBOEM7QUFDOUMsK0JBQThCO0FBRTlCLGdDQUFpQztBQUVqQyxnREFBb0Q7QUFDcEQsNENBQWlEO0FBQ2pELDBDQUE4QztBQUM5QyxrREFBMkQ7QUFFM0QsNkNBRTRCO0FBRTVCLGtEQUUyQjtBQUUzQiwrQ0FBNkM7QUFFN0MsOEJBRWU7QUFFUixNQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxLQUFrQixFQUEyQixFQUFFO0lBQ3RFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbkMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNqQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNYLFVBQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLElBQUksRUFBRSxDQUFDLENBQUE7WUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFUWSxRQUFBLElBQUksUUFTaEI7QUFFTSxNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUE4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBdUIsRUFBd0IsRUFBRTtJQUVySSxNQUFNLFNBQVMsR0FBRyxJQUFBLG1CQUFTLEdBQUUsQ0FBQTtJQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFT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