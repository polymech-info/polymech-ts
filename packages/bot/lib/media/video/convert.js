"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVideoFromImages = exports.merge = exports.convert = exports._convert = exports.convertFile = exports.converter = exports.CONVERTERS = exports.frames = void 0;
const path = require("path");
const pMap = require("p-map");
const commons_1 = require("@polymech/commons");
const exists_1 = require("@polymech/fs/exists");
const dir_1 = require("@polymech/fs/dir");
const lib_1 = require("@polymech/cache/lib");
const __1 = require("../../");
const __2 = require("../../..");
const constants_1 = require("../../../constants");
const video_1 = require("../video");
const FfmpegCommand = require('fluent-ffmpeg');
const extension = (file) => path.parse(file).ext;
const mp3 = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(inputPath);
        ff.noVideo()
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('end', () => {
            resolve();
        })
            .on('error', (error) => {
            reject(error);
        })
            .save(outputPath);
    });
};
const frames = async (src, dst, onNode, options = { fps: 60 }) => {
    const outputDir = path.dirname(dst);
    if (!(0, exists_1.sync)(outputDir)) {
        (0, dir_1.sync)(outputDir);
    }
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(src);
        ff.outputOptions([`-vf fps=${options.fps}`])
            .output(dst)
            .on('end', () => {
            resolve();
        })
            .on('error', (err) => {
            reject(err);
        })
            .run();
    });
};
exports.frames = frames;
exports.CONVERTERS = {
    '.mp3': mp3,
    '.jpg': exports.frames,
};
const converter = (file) => exports.CONVERTERS[extension(file)];
exports.converter = converter;
const convertFile = async (file, target, onNode = () => { }, options) => {
    const osr_cache = (0, commons_1.OSR_CACHE)();
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }));
    const cached = await (0, lib_1.get_cached)(file, ca_options, constants_1.MODULE_NAME);
    const conv = (0, exports.converter)(target);
    if (!conv) {
        __2.logger.error(`No converter found for ${file}`);
        return;
    }
    const dstParts = path.parse(target);
    if (!(0, exists_1.sync)(dstParts.dir)) {
        (0, dir_1.sync)(dstParts.dir);
    }
    const ret = await conv(file, target, onNode, options);
    return ret;
};
exports.convertFile = convertFile;
async function _convert(file, targets, onNode = () => { }, options) {
    return pMap(targets, (target) => {
        options.verbose && __2.logger.debug(`Convert ${file} to ${target}`);
        if (options.dry) {
            return;
        }
        return (0, exports.convertFile)(file, target, onNode, options);
    }, { concurrency: 1 });
}
exports._convert = _convert;
const convert = async (options) => {
    let reports = [];
    const onNode = (data) => { reports.push(data); };
    options.verbose && __2.logger.info(`Convert ${options.srcInfo.FILES.length} files `);
    await pMap(options.srcInfo.FILES, (f) => {
        const outputs = (0, __1.targets)(f, options);
        options.verbose && __2.logger.info(`Convert ${f} to `, outputs);
        return _convert(f, outputs, onNode, options);
    }, { concurrency: 1 });
};
exports.convert = convert;
//ffmpeg -r 30 -i tt-1-audio.mp3 -i tt-1-%03d.jpg out.mp4
const merge = async (options) => {
    let reports = [];
    const onNode = (data) => { reports.push(data); };
    __2.logger.info(`Merge ${options.srcInfo.FILES.length} files `);
    return await (0, exports.createVideoFromImages)(options.srcInfo.PATH, options.dst, onNode, options.audio, {});
};
exports.merge = merge;
const createVideoFromImages = async (src, target, onNode, audio, { frameRate = 30, videoCodec = 'LIBX264', audioCodec = 'AAC', format = 'MP4', }) => {
    return new Promise((resolve, reject) => {
        const dstParts = path.parse(target);
        if (!(0, exists_1.sync)(dstParts.dir)) {
            (0, dir_1.sync)(dstParts.dir);
        }
        const ff = new FfmpegCommand(src);
        //src.forEach((file) => ff.input(file))
        ff.inputOptions('-framerate', 24);
        ff.inputOptions('-pattern_type', 'glob');
        ff.on('progress', (err) => {
            __2.logger.debug('progress:', err);
        }).on('error', (err) => {
            __2.logger.error('Error:', err);
        }).on('end', () => {
            __2.logger.info('Video has been created successfully.');
            resolve(ff);
        });
        audio && ff.addInput(audio);
        ff.videoCodec(video_1.E_Codec[videoCodec])
            .output(target)
            //.outputOptions(['-pix_fmt yuv420p'])
            //.audioCodec(E_AudioCodec[audioCodec])
            .format(video_1.E_Format[format])
            .run();
    });
};
exports.createVideoFromImages = createVideoFromImages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbWVkaWEvdmlkZW8vY29udmVydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBNEI7QUFDNUIsOEJBQTZCO0FBQzdCLCtDQUE2QztBQUM3QyxnREFBb0Q7QUFDcEQsMENBQThDO0FBQzlDLDZDQUFnRDtBQUdoRCw4QkFBZ0M7QUFDaEMsZ0NBQWlDO0FBQ2pDLGtEQUFnRDtBQUVoRCxvQ0FBMEQ7QUFFMUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBRTlDLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQTtBQUN4RCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsU0FBaUIsRUFBRSxVQUFrQixFQUFpQixFQUFFO0lBQ3ZFLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbkMsTUFBTSxFQUFFLEdBQUcsSUFBSSxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDdkMsRUFBRSxDQUFDLE9BQU8sRUFBRTthQUNQLFVBQVUsQ0FBQyxZQUFZLENBQUM7YUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQzthQUNiLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBQ1osT0FBTyxFQUFFLENBQUE7UUFDYixDQUFDLENBQUM7YUFDRCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDbkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUN6QixDQUFDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQTtBQUVNLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxHQUFH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