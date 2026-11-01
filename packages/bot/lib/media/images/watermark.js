"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watermark = void 0;
const bluebird = require("bluebird");
const bluebird_1 = require("bluebird");
const write_1 = require("@polymech/fs/write");
const index_1 = require("../../../index");
const lib_1 = require("./lib");
const novita_sdk_1 = require("novita-sdk");
const __1 = require("../../");
const removeWatermark = async (file, target, onNode = () => { }, options) => {
    const novitaClient = new novita_sdk_1.NovitaSDK(options.key);
    const params = {
        image_file: await (0, lib_1.imageToBase64)(file)
        //"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD",
    };
    try {
        const wMark = await novitaClient.removeWatermark(params);
        index_1.logger.info(`Watermark removed: ${file} to ${target}`);
        (0, write_1.async)(target, (0, lib_1.base64ToBuffer)(wMark.image_file));
    }
    catch (error) {
        index_1.logger.error(`Failed to remove watermark: ${error.msg}`);
    }
};
const _watermark = async (file, targets, onNode = () => { }, options) => {
    return bluebird_1.Promise.resolve(targets).map((target) => {
        options.verbose && index_1.logger.debug(`Removing Watermark ${file} to ${target}`);
        if (options.dry) {
            return bluebird.resolve();
        }
        return removeWatermark(file, target, onNode, options);
    }, { concurrency: 1 });
};
const watermark = async (options) => {
    // reporting, stub
    let reports = [];
    const onNode = (data) => reports.push(data);
    if (options.srcInfo) {
        options.verbose && index_1.logger.info(`Convert ${options.srcInfo.FILES.length} files`);
        return await bluebird_1.Promise.resolve(options.srcInfo.FILES).map((f) => {
            const outputs = (0, __1.targets)(f, options);
            options.verbose && index_1.logger.info(`Convert ${f} to `, outputs);
            return _watermark(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        options.debug && index_1.logger.error(`Invalid source info`);
    }
};
exports.watermark = watermark;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvd2F0ZXJtYXJrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLHFDQUFvQztBQUNwQyx1Q0FBOEM7QUFLOUMsOENBQW1EO0FBS25ELDBDQUV1QjtBQU92QiwrQkFHYztBQU1kLDJDQUFzQztBQUN0Qyw4QkFBOEM7QUFFOUMsTUFBTSxlQUFlLEdBQUcsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsU0FBOEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQXVCLEVBQUUsRUFBRTtJQUM3RyxNQUFNLFlBQVksR0FBRyxJQUFJLHNCQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQy9DLE1BQU0sTUFBTSxHQUFHO1FBQ1gsVUFBVSxFQUFFLE1BQU0sSUFBQSxtQkFBYSxFQUFDLElBQUksQ0FBQztRQUNyQyx1REFBdUQ7S0FDMUQsQ0FBQTtJQUNELElBQUk7UUFDQSxNQUFNLEtBQUssR0FBRyxNQUFNLFlBQVksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDeEQsY0FBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxPQUFPLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDdEQsSUFBQSxhQUFLLEVBQUMsTUFBTSxFQUFDLElBQUEsb0JBQWMsRUFBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTtLQUNqRDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osY0FBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUE7S0FDM0Q7QUFDTCxDQUFDLENBQUE7QUFFRCxNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQWlCLEVBQUUsU0FBOEIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLE9BQWlCLEVBQUUsRUFBRTtJQUM3RyxPQUFPLGtCQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQzVDLE9BQU8sQ0FBQyxPQUFPLElBQUksY0FBTSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxPQUFPLE1BQU0sRUFBRSxDQUFDLENBQUE7UUFDMUUsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ2IsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUE7U0FDNUI7UUFDRCxPQUFPLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMxRCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtBQUMxQixDQUFDLENBQUE7QUFFTSxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsT0FBaUIsRUFBRSxFQUFFO0lBRWpELGtCQUFrQjtJQUNsQixJQUFJLE9BQU8sR0FBUSxFQUFFLENBQUE7SUFDckIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFTLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDaEQsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxPQUFPLElBQUksY0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sUUFBUSxDQUFDLENBQUE7UUFDL0UsT0FBTyxNQUFNLGtCQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDM0QsTUFBTSxPQUFPLEdBQUcsSUFBQSxXQUFPLEVBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQ25DLE9BQU8sQ0FBQyxPQUFPLElBQUksY0FBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzNELE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2xELENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0tBQ3pCO1NBQU07UUFDSCxPQUFPLENBQUMsS0FBSyxJQUFJLGNBQU0sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQTtLQUN2RDtBQUNMLENBQUMsQ0FBQTtBQWZZLFFBQUEsU0FBUyxhQWVyQiJ9