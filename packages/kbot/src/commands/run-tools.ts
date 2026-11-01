import OpenAI from 'openai'
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { ChatCompletionToolRunnerParams } from 'openai/lib/ChatCompletionRunner'

import { IKBotTask, ICollector } from '../ai-tools/index.js'

import { content } from '../utils/content.js'
import { onCompletion } from './run-completion.js'

export const runTools = async (client: OpenAI, params: any, options: IKBotTask) => {
  const sessionId = Date.now().toString()
  const sessionMessages = {
    sessionId,
    prompt: options.prompt,
    timestamp: new Date().toISOString(),
    messages: []
  }
  if (options.dry) {
    options.logger.info('Dry run - skipping API call')
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
  let runner = null
  try {
    runner = await client.chat.completions.runTools(params as ChatCompletionToolRunnerParams<any>)
      .on('message', (message: ChatCompletionMessageParam) => {
        (options.collector as ICollector).onMessage(logMessage(message, sessionId, options.prompt))
      })/*
      .on('toolCall', (tool: ChatCompletionMessage.FunctionCall) => {
        return (options.collector as ICollector).onToolCall(logMessage(tool, sessionId, options.prompt))
      })
      .on('toolCallResult', (a) => {
        (options.collector as ICollector).onFunctionCallResult(a)
      })
      */.on('chatCompletion', (options.collector as ICollector).onChatCompletion)
      .on('content', (options.collector as ICollector).onContent)
  } catch (e) {
    options.logger.trace(e)
  }

  let result = content(runner)
  try {
    result = await runner.finalChatCompletion()
  } catch (error) {
    if (error.message.includes("(reading 'map')")) {
      options.logger.error('Failed to complete runner: credits :)', error.message, error.message, error)
      return
    }
    options.logger.error('Failed to complete runner:', error.message, error.issues)
    return
  }
  const ret = content(result)
  return await onCompletion(ret, options)  
}
