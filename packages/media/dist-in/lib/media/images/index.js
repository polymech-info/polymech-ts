export * from './resize.js';
export * from './convert.js';
// export * from './watermark.js' // Commented out to avoid naming conflicts with schemas/types functions
import pMap from 'p-map';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { sync as exists } from "@polymech/fs/exists";
import { sync as mkdir } from "@polymech/fs/dir";
import { glob } from 'glob';
import { logger } from '../../../index.js';
import { sanitize } from '../../../_cli.js';
//https://www.lightgalleryjs.com/demos/responsive/
export const GLOB_BASIC = 'png|jpg|tiff|jpeg|webp';
export const GLOB_MIN = '*.{png,jpg,jpeg,PNG,JPG,JPEG}';
import { resize as resizeDefault } from './resize.js';
export const getFormats = (src, folder) => {
    return [{
            src: `${src}/${folder}/${GLOB_MIN}`,
            dist: `${src}/${folder}/webp`,
            format: 'webp',
        }];
};
export const getThumbnailOptions = (src, format) => {
    return [{
            src: `${src}/${GLOB_MIN}`,
            dist: "${SRC_DIR}/${SRC_NAME}_thumb.${FORMAT}",
            format
        }];
};
export const thumbnails = async (options) => {
    options = sanitize(options);
    logger.settings.minLevel = options.logLevel;
    return await resizeDefault(options);
};
export const meta = async (file) => {
    try {
        return await sharp(file).metadata();
    }
    catch (err) {
        logger.error(`Error retrieving meta data for ${file}`, err);
    }
};
export const format = async (formats, options = {
    cache: true,
    png: false
}) => {
    return await pMap(formats, async (format) => {
        mkdir(format.dist);
        let files = glob.sync(format.src);
        return await pMap(files, async (file) => {
            let fileParts = path.parse(file);
            const target = path.resolve(`${format.dist}/${fileParts.name}.${format.format}`);
            if (options.cache !== false && exists(target)) {
                return;
            }
            const image = sharp(file).keepExif();
            const metadata = await image.metadata();
            if (options.png) {
                await image
                    .withMetadata()
                    .png()
                    .toFile(target)
                    .catch(logger.error);
            }
            else {
                await image
                    .withMetadata()
                    .rotate()
                    .toFile(target)
                    .catch(logger.error);
            }
            return metadata;
        });
    });
};
export const getResizePatterns = (product, folder, percent = 20) => {
    return [
        {
            src: `${product}/${folder}/${GLOB_MIN}`,
            dist: `${product}/${folder}/${percent}`,
            percent
        }
    ];
};
export const resize = async (patterns, options = { cache: true }) => {
    return pMap(patterns, async (resize) => {
        if (!fs.existsSync(resize.dist)) {
            mkdir(resize.dist);
        }
        let files = glob.sync(resize.src);
        return await pMap(files, async (file) => {
            let filename = path.basename(file);
            if (options.cache && exists(`${resize.dist}/${filename}`)) {
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
                logger.error(err);
            }
        });
    });
};
export const resizeSharp = async (patterns) => {
    return await pMap(patterns, async (resize) => {
        mkdir(resize.dist);
        let files = glob.sync(resize.src);
        return await pMap(files, async (file) => {
            let filename = path.basename(file);
            const image = sharp(file);
            const metadata = await image.metadata();
            if (exists(`${resize.dist}/${filename}`)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL21lZGlhL2ltYWdlcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxjQUFjLGFBQWEsQ0FBQTtBQUMzQixjQUFjLGNBQWMsQ0FBQTtBQUM1Qix5R0FBeUc7QUFDekcsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBQ3hCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFBO0FBQ3hCLE9BQU8sS0FBSyxNQUFNLE9BQU8sQ0FBQTtBQUl6QixPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sa0JBQWtCLENBQUE7QUFFaEQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQUUzQixPQUFPLEVBQWtCLE1BQU0sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzFELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUUzQyxrREFBa0Q7QUFDbEQsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLHdCQUF3QixDQUFBO0FBRWxELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRywrQkFBK0IsQ0FBQTtBQUV2RCxPQUFPLEVBQUUsTUFBTSxJQUFJLGFBQWEsRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUdyRCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDdEMsT0FBTyxDQUFDO1lBQ0osR0FBRyxFQUFFLEdBQUcsR0FBRyxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUU7WUFDbkMsSUFBSSxFQUFFLEdBQUcsR0FBRyxJQUFJLE1BQU0sT0FBTztZQUM3QixNQUFNLEVBQUUsTUFBTTtTQUNqQixDQUFDLENB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