import { tools } from '../lib/tools/tools.js';
import { logger } from '../index.js';
import { InvokeToolSchema } from '../zod_schemas.js';
import { toYargs } from '@polymech/commons/schemas';
import { sync as write } from '@polymech/fs/write';
import * as path from 'path';
const options = (yargs) => toYargs(yargs, InvokeToolSchema);
export const invoke = async (argv) => {
    try {
        const { tools: toolCategory, function: funcName, target, params, output } = argv;
        // Get tool category
        const toolSet = tools[toolCategory];
        if (!toolSet) {
            logger.error(`Tool category '${toolCategory}' not found`);
            return;
        }
        // Initialize tools with target directory
        const toolList = toolSet(target);
        // Find specific function
        const tool = toolList.find(t => t.function.name === funcName);
        if (!tool) {
            logger.error(`Function '${funcName}' not found in ${toolCategory} tools`);
            return;
        }
        // Parse parameters if provided
        const parameters = params ? JSON.parse(params) : {};
        // Execute tool function
        logger.info(`Invoking ${toolCategory}::${funcName}`);
        const result = await tool.function.function(parameters);
        // Handle output
        if (output) {
            const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
            logger.info(`Writing output to ${outputPath}`);
            write(outputPath, JSON.stringify(result, null, 2));
        }
        else {
            logger.info('Result:', result);
        }
        return result;
    }
    catch (error) {
        logger.error('Error invoking tool:', error);
        throw error;
    }
};
export { options as invokeOptions };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52b2tlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL2ludm9rZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFDN0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNwRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sMkJBQTJCLENBQUE7QUFDbkQsT0FBTyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUVsRCxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUU1QixNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQVcsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBRWxFLE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsSUFBUyxFQUFFLEVBQUU7SUFDdEMsSUFBSSxDQUFDO1FBQ0QsTUFBTSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUVqRixvQkFBb0I7UUFDcEIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNYLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLFlBQVksYUFBYSxDQUFDLENBQUM7WUFDMUQsT0FBTztRQUNYLENBQUM7UUFFRCx5Q0FBeUM7UUFDekMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpDLHlCQUF5QjtRQUN6QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLFFBQVEsa0JBQWtCLFlBQVksUUFBUSxDQUFDLENBQUM7WUFDMUUsT0FBTztRQUNYLENBQUM7UUFFRCwrQkFBK0I7UUFDL0IsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFcEQsd0JBQXdCO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxZQUFZLEtBQUssUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXhELGdCQUFnQjtRQUNoQixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQy9DLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQzthQUFNLENBQUM7WUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLE1BQU0sS0FBSyxDQUFDO0lBQ2hCLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixPQUFPLEVBQUUsT0FBTyxJQUFJLGFBQWEsRUFBRSxDQUFDIn0=