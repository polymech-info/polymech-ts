import * as path from 'path'
import { RunnableToolFunction } from 'openai/lib/RunnableFunction'
import { isArray } from '@polymech/core/primitives'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { toolLogger } from '../../index.js'
import { IKBotTask } from '../../types.js'

export const tools = (target: string, options: IKBotTask): Array<any> => {
    const logger = toolLogger('search', options)
    return [
        {
            type: 'function',
            function: {
                name: 'google',
                description: 'Searches Google for the given query',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' }
                    },
                    required: ['query']
                },
                function: async (params: any) => {
                    const { query } = params
                    const config = CONFIG_DEFAULT() as any
                    let apiKey = config?.google?.api_key
                    let cse = config?.google?.cse
                    if (!config || !apiKey || !cse) {
                        logger.debug(
                            "Config not found in $HOME/.osr/config.json. " +
                            "Optionally, export OSR_CONFIG with the path to the configuration file " +
                            ""
                        );
                        return undefined
                    }
                    const res = await fetch(
                        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cse}&q=${encodeURIComponent(
                            query
                        )}`
                    )
                    const data = await res.json();
                    let results =
                        data.items?.map((item: { title?: string; link?: string; snippet?: string }) => ({
                            title: item.title,
                            link: item.link,
                            snippet: item.snippet,
                            ...item
                        })) ?? [];
                    return JSON.stringify(results)
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>,
        {
            type: 'function',
            function: {
                name: 'serpapi',
                description: 'Searches Serpapi (finds locations (engine:google_local), places on the map (engine:google_maps) ) for the given query',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        engine: { type: 'string', default: 'google' },
                    },
                    required: ['query']
                },
                function: async (params: any) => {
                    const { query, engine } = params
                    const config = CONFIG_DEFAULT() as any
                    let apiKey = config?.serpapi?.key || config?.serpapi?.api_key
                    if (!config || !apiKey) {
                        logger.debug(
                            "Config not found in $HOME/.osr/config.json. " +
                            "Optionally, export OSR_CONFIG with the path to the configuration file " +
                            ""
                        );
                        return undefined
                    }
                    const url = `https://serpapi.com/search?api_key=${apiKey}&engine=${engine || 'google'}&q=${encodeURIComponent(query)}&google_domain=google.com`
                    const res = await fetch(url)
                    logger.debug(`Searching ${url}`)
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    const data = await res.json()
                    let items = data.organic_results || data.local_results || data.place_results || data.places || data.maps_results || []
                    if (items && !isArray(items)) {
                        items = [items]
                    }
                    let results = items.map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet,
                        ...item
                    })) ?? []
                    return JSON.stringify(results)
                },
                parse: JSON.parse
            }
        } as RunnableToolFunction<any>
    ]
};
