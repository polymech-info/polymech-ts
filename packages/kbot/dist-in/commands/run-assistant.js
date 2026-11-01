import * as path from 'node:path';
import * as fs from 'node:fs';
import { logger } from '../index.js';
import { onCompletion } from './run-completion.js';
import { glob } from '../glob.js';
import { prompt } from '../prompt.js';
export const supported = {
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
    ".py": "text/x-python", // sometimes text/x-script.python
    ".rb": "text/x-ruby",
    ".sh": "application/x-sh",
    ".tex": "text/x-tex",
    ".ts": "application/typescript",
    ".txt": "text/plain"
};
export const createOpenAIFile = async (client, filePath, purpose = 'assistants') => {
    return client.files.create({
        file: fs.createReadStream(filePath),
        purpose: purpose
    });
};
/*
class EventHandler extends EventEmitter {
  constructor(client) {
    super();
    // this.client = client;
  }

  async onEvent(event) {
    try {
      console.log(event);
      // Retrieve events that are denoted with 'requires_action'
      // since these will have our tool_calls
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id,
        );
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs =
        data.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
          if (toolCall.function.name === "getCurrentTemperature") {
            return {
              tool_call_id: toolCall.id,
              output: "57",
            };
          } else if (toolCall.function.name === "getRainProbability") {
            return {
              tool_call_id: toolCall.id,
              output: "0.06",
            };
          }
        });
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}
*/
export const runAssistant = async (client, params, options) => {
    const sessionId = Date.now().toString();
    const sessionMessages = {
        sessionId,
        prompt: options.prompt,
        timestamp: new Date().toISOString(),
        messages: []
    };
    if (options.dry) {
        logger.info('Dry run - skipping API call');
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
    let result = null;
    const prompt_ = await prompt(options);
    const assistant = await client.beta.assistants.create({
        name: "Documents Assistant",
        model: params.model,
        tools: [{ type: "file_search" }, ...params.tools],
    });
    const { files } = glob(path.resolve(options.path), options.include) || { files: [], webUrls: new Set() };
    const filesToProcess = files.filter((f) => path.extname(f) in supported);
    const attachments = await Promise.all(filesToProcess.map(async (file) => {
        const file_id = await createOpenAIFile(client, file);
        return {
            file_id: file_id.id,
            tools: [{ type: "file_search" }]
        };
    }));
    const thread = await client.beta.threads.create({
        messages: [
            {
                role: "user",
                content: prompt_.content,
                attachments: attachments,
            }
        ],
    });
    let defer;
    try {
        defer = new Promise((resolve, reject) => {
            const stream = client.beta.threads.runs
                .stream(thread.id, {
                assistant_id: assistant.id,
            })
                //.on("textCreated", (args) => logger.trace("assistant >",args))
                .on("toolCallCreated", (event) => logger.debug("Assistant : " + event.type))
                .on("messageDone", async (event) => {
                if (event.content[0].type === "text") {
                    resolve(event.content[0]);
                }
            });
            return stream;
        });
    }
    catch (e) {
        logger.error(`Failed to run assistant: ${e.message}`, e.message);
    }
    const ret = await defer;
    return await onCompletion(ret.text.value, options);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuLWFzc2lzdGFudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9ydW4tYXNzaXN0YW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFBO0FBQ2pDLE9BQU8sS0FBSyxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBTTdCLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUE7QUFDcEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ2xELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFDakMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQTtBQUtyQyxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQTJCO0lBQy9DLElBQUksRUFBRSxVQUFVO0lBQ2hCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLEtBQUssRUFBRSxlQUFlO0lBQ3RCLE1BQU0sRUFBRSxVQUFVO0lBQ2xCLE1BQU0sRUFBRSxvQkFBb0I7SUFDNUIsT0FBTyxFQUFFLHlFQUF5RTtJQUNsRixLQUFLLEVBQUUsZUFBZTtJQUN0QixPQUFPLEVBQUUsV0FBVztJQUNwQixPQUFPLEVBQUUsYUFBYTtJQUN0QixLQUFLLEVBQUUsaUJBQWlCO0lBQ3hCLE9BQU8sRUFBRSxrQkFBa0I7SUFDM0IsS0FBSyxFQUFFLGVBQWU7SUFDdEIsTUFBTSxFQUFFLGlCQUFpQjtJQUN6QixNQUFNLEVBQUUsWUFBWTtJQUNwQixPQUFPLEVBQUUsMkVBQTJFO0lBQ3BGLEtBQUssRUFBRSxlQUFlLEVBQVUsaUNBQWlDO0lBQ2pFLEtBQUssRUFBRSxhQUFhO0lBQ3BCLEtBQUssRUFBRSxrQkFBa0I7SUFDekIsTUFBTSxFQUFFLFlBQVk7SUFDcEIsS0FBSyxFQUFFLHdCQUF3QjtJQUMvQixNQUFNLEVBQUUsWUFBWTtDQUNyQixDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sZ0JB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