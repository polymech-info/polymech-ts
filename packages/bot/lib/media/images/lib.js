"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meta = exports.imageToBase64 = exports.base64ToBuffer = exports.fileAsBuffer = void 0;
const path = require("path");
const fs = require("fs");
const fs_1 = require("@polymech/fs");
const __1 = require("../../..");
const fileAsBuffer = (path) => (0, fs_1.sync)(path, 'buffer') || Buffer.from("-");
exports.fileAsBuffer = fileAsBuffer;
const base64ToBuffer = async (b64string) => Buffer.from(b64string, 'base64');
exports.base64ToBuffer = base64ToBuffer;
const imageToBase64 = async (imagePath) => {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = path.extname(imagePath).slice(1);
        const dataUri = `data:image/${mimeType};base64,${imageBase64}`;
        return dataUri;
    }
    catch (error) {
        throw new Error(`Failed to convert image to base64: ${error}`);
    }
};
exports.imageToBase64 = imageToBase64;
const meta = (file, image) => {
    return new Promise((resolve) => {
        image.metadata().then((meta) => {
            resolve(meta);
        }).catch((e) => {
            __1.logger.error(`Error creating meta data ${file}`);
            resolve(null);
        });
    });
};
exports.meta = meta;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9tZWRpYS9pbWFnZXMvbGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE0QjtBQUM1Qix5QkFBd0I7QUFFeEIscUNBQTJDO0FBQzNDLGdDQUFpQztBQUUxQixNQUFNLFlBQVksR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBQSxTQUFJLEVBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBVyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7QUFBbkYsUUFBQSxZQUFZLGdCQUF1RTtBQUV6RixNQUFNLGNBQWMsR0FBRyxLQUFLLEVBQUUsU0FBaUIsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFBOUUsUUFBQSxjQUFjLGtCQUFnRTtBQUVwRixNQUFNLGFBQWEsR0FBRyxLQUFLLEVBQUUsU0FBaUIsRUFBbUIsRUFBRTtJQUN0RSxJQUFJO1FBQ0EsTUFBTSxXQUFXLEdBQUcsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sT0FBTyxHQUFHLGNBQWMsUUFBUSxXQUFXLFdBQVcsRUFBRSxDQUFDO1FBQy9ELE9BQU8sT0FBTyxDQUFDO0tBQ2xCO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDWixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0tBQ2xFO0FBQ0wsQ0FBQyxDQUFBO0FBVlksUUFBQSxhQUFhLGlCQVV6QjtBQUVNLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQWtCLEVBQWtDLEVBQUU7SUFDN0UsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQzNCLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDakIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDWCxVQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixJQUFJLEVBQUUsQ0FBQyxDQUFBO1lBQ2hELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNqQixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBO0FBVFksUUFBQSxJQUFJLFFBU2hCIn0=