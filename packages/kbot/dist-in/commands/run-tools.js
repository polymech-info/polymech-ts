import { content } from '../utils/content.js';
import { onCompletion } from './run-completion.js';
export const runTools = async (client, params, options) => {
    const sessionId = Date.now().toString();
    const sessionMessages = {
        sessionId,
        prompt: options.prompt,
        timestamp: new Date().toISOString(),
        messages: []
    };
    if (options.dry) {
        options.logger.info('Dry run - skipping API call');
        return {
            result: 'DRY RUN',
            sessionMessages,
            result_raw: {},
            toolCalls: []
        };
    }
    const logMessage = (message, sessionId, prompt) => {
        return {
            ...message,
            timestamp: new Date().toISOString(),
            sessionId,
            prompt
        };
    };
    let runner = null;
    try {
        runner = await client.chat.completions.runTools(params)
            .on('message', (message) => {
            options.collector.onMessage(logMessage(message, sessionId, options.prompt));
        }) /*
        .on('toolCall', (tool: ChatCompletionMessage.FunctionCall) => {
          return (options.collector as ICollector).onToolCall(logMessage(tool, sessionId, options.prompt))
        })
        .on('toolCallResult', (a) => {
          (options.collector as ICollector).onFunctionCallResult(a)
        })
        */
            .on('chatCompletion', options.collector.onChatCompletion)
            .on('content', options.collector.onContent);
    }
    catch (e) {
        options.logger.trace(e);
    }
    let result = content(runner);
    try {
        result = await runner.finalChatCompletion();
    }
    catch (error) {
        if (error.message.includes("(reading 'map')")) {
            options.logger.error('Failed to complete runner: credits :)', error.message, error.message, error);
            return;
        }
        options.logger.error('Failed to complete runner:', error.message, error.issues);
        return;
    }
    const ret = content(result);
    return await onCompletion(ret, options);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3J1bi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFNQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDN0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRWxELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxLQUFLLEVBQUUsTUFBYyxFQUFFLE1BQVcsRUFBRSxPQUFrQixFQUFFLEVBQUU7SUFDaEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFBO0lBQ3ZDLE1BQU0sZUFBZSxHQUFHO1FBQ3RCLFNBQVM7UUFDVCxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFDdEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQ25DLFFBQVEsRUFBRSxFQUFFO0tBQ2IsQ0FBQTtJQUNELElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUE7UUFDbEQsT0FBTztZQUNMLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLGVBQWU7WUFDZixVQUFVLEVBQUUsRUFBRTtZQUNkLFNBQVMsRUFBRSxFQUFFO1NBQ2QsQ0FBQTtJQUNILENBQUM7SUFDRCxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQVksRUFBRSxTQUFpQixFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQzdELE9BQU87WUFDTCxHQUFHLE9BQU87WUFDVixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7WUFDbkMsU0FBUztZQUNULE1BQU07U0FDUCxDQUFBO0lBQ0gsQ0FBQyxDQUFBO0lBQ0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFBO0lBQ2pCLElBQUksQ0FBQztRQUNILE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUE2QyxDQUFDO2FBQzNGLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFtQyxFQUFFLEVBQUU7WUFDcEQsT0FBTyxDQUFDLFNBQXdCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBQzdGLENBQUMsQ0FBQyxDQUFBOzs7Ozs7O1VBT0E7YUFBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUcsT0FBTyxDQUFDLFNBQXdCLENBQUMsZ0JBQWdCLENBQUM7YUFDMUUsRUFBRSxDQUFDLFNBQVMsRUFBRyxPQUFPLENBQUMsU0FBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUMvRCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDNUIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUE7SUFDN0MsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztZQUM5QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDbEcsT0FBTTtRQUNSLENBQUM7UUFDRCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMvRSxPQUFNO0lBQ1IsQ0FBQztJQUNELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMzQixPQUFPLE1BQU0sWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUN6QyxDQUFDLENBQUEifQ==