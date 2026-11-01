import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import { IKBotTask } from '../ai-tools/index.js'
import { sync as readFS } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { sync as writeFS } from '@polymech/fs/write'
import { writeFileSync } from 'node:fs'
import { onCompletion } from './run-completion.js'

export const runResponses = async (client: OpenAI, params: any, options: IKBotTask) => {
    if (options.dry) {
        options.logger?.info('Dry run - skipping API call')
        return false
    }

    
    const input = params.messages
        .map((m: ChatCompletionMessageParam) => m.content)
        .join('\n\n')

    const tools = [
        {
            type: 'web_search' as const
        }
    ]

    const createParams: any = {
        model: options.model,
        input,
        stream: false,
        parallel_tool_calls: false,
        tools
    }

    if (options.stream) {
        createParams.stream = true
    }

    if (options.format && typeof options.format === 'string' && exists(options.format)) {
        try {
            const content = readFS(options.format)
            const schema = JSON.parse(content.toString())
            createParams.text = {
                format: {
                    type: 'json_schema',
                    name: 'format',
                    schema,
                    strict: false
                }
            }
        } catch (e) {
            options.logger?.error(`Failed to parse format file: ${options.format}`, e)
        }
    }

    try {
        const response = await (client as any).responses.create(createParams)

        if (options.stream) {
            const allEvents: any[] = []
            for await (const event of response) {
                allEvents.push({ event: event.type, data: event })
            }
            //writeFileSync('./tests/research-stream.json', JSON.stringify(allEvents, null, 2))
            //options.logger?.info('Stream logged to ./tests/research-stream.json')
            return
        }

        if (!response || !response.output_text) {
            return ''
        }

        let result = response.output_text
        result = await onCompletion(result, options)
        return result
    } catch (e) {
        options.logger?.error('Failed to create response:', e.message)
        return
    }
} 