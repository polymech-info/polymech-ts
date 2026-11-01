import * as path from 'node:path'
import * as fs from 'node:fs'

import OpenAI from 'openai'

import { IKBotTask } from '../ai-tools/index.js'

import { logger } from '../index.js'
import { onCompletion } from './run-completion.js'
import { glob } from '../glob.js'
import { prompt } from '../prompt.js'
import { AssistantStream } from "openai/lib/AssistantStream.mjs"
import { OptionsSchema } from "../zod_schema.js"
import { cwd as processCwd } from 'node:process'

export const supported: Record<string, string> = {
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
  ".py": "text/x-python",         // sometimes text/x-script.python
  ".rb": "text/x-ruby",
  ".sh": "application/x-sh",
  ".tex": "text/x-tex",
  ".ts": "application/typescript",
  ".txt": "text/plain"
};

export const createOpenAIFile = async (client: OpenAI, filePath: string, purpose: string = 'assistants') => {
  return client.files.create({
    file: fs.createReadStream(filePath),
    purpose: purpose as any
  })
}
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
export const runAssistant = async (client: OpenAI, params: any, options: IKBotTask) => {
  const sessionId = Date.now().toString()
  const sessionMessages = {
    sessionId,
    prompt: options.prompt,
    timestamp: new Date().toISOString(),
    messages: []
  }

  if (options.dry) {
    logger.info('Dry run - skipping API call')
    return {
      result: 'DRY RUN',
      sessionMessages,
      result_raw: {},
      toolCalls: []
    }
  }
  const logMessage = (message: any, sessionId: string, prompt) => {
    return {
      ...message,
      timestamp: new Date().toISOString(),
      sessionId,
      prompt
    }
  }
  let result = null
  const prompt_ = await prompt(options)
  const assistant = await client.beta.assistants.create({
    name: "Documents Assistant",
    model: params.model,
    tools: [{ type: "file_search" }, ...params.tools],
  })

  const { files } = glob(path.resolve(options.path), options.include) || { files: [], webUrls: new Set<string>() }
  const filesToProcess = files.filter((f) => path.extname(f) in supported)

  const attachments = await Promise.all(filesToProcess.map(async (file: string) => {
    const file_id = await createOpenAIFile(client, file)
    return {
      file_id: file_id.id,
      tools: [{ type: "file_search" }]
    }
  }))

  const thread = await client.beta.threads.create({
    messages: [
      {
        role: "user",
        content: prompt_.content,
        attachments: attachments as any,
      }
    ] as any,
  })

  let defer
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
            resolve(event.content[0])
          }
        })
      return stream
    })
  } catch (e) {
    logger.error(`Failed to run assistant: ${e.message}`, e.message)
  }
  const ret = await defer
  return await onCompletion(ret.text.value, options)
}