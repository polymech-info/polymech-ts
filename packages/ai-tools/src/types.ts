import { ChatCompletion, ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources'
import { IKBotOptions } from './types_kbot.js'
import OpenAI from 'openai'
import { Logger, ILogObj } from 'tslog'

import { RunnableFunctionWithParse } from 'openai/lib/RunnableFunction'

export type onToolBefore = (ctx: RunnableFunctionWithParse<any>,args: any) => Promise<any>
export type onToolAfter = (ctx: RunnableFunctionWithParse<any>, args: any, result?: any) => Promise<any>

export interface ICollector {
    //OpenAI
    onMessage: (message: ChatCompletionMessageParam) => void
    onToolCall: (tool: ChatCompletionMessage.FunctionCall) => void,
    onFunctionCallResult: (content: string) => void,
    onChatCompletion: (completion: ChatCompletion) => void,
    onContent: (content:string) => void,
    // internal
    onTool: (category: string, name: string, args: any, result?: any) => void
    onToolBefore: onToolBefore
    onToolAfter: onToolAfter
}
export interface IKBotTask extends IKBotOptions 
{
    client?: OpenAI
    collector?: ICollector
    onRun?:(ctx: IKBotTask) => Promise<IKBotTask>
    logger?: Logger<ILogObj>
    customTools?: any[]
}