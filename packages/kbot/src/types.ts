import { IKBotOptions } from './zod_types.js'
import OpenAI from 'openai'
import { ICollector } from './ai-tools/index.js'

export * from './zod_types.js'

export type onToolCall = (category: string, name: string, args: any, result?: any) => Promise<void>
export type onMessage = (category: string, name: string, args: any, result?: any) => Promise<void>

export interface IKBotTask extends IKBotOptions 
{
    client: OpenAI
    collector: ICollector
}