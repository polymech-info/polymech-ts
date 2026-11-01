import { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { resolve } from '@polymech/commons'
import { } from '@polymech/commons/config'
import { sync as exists } from '@polymech/fs/exists'
import * as path from 'node:path'

import { tools as defaultTools } from "./ai-tools/lib/tools/tools.js"
import { logger  } from './index.js'
import { IKBotOptions } from './zod_types.js'
import { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction"

import { after, before } from '@polymech/core/aspects_simple'
import { IKBotTask } from './ai-tools/index.js'

export type TMessageParam = ChatCompletionMessageParam & { type?: string }

export const defaultTemplate = {
    include: [
        "!node_modules/**/*",
        "!dist/**/*",
        "!build/**/*",
        "!coverage/**/*",
        "!*.log",
        "!.kbot",
        "!.git",
        "*"
    ],
    messages: [],
    tools: ['fs', 'git', 'interact', 'terminal', 'search', 'web', 'email', 'user']
}
export const resolve_package_path = (dir: string): string => resolve(path.join(__dirname, dir || ''))
const loadToolFromPath = async (toolPath: string, target: string, options: IKBotOptions) => {
    try {
        const absolutePath = path.resolve(toolPath)
        if (!exists(absolutePath)) {
            logger.warn(`Tool path not found: ${absolutePath}`)
            return null
        }
        const toolModule = await import(absolutePath)
        if (typeof toolModule.default === 'function') {
            return toolModule.default(target, options)
        } else {
            logger.warn(`Invalid tool module at ${toolPath}: no default export function`)
            return null
        }
    } catch (e) {
        logger.error(`Error loading tool from path ${toolPath}:`, e.message)
        return null
    }
}
export const load = async (options: IKBotTask): Promise<RunnableToolFunctionWithParse<any>[]> => {
    const target = path.resolve(options.output || options.path)
    const toolsList = options.tools || defaultTemplate.tools
    const enabledTools = (toolsList as []).filter(tool => !options.disable.includes(tool))
    const loadedTools = await Promise.all(enabledTools.map(async (tool: string) => {
        if (defaultTools[tool]) {
            try {
                return defaultTools[tool](target, options)
            } catch (e) {
                logger.error(`Error loading built-in tool ${tool}`, e.message)
                return null
            }
        }
        return loadToolFromPath(tool, target, options)
    }))
    
    const tools = loadedTools
        .flat()
        .filter((tool): tool is RunnableToolFunctionWithParse<any> => {
            if (!tool) return false
            if (options.disableTools.includes(tool.function.name)) return false
            if (tool.function.name === 'completion') return false
            return true
        })

    tools.forEach(tool => {
        tool.function.function = before(tool.function.function,options.collector.onToolBefore)
        tool.function.function = after(tool.function.function,options.collector.onToolAfter)
    })
    return tools
}
