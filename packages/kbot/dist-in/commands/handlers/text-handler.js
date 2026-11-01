import { BaseHandler } from './base-handler.js';
import { sync as read } from '@polymech/fs/read';
import * as path from 'node:path';
export class TextHandler extends BaseHandler {
    async canHandle(content, isPath) {
        if (isPath) {
            // For file paths, check file extension
            const ext = path.extname(content).toLowerCase();
            return ['.txt', '.md', '.json', '.js', '.ts'].includes(ext);
        }
        // For raw content, try to decode as UTF-8 text
        try {
            if (Buffer.isBuffer(content)) {
                content.toString('utf8');
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async handle(content, isPath) {
        if (isPath) {
            // Read content from file
            return read(content, 'string');
        }
        // Return raw content as string
        return Buffer.isBuffer(content) ? content.toString('utf8') : content;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1oYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1hbmRzL2hhbmRsZXJzL3RleHQtaGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEtBQUssSUFBSSxNQUFNLFdBQVcsQ0FBQTtBQUVqQyxNQUFNLE9BQU8sV0FBWSxTQUFRLFdBQVc7SUFDMUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUF3QixFQUFFLE1BQWU7UUFDdkQsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNYLHVDQUF1QztZQUN2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQWlCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxRCxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsK0NBQStDO1FBQy9DLElBQUksQ0FBQztZQUNILElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUF3QixFQUFFLE1BQWU7UUFDcEQsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNYLHlCQUF5QjtZQUN6QixPQUFPLElBQUksQ0FBQyxPQUFpQixFQUFFLFFBQVEsQ0FBVyxDQUFDO1FBQ3JELENBQUM7UUFFRCwrQkFBK0I7UUFDL0IsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDdkUsQ0FBQztDQUNGIn0=