"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = void 0;
const FfmpegCommand = require('fluent-ffmpeg');
const meta = async (src) => {
    return new Promise((resolve, reject) => {
        const ff = new FfmpegCommand(src);
        ff.ffprobe(src, (err, metadata) => {
            if (err) {
                //logger.error('Error retrieving metadata:', err)
                reject(err);
            }
            else {
                //logger.info('Successfully retrieved metadata.');
                resolve(metadata);
            }
        });
    });
};
exports.meta = meta;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmZtcGVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9tZWRpYS9mZm1wZWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFBO0FBRXZDLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFXLEVBQXdCLEVBQUU7SUFDNUQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLEVBQUUsR0FBRyxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNqQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUNoQyxJQUFJLEdBQUcsRUFBRTtnQkFDUCxpREFBaUQ7Z0JBQ2pELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNiO2lCQUFNO2dCQUNMLGtEQUFrRDtnQkFDbEQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2FBQ2xCO1FBQ0gsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQWJVLFFBQUEsSUFBSSxRQWFkIn0=