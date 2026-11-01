import * as path from 'node:path';
import { sync as read } from '@polymech/fs/read';
import { base64 } from './source.js';
export class ImageHandler {
    handle(filePath, relativePath) {
        return {
            role: "user",
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: base64(filePath)
                    }
                }
            ]
        };
    }
}
export class PDFHandler {
    handle(filePath, relativePath) {
        return {
            path: relativePath,
            content: base64(filePath),
            role: "user",
            name: path.parse(filePath).base
        };
    }
}
export class TextHandler {
    handle(filePath, relativePath) {
        return {
            role: "user",
            path: relativePath,
            content: read(filePath).toString()
        };
    }
}
export class MimeHandlerRegistry {
    handlers = new Map();
    registerHandler(mimeType, handler) {
        this.handlers.set(mimeType, handler);
    }
    getHandler(mimeType) {
        // For mime types like 'image/png', try to match 'image/*' if specific type not found
        const [type] = mimeType.split('/');
        return this.handlers.get(mimeType) || this.handlers.get(`${type}/*`) || null;
    }
}
// Create and export a pre-configured registry
export const defaultMimeRegistry = new MimeHandlerRegistry();
// Register default handlers
defaultMimeRegistry.registerHandler('image/*', new ImageHandler());
defaultMimeRegistry.registerHandler('application/pdf', new PDFHandler());
defaultMimeRegistry.registerHandler('text/*', new TextHandler());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZS1oYW5kbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9taW1lLWhhbmRsZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFJaEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQVVwQyxNQUFNLE9BQU8sWUFBWTtJQUN2QixNQUFNLENBQUMsUUFBZ0IsRUFBRSxZQUFvQjtRQUMzQyxPQUFPO1lBQ0wsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLFNBQVMsRUFBRTt3QkFDVCxHQUFHLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQztxQkFDdEI7aUJBQ0Y7YUFDRjtTQUNGLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sVUFBVTtJQUNyQixNQUFNLENBQUMsUUFBZ0IsRUFBRSxZQUFvQjtRQUMzQyxPQUFPO1lBQ0wsSUFBSSxFQUFFLFlBQVk7WUFDbEIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDekIsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJO1NBQ2hDLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sV0FBVztJQUN0QixNQUFNLENBQUMsUUFBZ0IsRUFBRSxZQUFvQjtRQUMzQyxPQUFPO1lBQ0wsSUFBSSxFQUFFLE1BQU07WUFDWixJQUFJLEVBQUUsWUFBWTtZQUNsQixPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRTtTQUNuQyxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLG1CQUFtQjtJQUN0QixRQUFRLEdBQThCLElBQUksR0FBRyxFQUFFLENBQUM7SUFFeEQsZUFBZSxDQUFDLFFBQWdCLEVBQUUsT0FBcUI7UUFDckQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxVQUFVLENBQUMsUUFBZ0I7UUFDekIscUZBQXFGO1FBQ3JGLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztJQUMvRSxDQUFDO0NBQ0Y7QUFFRCw4Q0FBOEM7QUFDOUMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBRTdELDRCQUE0QjtBQUM1QixtQkFBbUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksWUFBWSxFQUFFLENBQUMsQ0FBQztBQUNuRSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ3pFLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDIn0=