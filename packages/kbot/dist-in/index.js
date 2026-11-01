import { platform } from 'node:process';
import path from 'node:path';
const isWindows = platform === 'win32';
import { get_var } from '@polymech/commons';
import { MODULE_NAME } from './constants.js';
import { kbotLogger, createKbotLogger } from './logger.js';
export const logger = kbotLogger;
let _logger = kbotLogger;
export const getLogger = (options) => {
    if (_logger) {
        return _logger;
    }
    _logger = createKbotLogger(MODULE_NAME, 'kbot');
    return _logger;
};
export { run } from './commands/run.js';
export { complete_options, complete_messages, complete_params } from './commands/run.js';
export const module_root = () => path.resolve(path.join(get_var(isWindows ? 'HOMEPATH' : 'HOME'), `.${MODULE_NAME}`));
export const assistant_supported = {
    ".c": "text/x-c",
    ".cpp": "text/x-c++",
    ".cs": "text/x-csharp",
    ".css": "text/css",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".go": "text/x-golang",
    ".html": "text/html",
    ".java": "text/x-java",
    ".js": "text/javascript",
    ".json": "application/json",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    ".php": "text/x-php",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".py": "text/x-python",
    ".rb": "text/x-ruby",
    ".sh": "application/x-sh",
    ".tex": "text/x-tex",
    ".ts": "application/typescript",
    ".txt": "text/plain"
};
export * from './types.js';
export * from './zod_types.js';
export * from './zod_schema.js';
export { E_OPENAI_MODEL } from './models/cache/openai-models.js';
export { E_OPENROUTER_MODEL } from './models/cache/openrouter-models.js';
export { E_OPENROUTER_MODEL_FREE } from './models/cache/openrouter-models-free.js';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUN2QyxPQUFPLElBQUksTUFBTSxXQUFXLENBQUE7QUFDNUIsTUFBTSxTQUFTLEdBQUcsUUFBUSxLQUFLLE9BQU8sQ0FBQTtBQUV0QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDM0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBRzVDLE9BQU8sRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFFMUQsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFnQixVQUFVLENBQUE7QUFFN0MsSUFBSSxPQUFPLEdBQWdCLFVBQVUsQ0FBQTtBQUVyQyxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFrQixFQUFlLEVBQUU7SUFDM0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUNaLE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUM7SUFDRCxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQy9DLE9BQU8sT0FBTyxDQUFBO0FBQ2hCLENBQUMsQ0FBQTtBQUVELE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUN2QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDeEYsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFBO0FBRXJILE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUEyQjtJQUN6RCxJQUFJLEVBQUUsVUFBVTtJQUNoQixNQUFNLEVBQUUsWUFBWTtJQUNwQixLQUFLLEVBQUUsZUFBZTtJQUN0QixNQUFNLEVBQUUsVUFBVTtJQUNsQixNQUFNLEVBQUUsb0JBQW9CO0lBQzVCLE9BQU8sRUFBRSx5RUFBeUU7SUFDbEYsS0FBSyxFQUFFLGVBQWU7SUFDdEIsT0FBTyxFQUFFLFdBQVc7SUFDcEIsT0FBTyxFQUFFLGFBQWE7SUFDdEIsS0FBSyxFQUFFLGlCQUFpQjtJQUN4QixPQUFPLEVBQUUsa0JBQWtCO0lBQzNCLEtBQUssRUFBRSxlQUFlO0lBQ3RCLE1BQU0sRUFBRSxpQkFBaUI7SUFDekIsTUFBTSxFQUFFLFlBQVk7SUFDcEIsT0FBTyxFQUFFLDJFQUEyRTtJQUNwRixLQUFLLEVBQUUsZUFBZTtJQUN0QixLQUFLLEVBQUUsYUFBYTtJQUNwQixLQUFLLEVBQUUsa0JBQWtCO0lBQ3pCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLEtBQUssRUFBRSx3QkFBd0I7SUFDL0IsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQTtBQUNELGNBQWMsWUFBWSxDQUFBO0FBQzFCLGNBQWMsZ0JBQWdCLENBQUE7QUFDOUIsY0FBYyxpQkFBaUIsQ0FBQTtBQUUvQixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0saUNBQWlDLENBQUE7QUFDaEUsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0scUNBQXFDLENBQUE7QUFDeEUsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sMENBQTBDLENBQUEifQ==