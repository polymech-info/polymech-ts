import { isArray } from '@polymech/core/primitives';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { toolLogger } from '../../index.js';
export const tools = (target, options) => {
    const logger = toolLogger('search', options);
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
                function: async (params) => {
                    const { query } = params;
                    const config = CONFIG_DEFAULT();
                    let apiKey = config?.google?.api_key;
                    let cse = config?.google?.cse;
                    if (!config || !apiKey || !cse) {
                        logger.debug("Config not found in $HOME/.osr/config.json. " +
                            "Optionally, export OSR_CONFIG with the path to the configuration file " +
                            "");
                        return undefined;
                    }
                    const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cse}&q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    let results = data.items?.map((item) => ({
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet,
                        ...item
                    })) ?? [];
                    return JSON.stringify(results);
                },
                parse: JSON.parse
            }
        },
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
                function: async (params) => {
                    const { query, engine } = params;
                    const config = CONFIG_DEFAULT();
                    let apiKey = config?.serpapi?.key || config?.serpapi?.api_key;
                    if (!config || !apiKey) {
                        logger.debug("Config not found in $HOME/.osr/config.json. " +
                            "Optionally, export OSR_CONFIG with the path to the configuration file " +
                            "");
                        return undefined;
                    }
                    const url = `https://serpapi.com/search?api_key=${apiKey}&engine=${engine || 'google'}&q=${encodeURIComponent(query)}&google_domain=google.com`;
                    const res = await fetch(url);
                    logger.debug(`Searching ${url}`);
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    const data = await res.json();
                    let items = data.organic_results || data.local_results || data.place_results || data.places || data.maps_results || [];
                    if (items && !isArray(items)) {
                        items = [items];
                    }
                    let results = items.map((item) => ({
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet,
                        ...item
                    })) ?? [];
                    return JSON.stringify(results);
                },
                parse: JSON.parse
            }
        }
    ];
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FpLXRvb2xzL2xpYi90b29scy9zZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLDJCQUEyQixDQUFBO0FBQ25ELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUE7QUFHM0MsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLENBQUMsTUFBYyxFQUFFLE9BQWtCLEVBQWMsRUFBRTtJQUNwRSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzVDLE9BQU87UUFDSDtZQUNJLElBQUksRUFBRSxVQUFVO1lBQ2hCLFFBQVEsRUFBRTtnQkFDTixJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUscUNBQXFDO2dCQUNsRCxVQUFVLEVBQUU7b0JBQ1IsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7cUJBQzVCO29CQUNELFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQztpQkFDdEI7Z0JBQ0QsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFXLEVBQUUsRUFBRTtvQkFDNUIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQTtvQkFDeEIsTUFBTSxNQUFNLEdBQUcsY0FBYyxFQUFTLENBQUE7b0JBQ3RDLElBQUksTUFBTSxHQUFHLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFBO29CQUNwQyxJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQTtvQkFDN0IsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dC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