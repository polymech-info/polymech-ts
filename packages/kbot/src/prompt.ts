import { IKBotTask } from './ai-tools/index.js'

import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { resolve } from '@polymech/commons'
import * as path from 'node:path'

import { resolveQuery } from './utils/input.js'
import { env_vars } from './utils/env.js'
import { PREFERENCES_FILE_NAME } from './constants.js'

export const prompt = async (opts: IKBotTask): Promise<ChatCompletionMessageParam | undefined> => {
    const input = await resolveQuery(opts)
    return {
        role: "user",
        content: input || ''
    }
}

export const preferences = async (opts: IKBotTask): Promise<ChatCompletionMessageParam | undefined> => {
    // First try local preferences
    let preferencesPath = path.resolve(path.join(process.cwd(), PREFERENCES_FILE_NAME))
    if (!exists(preferencesPath)) {
        // Fall back to specified preferences path if local file doesn't exist
        // Only resolve if opts.preferences is actually defined
        preferencesPath = opts.preferences ? path.resolve(resolve(opts.preferences, false, env_vars())) : ''
    }
    // Only read if preferencesPath is valid and exists
    const preferencesContent = preferencesPath && exists(preferencesPath) ? read(preferencesPath, 'string') as string : ''
    return {
        role: "user",
        // Only include content if preferences were actually loaded
        content: preferencesContent ? `USER Preferences : ${preferencesContent}` : ''
    }
}