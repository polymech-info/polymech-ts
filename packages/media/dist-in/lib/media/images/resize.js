import * as path from 'path';
import pMap from 'p-map';
import sharp from 'sharp';
import { z } from 'zod';
import { sync as exists } from "@polymech/fs/exists";
import { async as move } from "@polymech/fs/move";
import { sync as dir } from "@polymech/fs/dir";
import { createItem as toNode } from "@polymech/fs/inspect";
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons';
import { logger, ERR_PERM_RETRY_DELAY, ERR_PERM_RETRY_MAX } from '../../../index.js';
import { targetsNext } from '../../index.js';
import { meta } from './lib.js';
// Zod Schema for resize options
let schemaMap;
export const ResizeOptionsSchema = (opts) => {
    schemaMap = ZodMetaMap.create();
    schemaMap.add('src', z.string()
        .min(1)
        .describe('FILE|FOLDER|GLOB - Source file(s) to resize'))
        .add('dst', z.string()
        .optional()
        .describe('FILE|FOLDER|GLOB - Destination for resized files'))
        .add('debug', z.boolean()
        .default(false)
        .describe('Enable internal debug messages'))
        .add('alt', z.boolean()
        .default(false)
        .describe('Use alternate tokenizer, & instead of $'))
        .add('dry', z.boolean()
        .default(false)
        .describe('Run without conversion'))
        .add('verbose', z.boolean()
        .default(false)
        .describe('Show internal messages'))
        .add('width', z.number()
        .positive()
        .optional()
        .describe('Resize image width'))
        .add('height', z.number()
        .positive()
        .optional()
        .describe('Resize image height'))
        .add('minHeight', z.number()
        .positive()
        .optional()
        .describe('Resize image minimum height'))
        .add('minWidth', z.number()
        .positive()
        .optional()
        .describe('Resize image minimum width'))
        .add('minSize', z.number()
        .positive()
        .optional()
        .describe('Resize image size (bytes)'))
        .add('percent', z.number()
        .positive()
        .max(1000)
        .optional()
        .describe('Resize image in percent (width)'))
        .add('square', z.boolean()
        .default(false)
        .describe('Fit image within width for 1:1 aspect ratio without cropping'))
        .add('fillColor', z.string()
        .default('white')
        .describe('Fill color for square backgrounds (default: white)'))
        .add('logLevel', z.enum(['warn', 'info', 'debug', 'error'])
        .default('info')
        .describe('Log level: warn, info, debug, error'))
        .add('fit', z.enum(['cover', 'contain', 'fill', 'inside', 'outside'])
        .optional()
        .describe('How the image should be resized to fit both provided dimensions'))
        .add('position', z.union([z.number(), z.string()])
        .optional()
        .describe('Position, gravity or strategy to use when fit is cover or contain'))
        .add('background', z.union([z.string(), z.object({
            r: z.number().min(0).max(255),
            g: z.number().min(0).max(255),
            b: z.number().min(0).max(255),
            alpha: z.number().min(0).max(1).optional()
        })])
        .optional()
        .describe('Background color when using a fit of contain'))
        .add('kernel', z.enum(['nearest', 'cubic', 'mitchell', 'lanczos2', 'lanczos3'])
        .optional()
        .describe('The kernel to use for image reduction'))
        .add('withoutEnlargement', z.boolean()
        .default(false)
        .describe('Do not enlarge if the width or height are already less than the specified dimensions'))
        .add('withoutReduction', z.boolean()
        .default(false)
        .describe('Do not reduce if the width or height are already greater than the specified dimensions'))
        .add('fastShrinkOnLoad', z.boolean()
        .default(true)
        .describe('Take greater advantage of the JPEG and WebP shrink-on-load feature'));
    return schemaMap.root()
        .passthrough()
        .describe('IResizeOptions');
};
export const types = () => {
    generate_interfaces([ResizeOptionsSchema()], 'src/zod_types_resize.ts');
    schemas();
};
export const schemas = () => {
    const schema = ResizeOptionsSchema();
    write([schema], 'schemas_resize.json', 'resize', {});
    // Note: schema_ui.json would need ZodMetaMap.getUISchema() implementation
    if (schemaMap && typeof schemaMap.getUISchema === 'function') {
        import('fs').then(fs => {
            fs.writeFileSync('schema_ui_resize.json', JSON.stringify(schemaMap.getUISchema(), null, 2));
        }).catch(err => {
            console.warn('Could not write UI schema:', err.message);
        });
    }
};
export const resizeFile = async (source, target, onNode = () => { }, options) => {
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
        logger.error(`Error reading file, ${source}`, e);
        return;
    }
    onNode(image);
    let metaData = await meta(source, image) || {};
    const percent = options.percent;
    const dstParts = path.parse(target);
    const node = toNode(source, {
        size: true,
        mime: true
    });
    if (!exists(dstParts.dir)) {
        dir(dstParts.dir);
    }
    if (options.width && options.minWidth && options.width <= options.minWidth) {
        logger.error(`Error resizing : options.width <= options.minWidth`);
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
        if (options.square && options.width) {
            // For square mode, fit image within width maintaining aspect ratio
            // then center on square canvas with fill color
            const squareSize = options.width;
            const fillColor = options.fillColor || 'white';
            // First resize to fit within the square while maintaining aspect ratio
            image = image.resize({
                width: squareSize,
                height: squareSize,
                fit: 'inside', // Fit within bounds without cropping
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background initially
            });
            // Then extend to exact square size with fill color background
            image = image.extend({
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: fillColor
            }).resize({
                width: squareSize,
                height: squareSize,
                fit: 'contain', // Center the image
                background: fillColor
            });
        }
        else {
            image = image.resize({
                width: options.width,
                ...resizeOptions
            });
        }
    }
    else {
        logger.error(`Error resizing, invalid options for ${source} - no width, height or percent`);
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
            logger.error(`Error writing file out, ${source}`, e);
            return;
        }
    }
    if (inPlace) {
        const timeout = async (retry) => new Promise((resolve) => setTimeout(resolve, ERR_PERM_RETRY_DELAY * retry));
        const moveRetry = async (src, dst, retry = 0) => {
            if (retry > ERR_PERM_RETRY_MAX) {
                logger.error(`Error moving file failed, max retries reached ${src}`);
                return;
            }
            try {
                await move(target, targetOri);
            }
            catch (e) {
                if (e.code === 'EPERM') {
                    logger.warn(`Error moving file out, retry ${source}`, e);
                    await timeout(retry);
                    moveRetry(src, dst, retry + 1);
                }
            }
        };
        await moveRetry(source, targetOri);
    }
    logger.debug(`Resized Image ${source} to ${targetOri}`);
    return image;
};
export const _resize = async (file, targets, onNode = () => { }, options) => {
    return pMap(targets, async (target) => {
        logger.debug(`Resizing ${file} to ${target}`);
        if (options.dry) {
            return Promise.resolve();
        }
        return resizeFile(file, target, onNode, options);
    }, { concurrency: 1 });
};
export const resize = async (options) => {
    let reports = [];
    logger.settings.minLevel = options.logLevel || 'info';
    const onNode = (data) => reports.push(data);
    if (options.srcInfo) {
        logger.debug(`Convert ${options.srcInfo.FILES.length} files`);
        return await pMap(options.srcInfo.FILES, async (f) => {
            const outputs = targetsNext(f, options);
            logger.debug(`Convert ${f} to `, outputs);
            return _resize(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        logger.error(`Invalid source info`);
    }
    return reports;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvcmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sSUFBSSxNQUFNLE9BQU8sQ0FBQTtBQUN4QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUE7QUFDekIsT0FBTyxFQUFFLENBQUMsRUFBRSxNQUFNLEtBQUssQ0FBQTtBQUV2QixPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDakQsT0FBTyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUM5QyxPQUFPLEVBQUUsVUFBVSxJQUFJLE1BQU0sRUFBRSxNQUFNLHNCQUFzQixDQUFBO0FBQzNELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFMUUsT0FBTyxFQUNILE1BQU0sRUFDTixvQkFBb0IsRUFDcEIsa0JBQWtCLEVBR3JCLE1BQU0sbUJBQW1CLENBQUE7QUFFMUIsT0FBTyxFQUNILFdBQVcsRUFDZCxNQUFNLGdCQUFnQixDQUFBO0FBRXZCLE9BQU8sRUFDSCxJQUFJLEVBQ1AsTUFBTSxVQUFVLENBQUE7QUFFakIsZ0NBQWdDO0FBQ2hDLElBQUksU0FBUyxDQUFBO0FBRWIsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxJQUFVLEVBQU8sRUFBRTtJQUNuRCxTQUFTLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFBO0lBRS9CLFNBQVMsQ0FBQyxHQUFHLENBQ1QsS0FBSyxFQUNMLENBQUMsQ0FBQyxNQUFNLEVBQUU7U0FDTCxHQUFHLENBQUMsQ0FBQyxD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