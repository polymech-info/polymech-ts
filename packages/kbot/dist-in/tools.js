import { resolve } from '@polymech/commons';
import { sync as exists } from '@polymech/fs/exists';
import * as path from 'node:path';
import { tools as defaultTools } from "./ai-tools/lib/tools/tools.js";
import { logger } from './index.js';
import { after, before } from '@polymech/core/aspects_simple';
export const defaultTemplate = {
    include: [
        "!node_modules/**/*",
        "!dist/**/*",
        "!build/**/*",
        "!coverage/**/*",
        "!*.log",
        "!.kbot",
        "!.git",
        "*"
    ],
    messages: [],
    tools: ['fs', 'git', 'interact', 'terminal', 'search', 'web', 'email', 'user']
};
export const resolve_package_path = (dir) => resolve(path.join(__dirname, dir || ''));
const loadToolFromPath = async (toolPath, target, options) => {
    try {
        const absolutePath = path.resolve(toolPath);
        if (!exists(absolutePath)) {
            logger.warn(`Tool path not found: ${absolutePath}`);
            return null;
        }
        const toolModule = await import(absolutePath);
        if (typeof toolModule.default === 'function') {
            return toolModule.default(target, options);
        }
        else {
            logger.warn(`Invalid tool module at ${toolPath}: no default export function`);
            return null;
        }
    }
    catch (e) {
        logger.error(`Error loading tool from path ${toolPath}:`, e.message);
        return null;
    }
};
export const load = async (options) => {
    const target = path.resolve(options.output || options.path);
    const toolsList = options.tools || defaultTemplate.tools;
    const enabledTools = toolsList.filter(tool => !options.disable.includes(tool));
    const loadedTools = await Promise.all(enabledTools.map(async (tool) => {
        if (defaultTools[tool]) {
            try {
                return defaultTools[tool](target, options);
            }
            catch (e) {
                logger.error(`Error loading built-in tool ${tool}`, e.message);
                return null;
            }
        }
        return loadToolFromPath(tool, target, options);
    }));
    const tools = loadedTools
        .flat()
        .filter((tool) => {
        if (!tool)
            return false;
        if (options.disableTools.includes(tool.function.name))
            return false;
        if (tool.function.name === 'completion')
            return false;
        return true;
    });
    tools.forEach(tool => {
        tool.function.function = before(tool.function.function, options.collector.onToolBefore);
        tool.function.function = after(tool.function.function, options.collector.onToolAfter);
    });
    return tools;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRTNDLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUE7QUFFakMsT0FBTyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFHLE1BQU0sWUFBWSxDQUFBO0FBSXBDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFLN0QsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHO0lBQzNCLE9BQU8sRUFBRTtRQUNMLG9CQUFvQjtRQUNwQixZQUFZO1FBQ1osYUFBYTtRQUNiLGdCQUFnQjtRQUNoQixRQUFRO1FBQ1IsUUFBUTtRQUNSLE9BQU87UUFDUCxHQUFHO0tBQ047SUFDRCxRQUFRLEVBQUUsRUFBRTtJQUNaLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUM7Q0FDakYsQ0FBQTtBQUNELE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLENBQUMsR0FBVyxFQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDckcsTUFBTSxnQkFBZ0IsR0FBRyxLQUFLLEVBQUUsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsT0FBcUIsRUFBRSxFQUFFO0lBQ3ZGLElBQUksQ0FBQztRQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMs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