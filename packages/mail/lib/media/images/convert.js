"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = exports._convert = exports.convertFile = void 0;
const path = require("path");
const bluebird = require("bluebird");
const bluebird_1 = require("bluebird");
const pMap = require("p-map");
const sharp = require("sharp");
const index_1 = require("../../../index");
const osr_cli_commons_1 = require("@plastichub/osr-cli-commons");
const exists_1 = require("@plastichub/fs/exists");
const dir_1 = require("@plastichub/fs/dir");
const lib_1 = require("@plastichub/osr-cache/lib");
const lib_2 = require("./lib");
const constants_1 = require("../../../constants");
const convertFile = async (file, target, onNode = () => { }, options) => {
    const osr_cache = (0, osr_cli_commons_1.OSR_CACHE)();
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
    await bluebird_1.Promise.resolve(options.srcInfo.FILES).map((f) => {
        const outputs = (0, lib_2.targets)(f, options);
        options.verbose && index_1.logger.info(`Convert ${f} to `, outputs);
        return _convert(f, outputs, onNode, options);
    }, { concurrency: 1 });
};
exports.convert = convert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbWVkaWEvaW1hZ2VzL2NvbnZlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQTRCO0FBQzVCLHFDQUFvQztBQUNwQyx1Q0FBOEM7QUFHOUMsOEJBQTZCO0FBQzdCLCtCQUE4QjtBQUM5QiwwQ0FBdUM7QUFFdkMsaUVBQXVEO0FBQ3ZELGtEQUFzRDtBQUN0RCw0Q0FBZ0Q7QUFDaEQsbURBRWtDO0FBRWxDLCtCQUVjO0FBQ2Qsa0RBRTJCO0FBS3BCLE1BQU0sV0FBVyxHQUFHLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFNBQThCLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxPQUF1QixFQUFFLEVBQUU7SUFFaEgsTUFBTSxTQUFTLEdBQUcsSUFBQSwyQkFBUyxHQUFFLENBQUE7SUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDakYsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGdCQUFVLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSx1QkFBVyxDQUFDLENBQUE7SUFDOUQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNuQyxJQUFHLENBQUMsSUFBQSxhQUFNLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFDO1FBQ3JCLElBQUEsVUFBRyxFQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUNwQjtJQUNELElBQUksR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNuRCxPQUFPLEdBQUcsQ0FBQTtBQUNkLENBQUMsQ0FBQTtBQWJZLFFBQUEsV0FBVyxlQWF2QjtBQUNNLEtBQUssVUFBVSxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQWlCLEVBQUUsU0FBOEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQWlCO0lBQzlHLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbEMsY0FBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNiLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzdCO1FBQ0QsT0FBTyxJQUFBLG1CQUFXLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEQsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQVJELDRCQVFDO0FBRU0sTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLE9BQWlCLEVBQUUsRUFBRTtJQUMvQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFDaEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUE7SUFDL0MsY0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sU0FBUyxDQUFDLENBQUE7SUFDN0QsTUFBTSxrQkFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1FBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUEsYUFBTyxFQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUNuQyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMzRCxPQUFPLFFBQVEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNoRCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMxQixDQUFDLENBQUE7QUFUWSxRQUFBLE9BQU8sV0FTbkIifQ==