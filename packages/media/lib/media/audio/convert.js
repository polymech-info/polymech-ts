"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = exports._convert = exports.convertFile = exports.converter = exports.CONVERTERS = exports.split = void 0;
const path = require("path");
const pMap = require("p-map");
const commons_1 = require("@polymech/commons");
const exists_1 = require("@polymech/fs/exists");
const dir_1 = require("@polymech/fs/dir");
const lib_1 = require("@polymech/cache/lib");
const __1 = require("../../");
const __2 = require("../../..");
const constants_1 = require("../../../constants");
const ffmpeg_1 = require("../ffmpeg");
const FfmpegCommand = require('fluent-ffmpeg');
const extension = (file) => path.parse(file).ext;
const split = async (src, dst, onNode, options) => {
    try {
        const metadata = await (0, ffmpeg_1.meta)(src);
        const duration = metadata.format.duration;
        if (!duration) {
            __2.logger.error('Unable to determine duration of the audio file.');
            return;
        }
        let startTime = 0;
        let segmentIndex = 1;
        while (startTime < duration) {
            const outputFile = `${dst}/segment_${segmentIndex}.mp3`;
            await new Promise((resolve, reject) => {
                const ff = new FfmpegCommand(src)
                    .setStartTime(startTime)
                    .setDuration(options.interval)
                    .output(outputFile)
                    .on('end', () => {
                    __2.logger.info(`Segment ${segmentIndex} finished.`);
                    resolve();
                })
                    .on('error', (error) => {
                    __2.logger.error(`Error while processing segment ${segmentIndex}:`, error.message);
                    reject(error);
                })
                    .run();
            });
            startTime += options.interval;
            segmentIndex++;
        }
    }
    catch (error) {
        __2.logger.error('Error splitting audio file:', error);
    }
};
exports.split = split;
exports.CONVERTERS = {
    '.mp3': exports.split
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbWVkaWEvYXVkaW8vY29udmVydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBNEI7QUFDNUIsOEJBQTZCO0FBQzdCLCtDQUE2QztBQUM3QyxnREFBb0Q7QUFDcEQsMENBQThDO0FBQzlDLDZDQUFnRDtBQUNoRCw4QkFBZ0M7QUFDaEMsZ0NBQWlDO0FBQ2pDLGtEQUFnRDtBQUdoRCxzQ0FBZ0M7QUFJaEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBRTlDLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQTtBQUVqRCxNQUFNLEtBQUssR0FBRyxLQUFLLEVBQUUsR0FBVyxFQUFFLEdBQVcsRUFBRSxNQUFNLEVBQUUsT0FBNkIsRUFBaUIsRUFBRTtJQUMxRyxJQUFJO1FBQ0EsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLGFBQUksRUFBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQTtRQUN6QyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ1gsVUFBTSxDQUFDLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1lBQ2hFLE9BQU87U0FDVjtRQUVELElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQTtRQUNqQixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUE7UUFFcEIsT0FBTyxTQUFTLEdBQUcsUUFBUSxFQUFFO1lBQ3pCLE1BQU0sVUFBVSxHQUFHLEdBQUcsR0FBRyxZQUFZLFlBQVksTUFBTSxDQUFDO1lBRXhELE1BQU0sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3hDLE1BQU0sRUFBRSxHQUFHLElBQUks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