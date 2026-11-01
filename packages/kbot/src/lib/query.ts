import * as path from 'path'
import * as fs from 'fs'
import { OpenAI, toFile } from "openai"
import { isString, isObject } from '@plastichub/core/primitives'
import { sync as write } from '@plastichub/fs/write'
import { sync as read } from '@plastichub/fs/read'
import { sync as exists } from '@plastichub/fs/exists'

import { resolve } from '@plastichub/osr-commons'
import { dumpAsScript, IOptions, logger, toImages } from '../..'
import { Typescript, Commons, Markdown, Documents, Rust } from './system'
import { Filters } from '../filters'
import { parse } from './options'
import { web_prompt as eprompt } from '../ui/electron'
import { Filter } from './types'
import { deepmerge as merge } from 'deepmerge-ts'
import { Tool, ToolInterface } from './tool'

export const deepMerge = async (target: string, source: any) => {
    if (!isString(target) || !source) {
        logger.error(`Invalid deepmerge parameters:`, target, source)
        return source
    }
    target = read(target, 'json') as any || []
    try {
        source = isString(source) ? JSON.parse(source) : source
    } catch (e) {
        logger.error('Error parsing completion:', e)
        return source
    }
    try {
        const ret = merge(target, source)
        return JSON.stringify(ret, null, 2)
    } catch (error) {
        logger.error('Error merging completion:', error)
    }
    return target;
}
export const mergers = { deepMerge }

export const onCompletion = async (query: string, ret: string, opts: IOptions) => {
    if (!isString(ret)) {
        logger.warn(`Invalid response :${query}`)
        return
    }
    const filters = (opts.filters as string).split(',')
    opts.filters = []
    filters.forEach((f) => {
        if (Filters[f]) {
            ((opts.filters) as string[]).push(Filters[f])
        }
    })
    if (opts.filters) {
        (opts.filters as Filter[]).forEach((f) => { ret = f(ret) })
    }

    if (opts.append && mergers[opts.append] && opts.dst) {
        ret = await mergers[opts.append](opts.dst, ret)
    }

    if (opts.dst) {
        let header = `${opts.showPrompt ? `// ${opts.query}` : ''}\n`
        let content = `${header}${ret}`
        write(opts.dst, content)
    }else{
        process.stdout.write(ret)
    }
    return ret
}

export const createOpenAIFile = async (client: OpenAI, filePath: string, purpose: string = 'assistants') => {
    return client.files.create({
        file: fs.createReadStream(filePath),
        purpose: purpose as any
    })
}
export const queryEx = async (api_key: string, options: IOptions) => {
    let ui_opts = null
    let ui_opts_variables = {}
    if (options.gui === 'electron') {
        const promptsFile = path.resolve(resolve(options.prompts))
        const prompts = JSON.stringify(read(promptsFile, 'json') || [])
        ui_opts = await eprompt(options.query, options.dst, { ...ui_opts_variables, PROMPTS: prompts, MODELS: [] })
    }
    options = parse(options)
    if (ui_opts) {
        if (ui_opts.files && ui_opts.files.length > 0) {
            options.files = ui_opts.files
        }
        if (ui_opts.textAreaValue !== options.query) {
            options.query = ui_opts.textAreaValue
        }
        if (ui_opts.target.length && ui_opts.target !== options.dst) {
            options.dst = ui_opts.target
        }
    }
    const client = new OpenAI({ apiKey: api_key })
    let messages: any[] = []
    let defaults = [...Typescript(), ...Documents()]
    if (options.system && exists(options.system)) {
        options.debug && logger.debug('Reading system instructions from', options.system)
        try {
            const system = read(options.system, 'json')
            if (system) {
                messages = [...system as []]
            }
        } catch (error) {
            logger.error('Error reading system instructions', error)
            messages = defaults
        }
    } else {
        messages = defaults
    }

    const attachments = await Promise.all((options.files as string[]).map(async (file: string) => {
        const file_id = await createOpenAIFile(client, file)
        return {
            file_id: file_id.id,
            tools: [{ type: "file_search" }]
        }
    }))

    const assistant = await client.beta.assistants.create({
        name: "Documents Assistant",
        instructions: "You are an expert data analyst.",
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
    })

    const thread = await client.beta.threads.create({
        messages: [
            {
                role: "user",
                content: options.query,
                attachments
            } as any
        ]
    })

    return new Promise((resolve, reject) => {
        try {
            const stream = client.beta.threads.runs
                .stream(thread.id, {
                    assistant_id: assistant.id,
                })
                .on("textCreated", () => console.log("assistant >"))
                .on("toolCallCreated", (event) => console.log("assistant " + event.type))
                .on("messageDone", async (event) => {
                    if (event.content[0].type === "text") {
                        const { text } = event.content[0];
                        const { annotations } = text;
                        const citations: string[] = [];
                        let index = 0;
                        /*
                        for (let annotation of annotations) {
                            text.value = text.value.replace(annotation.text, "[" + index + "]");
                            const { file_citation } = annotation;
                            if (file_citation) {
                                const citedFile = await openai.files.retrieve(file_citation.file_id);
                                citations.push("[" + index + "]" + citedFile.filename);
                            }
                            index++;
                        }*/
                        logger.debug('OpenAI response:', text.value)
                        resolve(text.value)
                    }
                })
            return stream
        } catch (error) {
            reject(error)
        }
    })
}
export const query = async (query: string, api_key: string, dst: string, options: IOptions) => {
    const client = new OpenAI({ apiKey: api_key })
    let messages: any[] = []
    let defaults = [...Typescript(), ...Markdown(), ...Commons(), ...Rust()]
    if (options.system && exists(options.system)) {
        logger.debug('Reading system instructions from', options.system)
        try {
            const system = read(options.system, 'json')
            if (system) {
                messages = [...system as []]
            }
        } catch (error) {
            logger.error('Error reading system instructions', error)
            messages = defaults
        }
    } else {
        messages = defaults
    }
    const requestMessage: any = {
        role: "user",
        content: query
    }
    messages.push(requestMessage)

    if (options.files && options.filesInfo.FILES) {
        const images = toImages(options.filesInfo.FILES).map((image) => {
            return {
                role: "user",
                content: [{ ...image }]
            }
        })
        messages = [...messages, ...images]
    }

    const tools = [
        {
            type: "function",
            function: {
                name: "list_files",
                description: "List files in a given directory.",
                parameters: {
                    type: "object",
                    properties: {
                        order_id: {
                            type: "string",
                            description: "The directory to list files in.",
                        },
                    },
                    required: ["dir"],
                    additionalProperties: false
                }
            }
        }
    ]
    const completion = await client.chat.completions.create({
        model: options.model || "gpt-4o",
        messages: messages,
        //tools: tools as any
    })

    if (completion.choices.length === 0) {
        logger.error('OpenAI response is empty');
        return
    }
    let ret = completion.choices[0].message.content
    ret = await onCompletion(query, ret, options)
    dumpAsScript(options)
    return ret
}
