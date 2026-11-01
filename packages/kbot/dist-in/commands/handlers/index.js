import * as path from 'node:path';
import { TextHandler } from './text-handler.js';
import { AudioHandler } from './audio-handler.js';
import { ImageHandler } from './image-handler.js';
import { sync as exists } from '@polymech/fs/exists';
import { resolve } from '@polymech/commons';
export function createHandlers(options) {
    return [
        new AudioHandler(options),
        new ImageHandler(options),
        new TextHandler(),
    ];
}
import { isFile } from '@polymech/commons';
export async function detectAndHandle(content, options) {
    const handlers = createHandlers(options);
    const contentStr = content.toString().trim();
    const promptPath = options.prompt && options.prompt.length < 4096
        ? path.resolve(resolve(options.prompt, options.alt))
        : '';
    try {
        if (promptPath && isFile(promptPath) && exists(promptPath)) {
            for (const handler of handlers) {
                if (await handler.canHandle(promptPath, true)) {
                    return handler.handle(promptPath, true);
                }
            }
        }
    }
    catch (e) {
        // options.logger?.warn(`Malformed path detected. Treating as content. Error: ${e.message}`);
        // If it's not a valid path, it will throw an error, so we just continue
        console.error(`Malformed path detected. Treating as content. Error: ${e.message}`);
    }
    // Handle as raw content
    for (const handler of handlers) {
        if (await handler.canHandle(contentStr, false)) {
            return handler.handle(contentStr, false);
        }
    }
    throw new Error('No suitable handler found for the input content');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvaGFuZGxlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUE7QUFFakMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQy9DLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUNqRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDakQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUdwRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0MsTUFBTSxVQUFVLGNBQWMsQ0FBQyxPQUFxQjtJQUNsRCxPQUFPO1FBQ0wsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDO1FBQ3pCLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQztRQUN6QixJQUFJLFdBQVcsRUFBRTtLQUNsQixDQUFBO0FBQ0gsQ0FBQztBQUNELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUUzQyxNQUFNLENBQUMsS0FBSyxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLE9BQXFCO0lBQ25GLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUN4QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDN0MsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJO1FBQy9ELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ1AsSUFBSSxDQUFDO1FBQ0gsSUFBSSxVQUFVLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQzNELEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQy9CLElBQUksTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUM5QyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxQyxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLDZGQUE2RjtRQUM3Rix3RUFBd0U7UUFDeEUsT0FBTyxDQUFDLEtBQUssQ0FBQyx3REFBd0QsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVELHdCQUF3QjtJQUN4QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1FBQy9CLElBQUksTUFBTSxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQy9DLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7QUFDckUsQ0FBQyJ9