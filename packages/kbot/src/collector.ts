import path from 'node:path'
import OpenAI from 'openai'

import { ICollector } from './ai-tools/index.js'
import { resolve } from '@polymech/commons'
import { RunnableFunctionWithParse } from 'openai/lib/RunnableFunction'

import { winstonLogger, } from './ai-tools/index.js'
import { IKBotOptions } from './zod_types.js'
import { getLogger } from './index.js'

import { ChatCompletion, ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export const collector = (options: IKBotOptions, client: OpenAI): ICollector => {
    const loggerIntern = getLogger(options)
    return {
        //OpenAI
        onMessage: (message: ChatCompletionMessageParam) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'openai-message.json'))
            const logger = winstonLogger('collector:onMessage', logFile)
            //logger.info(message)
        },
        onToolCall: async (message: ChatCompletionMessage.FunctionCall) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool-call.json'))
            const logger = winstonLogger('collector:onToolCall', logFile)
            try {
                const msg = { ...message, arguments: JSON.parse(message.arguments) }
           //     logger.debug(msg)
            } catch (e) {
                //logger.debug(message)
            }
        },
        onFunctionCallResult: (message: string) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool-call-result.json'))
            const logger = winstonLogger('collector:onFunctionCallResult', logFile)
            try {
                const msg = { message: JSON.parse(message) }
                //logger.debug(msg)
            } catch (e) {
                //logger.debug(message)
            }
        },
        onChatCompletion: (message: ChatCompletion) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'completion.json'))
            const logger = winstonLogger('collector:onChatCompletion', logFile)
            //logger.debug(message)
        },
        onContent: (content: string) => {
            const logFile = path.resolve(path.join(resolve(options.logs), 'content.json'))
            const logger = winstonLogger('collector:onContent', logFile)
            //logger.debug(content)
        },
        onTool(category, name, args, result) {
            const logFile = path.resolve(path.join(resolve(options.logs), 'tool.json'))
            const logger = winstonLogger('collector:onTool', logFile)
            logger.debug({ category, name, args, result })
        },
        onToolBefore: async (ctx: RunnableFunctionWithParse<any>, args: any) => {            
            try{
           //     loggerIntern.debug(`onToolBefore :${ctx.name}`)
            }catch(e){
                loggerIntern.error(e)
            }
            return args
        },
        onToolAfter: async (ctx: RunnableFunctionWithParse<any>, args: any, result?: any) => {
            try {
                //loggerIntern.debug(`onToolAfter : ${ctx.name}`)
            } catch (e) {
                loggerIntern.error(e)
            }
            return result[0]
        }
    }
}