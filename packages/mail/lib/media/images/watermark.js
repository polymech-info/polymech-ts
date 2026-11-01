"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watermark = void 0;
const bluebird = require("bluebird");
const bluebird_1 = require("bluebird");
const write_1 = require("@plastichub/fs/write");
const index_1 = require("../../../index");
const lib_1 = require("./lib");
const novita_sdk_1 = require("novita-sdk");
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
            const outputs = (0, lib_1.targets)(f, options);
            options.verbose && index_1.logger.info(`Convert ${f} to `, outputs);
            return _watermark(f, outputs, onNode, options);
        }, { concurrency: 1 });
    }
    else {
        options.debug && index_1.logger.error(`Invalid source info`);
    }
};
exports.watermark = watermark;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0ZXJtYXJrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvd2F0ZXJtYXJrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBLHFDQUFvQztBQUNwQyx1Q0FBOEM7QUFLOUMsZ0RBQXFEO0FBS3JELDBDQUl1QjtBQU92QiwrQkFJYztBQU1kLDJDQUFzQztBQUV0QyxNQUFNLGVBQWUsR0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxTQUE4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBdUIsRUFBRSxFQUFFO0lBQzdHLE1BQU0sWUFBWSxHQUFHLElBQUksc0JBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDL0MsTUFBTSxNQUFNLEdBQUc7UUFDWCxVQUFVLEVBQUUsTUFBTSxJQUFBLG1CQUFhLEVBQUMsSUFBSSxDQUFDO1FBQ3JDLHVEQUF1RDtLQUMxRCxDQUFBO0lBQ0QsSUFBSTtRQUNBLE1BQU0sS0FBSyxHQUFHLE1BQU0sWUFBWSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN4RCxjQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUFJLE9BQU8sTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUN0RCxJQUFBLGFBQUssRUFBQyxNQUFNLEVBQUMsSUFBQSxvQkFBYyxFQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0tBQ2pEO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixjQUFNLENBQUMsS0FBSyxDQUFDLCtCQUErQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQTtLQUMzRDtBQUNMLENBQUMsQ0FBQTtBQUVELE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBaUIsRUFBRSxTQUE4QixHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBaUIsRUFBRSxFQUFFO0lBQzdHLE9BQU8sa0JBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDNUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixJQUFJLE9BQU8sTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUMxRSxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtTQUM1QjtRQUNELE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzFELENBQUMsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQzFCLENBQUMsQ0FBQTtBQUVNLE1BQU0sU0FBUyxHQUFHLEtBQUssRUFBRSxPQUFpQixFQUFFLEVBQUU7SUFFakQsa0JBQWtCO0lBQ2xCLElBQUksT0FBTyxHQUFRLEVBQUUsQ0FBQTtJQUNyQixNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNoRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7UUFDakIsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxRQUFRLENBQUMsQ0FBQTtRQUMvRSxPQUFPLE1BQU0sa0JBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUMzRCxNQUFNLE9BQU8sR0FBRyxJQUFBLGFBQU8sRUFBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDbkMsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDM0QsT0FBTyxVQUFVLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDbEQsQ0FBQyxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7S0FDekI7U0FBTTtRQUNILE9BQU8sQ0FBQyxLQUFLLElBQUksY0FBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO0tBQ3ZEO0FBQ0wsQ0FBQyxDQUFBO0FBZlksUUFBQSxTQUFTLGFBZXJCIn0=