import { sync as readFS } from '@polymech/fs/read';
import { sync as exists } from '@polymech/fs/exists';
import { onCompletion } from './run-completion.js';
export const runResponses = async (client, params, options) => {
    if (options.dry) {
        options.logger?.info('Dry run - skipping API call');
        return false;
    }
    const input = params.messages
        .map((m) => m.content)
        .join('\n\n');
    const tools = [
        {
            type: 'web_search'
        }
    ];
    const createParams = {
        model: options.model,
        input,
        stream: false,
        parallel_tool_calls: false,
        tools
    };
    if (options.stream) {
        createParams.stream = true;
    }
    if (options.format && typeof options.format === 'string' && exists(options.format)) {
        try {
            const content = readFS(options.format);
            const schema = JSON.parse(content.toString());
            createParams.text = {
                format: {
                    type: 'json_schema',
                    name: 'format',
                    schema,
                    strict: false
                }
            };
        }
        catch (e) {
            options.logger?.error(`Failed to parse format file: ${options.format}`, e);
        }
    }
    try {
        const response = await client.responses.create(createParams);
        if (options.stream) {
            const allEvents = [];
            for await (const event of response) {
                allEvents.push({ event: event.type, data: event });
            }
            //writeFileSync('./tests/research-stream.json', JSON.stringify(allEvents, null, 2))
            //options.logger?.info('Stream logged to ./tests/research-stream.json')
            return;
        }
        if (!response || !response.output_text) {
            return '';
        }
        let result = response.output_text;
        result = await onCompletion(result, options);
        return result;
    }
    catch (e) {
        options.logger?.error('Failed to create response:', e.message);
        return;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLXJlc3BvbnNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9ydW4tcmVzcG9uc2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxNQUFNLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQTtBQUdwRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFFbEQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLEtBQUssRUFBRSxNQUFjLEVBQUUsTUFBVyxFQUFFLE9BQWtCLEVBQUUsRUFBRTtJQUNsRixJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUE7UUFDbkQsT0FBTyxLQUFLLENBQUE7SUFDaEIsQ0FBQztJQUdELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRO1NBQ3hCLEdBQUcsQ0FBQyxDQUFDLENBQTZCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7U0FDakQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRWpCLE1BQU0sS0FBSyxHQUFHO1FBQ1Y7WUFDSSxJQUFJLEVBQUUsWUFBcUI7U0FDOUI7S0FDSixDQUFBO0lBRUQsTUFBTSxZQUFZLEdBQVE7UUFDdEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1FBQ3BCLEtBQUs7UUFDTCxNQUFNLEVBQUUsS0FBSztRQUNiLG1CQUFtQixFQUFFLEtBQUs7UUFDMUIsS0FBSztLQUNSLENBQUE7SUFFRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQixZQUFZLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtJQUM5QixDQUFDO0lBRUQsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLE1BQU0sS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQ2pGLElBQUksQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtZQUM3QyxZQUFZLENBQUMsSUFBSSxHQUFHO2dCQUNoQixNQUFNLEVBQUU7b0JBQ0osSUFBSSxFQUFFLGFBQWE7b0JBQ25CLElBQUksRUFBRSxRQUFRO29CQUNkLE1BQU07b0JBQ04sTUFBTSxFQUFFLEtBQUs7aUJBQ2hCO2FBQ0osQ0FBQTtRQUNMLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsZ0NBQWdDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUM5RSxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLE1BQU8sTUFBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFckUsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDakIsTUFBTSxTQUFTLEdBQVUsRUFBRSxDQUFBO1lBQzNCLElBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNqQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7WUFDdEQsQ0FBQztZQUNELG1GQUFtRjtZQUNuRix1RUFBdUU7WUFDdkUsT0FBTTtRQUNWLENBQUM7UUFFRCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JDLE9BQU8sRUFBRSxDQUFBO1FBQ2IsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUE7UUFDakMsTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUM1QyxPQUFPLE1BQU0sQ0FBQTtJQUNqQixDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNULE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM5RCxPQUFNO0lBQ1YsQ0FBQztBQUNMLENBQUMsQ0FBQSJ9