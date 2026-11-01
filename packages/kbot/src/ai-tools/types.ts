import { ChatCompletion, ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources'
import { IKBotOptions } from './types_kbot.js'
import OpenAI from 'openai'

import { RunnableFunctionWithParse } from 'openai/lib/RunnableFunction'

export type onToolBefore = (ctx: RunnableFunctionWithParse<any>,args: any) => Promise<any>
export type onToolAfter = (ctx: RunnableFunctionWithParse<any>, args: any, result?: any) => Promise<any>

/** Minimal structured logger interface — compatible with pino, tslog, and console. */
export interface IKBotLogger {
    trace(obj: unknown, msg?: string, ...args: any[]): void
    trace(msg: string, ...args: any[]): void
    debug(obj: unknown, msg?: string, ...args: any[]): void
    debug(msg: string, ...args: any[]): void
    info(obj: unknown, msg?: string, ...args: any[]): void
    info(msg: string, ...args: any[]): void
    warn(obj: unknown, msg?: string, ...args: any[]): void
    warn(msg: string, ...args: any[]): void
    error(obj: unknown, msg?: string, ...args: any[]): void
    error(msg: string, ...args: any[]): void
}

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
    logger?: IKBotLogger
    customTools?: any[]
    /** Suppress stdout output (e.g. when called as a library). Result is still returned. */
    silent?: boolean
}