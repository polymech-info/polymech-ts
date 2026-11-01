import path from 'node:path';
import { resolve } from '@polymech/commons';
import { winstonLogger, } from './ai-tools/index.js';
import { getLogger } from './index.js';
export const collector = (options, client) => {
    const loggerIntern = getLogger(options);
    return {
        //OpenAI
        onMessage: (message) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'openai-message.json'));
            const logger = winstonLogger('collector:onMessage', logFile);
            //logger.info(message)
        },
        onToolCall: async (message) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool-call.json'));
            const logger = winstonLogger('collector:onToolCall', logFile);
            try {
                const msg = { ...message, arguments: JSON.parse(message.arguments) };
                //     logger.debug(msg)
            }
            catch (e) {
                //logger.debug(message)
            }
        },
        onFunctionCallResult: (message) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool-call-result.json'));
            const logger = winstonLogger('collector:onFunctionCallResult', logFile);
            try {
                const msg = { message: JSON.parse(message) };
                //logger.debug(msg)
            }
            catch (e) {
                //logger.debug(message)
            }
        },
        onChatCompletion: (message) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'completion.json'));
            const logger = winstonLogger('collector:onChatCompletion', logFile);
            //logger.debug(message)
        },
        onContent: (content) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'content.json'));
            const logger = winstonLogger('collector:onContent', logFile);
            //logger.debug(content)
        },
        onTool(category, name, args, result) {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool.json'));
            const logger = winstonLogger('collector:onTool', logFile);
            logger.debug({ category, name, args, result });
        },
        onToolBefore: async (ctx, args) => {
            try {
                //     loggerIntern.debug(`onToolBefore :${ctx.name}`)
            }
            catch (e) {
                loggerIntern.error(e);
            }
            return args;
        },
        onToolAfter: async (ctx, args, result) => {
            try {
                //loggerIntern.debug(`onToolAfter : ${ctx.name}`)
            }
            catch (e) {
                loggerIntern.error(e);
            }
            return result[0];
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLElBQUksTUFBTSxXQUFXLENBQUE7QUFJNUIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRzNDLE9BQU8sRUFBRSxhQUFhLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQTtBQUVwRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBSXRDLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxDQUFDLE9BQXFCLEVBQUUsTUFBYyxFQUFjLEVBQUU7SUFDM0UsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3ZDLE9BQU87UUFDSCxRQUFRO1FBQ1IsU0FBUyxFQUFFLENBQUMsT0FBbUMsRUFBRSxFQUFFO1lBQy9DLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQTtZQUNyRixNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFDNUQsc0JBQXNCO1FBQzFCLENBQUM7UUFDRCxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQTJDLEVBQUUsRUFBRTtZQUM5RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUE7WUFDaEYsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLHNCQUFzQixFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzdELElBQUksQ0FBQztnQkFDRCxNQUFNLEdBQUcsR0FBRyxFQUFFLEdBQUcsT0FBTyxF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