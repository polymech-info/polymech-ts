"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = exports._convert = exports.convertFile = void 0;
const path = require("path");
const bluebird = require("bluebird");
const pMap = require("p-map");
const sharp = require("sharp");
const index_1 = require("../../../index");
const commons_1 = require("@polymech/commons");
const exists_1 = require("@polymech/fs/exists");
const dir_1 = require("@polymech/fs/dir");
const lib_1 = require("@polymech/cache/lib");
const __1 = require("../../");
const constants_1 = require("../../../constants");
const convertFile = async (file, target, onNode = () => { }, options) => {
    const osr_cache = (0, commons_1.OSR_CACHE)();
    const ca_options = JSON.parse(JSON.stringify({ ...options, target, skip: null }));
    const cached = await (0, lib_1.get_cached)(file, ca_options, constants_1.MODULE_NAME);
    let image = sharp(file);
    const srcParts = path.parse(file);
    const dstParts = path.parse(target);
    if (!(0, exists_1.sync)(dstParts.dir)) {
        (0, dir_1.sync)(dstParts.dir);
    }
    let ret = await image.withMetadata().toFile(target);
    return ret;
};
exports.convertFile = convertFile;
async function _convert(file, targets, onNode = () => { }, options) {
    return pMap(targets, async (target) => {
        index_1.logger.debug(`Convert ${file} to ${target}`);
        if (options.dry) {
            return bluebird.resolve();
        }
        return (0, exports.convertFile)(file, target, onNode, options);
    }, { concurrency: 1 });
}
exports._convert = _convert;
const convert = async (options) => {
    let reports = [];
    const onNode = (data) => { reports.push(data); };
    index_1.logger.info(`Convert ${options.srcInfo.FILES.length} files `);
    await pMap(options.srcInfo.FILES, (f) => {
        const outputs = (0, __1.targets)(f, options);
        options.verbose && index_1.logger.info(`Convert ${f} to `, outputs);
        return _convert(f, outputs, onNode, options);
    }, { concurrency: 1 });
};
exports.convert = convert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbWVkaWEvaW1hZ2VzL2NvbnZlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTRCO0FBQzVCLHFDQUFvQztBQUNwQyw4QkFBNkI7QUFDN0IsK0JBQThCO0FBQzlCLDBDQUF1QztBQUV2QywrQ0FBNkM7QUFDN0MsZ0RBQW9EO0FBQ3BELDBDQUE4QztBQUM5Qyw2Q0FFNEI7QUFFNUIsOEJBRWU7QUFFZixrREFFMkI7QUFFcEIsTUFBTSxXQUFXLEdBQUcsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBOEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQXVCLEVBQUUsRUFBRTtJQUNoSCxNQUFNLFNBQVMsR0FBRyxJQUFBLG1CQUFTLEdBQUUsQ0FBQTtJQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUNqRixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsZ0JBQVUsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLHVCQUFXLENBQUMsQ0FBQTtJQUM5RCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ25DLElBQUcsQ0FBQyxJQUFBLGFBQU0sRUFBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUM7UUFDckIsSUFBQSxVQUFHLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQ3BCO0lBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ25ELE9BQU8sR0FBRyxDQUFBO0FBQ2QsQ0FBQyxDQUFBO0FBWlksUUFBQSxXQUFXLGVBWXZCO0FBQ00sS0FBSyxVQUFVLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBaUIsRUFBRSxTQUE4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBaUI7SUFDOUcsT0FBTyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNsQyxjQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxPQUFPLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDN0MsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDN0I7UUFDRCxPQUFPLElBQUEsbUJBQVcsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0RCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBUkQsNEJBUUM7QUFFTSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsT0FBaUIsRUFBRSxFQUFFO0lBQy9DLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUNoQixNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQTtJQUMvQyxjQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxTQUFTLENBQUMsQ0FBQTtJQUM3RCxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ25DLE1BQU0sT0FBTyxHQUFHLElBQUEsV0FBTyxFQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUNuQyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMzRCxPQUFPLFFBQVEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNoRCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMxQixDQUFDLENBQUE7QUFUWSxRQUFBLE9BQU8sV0FTbkIifQ==