import { tools } from '../lib/tools/tools.js'
import { logger } from '../index.js'
import { InvokeToolSchema } from '../zod_schemas.js'
import { toYargs } from '@polymech/commons/schemas'
import { sync as write } from '@polymech/fs/write'
import type { Argv } from 'yargs'
import * as path from 'path'

const options = (yargs: Argv) => toYargs(yargs, InvokeToolSchema);

export const invoke = async (argv: any) => {
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
        } else {
            logger.info('Result:', result);
        }
        
        return result;
    } catch (error) {
        logger.error('Error invoking tool:', error);
        throw error;
    }
};

export { options as invokeOptions };