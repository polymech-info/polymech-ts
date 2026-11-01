import { parse, join } from 'path';
import * as fs from 'fs';
import { lookup } from 'mime-types';
import { toolLogger } from '../../index.js';
export const mime = (file = '') => parse(file).ext ? lookup(file) : null;
//const screenshot = require('screenshot-desktop')
export const fileToBase64 = (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = lookup(filePath);
        if (!mimeType) {
            throw new Error('Unable to determine MIME type.');
        }
        const base64Data = fileBuffer.toString('base64');
        return `data:${mimeType};base64,${base64Data}`;
    }
    catch (error) {
        console.error('fileToBase64 : Error reading file:', error);
        return null;
    }
};
export const tools = (target, options) => {
    const logger = toolLogger('user', options);
    return [
        {
            type: 'function',
            function: {
                name: 'capture_screen',
                description: 'Capture a screenshot and store it as file (jpg). Returns the path to the file',
                parameters: {
                    type: 'object',
                    properties: {
                        file: { type: 'string' }
                    },
                    required: ['file']
                },
                function: async (params) => {
                    try {
                        const outputPath = join(target, params.file);
                        const takeScreenshot = async () => {
                            /*
                            return new Promise((resolve, reject) => {
                                screenshot({ format: 'jpg' }).then((img) => {
                                    write(outputPath, img)
                                    resolve({ success: true, path: outputPath})
                                }).catch(reject)
                            })
                            */
                        };
                        const { path } = await takeScreenshot();
                        return {
                            "role": "user",
                            "content": [
                            /*
                            {
                              type: "image_url",
                              image_url: {
                                url: fileToBase64( path),
                              }
                            }
                            */
                            ]
                        };
                    }
                    catch (error) {
                        logger.error('Error capturing screenshot:', error);
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9haS10b29scy9saWIvdG9vbHMvdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQUdsQyxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQTtBQUN4QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBRW5DLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQTtBQUUzQyxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFlLEVBQUUsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7QUFFaEYsa0RBQWtEO0FBRWxELE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLFFBQWdCLEVBQWlCLEVBQUU7SUFDNUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM1QyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDakMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFBO1FBQ3JELENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2hELE9BQU8sUUFBUSxRQUFRLFdBQVcsVUFBVSxFQUFFLENBQUE7SUFDbEQsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFELE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQUNELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQWMsRUFBRSxPQUFrQixFQUFjLEVBQUU7SUFDcEUsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUMxQyxPQUFPO1FBQ0g7WUFDSSxJQUFJLEVBQUUsVUFBVTtZQUNoQixRQUFRLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsV0FBVyxFQUFFLCtFQUErRTtnQkFDNUYsVUFBVSxFQUFFO29CQUNSLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO3FCQUMzQjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUM7aUJBQ3JCO2dCQUNELFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBVyxFQUFFLEVBQUU7b0JBQzVCLElBQUksQ0FBQzt3QkFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDNUMsTUFBTSxjQUFjLEdBQUcsS0FBSyxJQUFtQixFQUFFOzRCQUM3Qzs7Ozs7Ozs4QkFPRTt3QkFDTixDQUFDLENBQUE7d0JBQ0QsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUE7d0JBQ3ZDLE9BQU87NEJBQ0gsTUFBTSxFQUFFLE1BQU07NEJBQ2QsU0FBUyxFQUNQOzRCQUNFOzs7Ozs7OzhCQU9FOzZCQUNIO3lCQUNKLENBQUE7b0JBQ1AsQ0FBQztvQkFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO3dCQUNsQixNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNuRCxPQUFPOzRCQUNILE9BQU8sRUFBRSxLQUFLOzRCQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTzt5QkFDdkIsQ0FBQztvQkFDTixDQUFDO2dCQUNMLENBQUM7Z0JBQ0QsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2FBQ3BCO1NBQ3lCO0tBQ2pDLENBQUM7QUFDTixDQUFDLENBQUMifQ==