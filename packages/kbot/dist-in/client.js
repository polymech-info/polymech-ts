import OpenAI from 'openai';
import * as path from 'node:path';
import { CONFIG_DEFAULT_PATH } from '@polymech/commons';
import { logger } from './index.js';
import { loadConfig } from './config.js';
const ROUTER_BASE_URLS = {
    openrouter: 'https://openrouter.ai/api/v1',
    openai: '', // OpenAI uses default URL
    deepseek: 'https://api.deepseek.com',
    huggingface: 'https://api-inference.huggingface.co',
    ollama: 'http://localhost:11434/v1', // Ollama's default local API endpoint
    fireworks: 'https://api.fireworks.ai/v1', // Fireworks API endpoint
    gemini: 'https://generativelanguage.googleapis.com/v1beta', // Gemini API base URL
    xai: 'https://api.x.ai/v1', // XAI (Grok) API base URL
};
const DEFAULT_MODELS = {
    openrouter: 'anthropic/claude-sonnet-4',
    openai: 'gpt-4o',
    deepseek: 'deepseek-chat',
    huggingface: 'meta-llama/2',
    ollama: 'leonard', // Default Ollama model
    fireworks: 'llama-v2-70b-chat', // Default Fireworks model
    gemini: 'gemini-1.5-pro', // Default Gemini model
    xai: 'grok-1' // Default XAI (Grok) model
};
/*
 * Creates an OpenAI client instance based on the provided options.
 * @param options - Configuration options for the client
 * @returns OpenAI client instance or undefined if configuration is invalid
 */
export const createClient = (options) => {
    const config = loadConfig(options);
    if (!config) {
        const configPath = options.config ?? path.resolve(CONFIG_DEFAULT_PATH());
        logger.error({ configPath, router: options.router ?? 'openrouter', model: options.model }, `Config not found at: ${configPath} — set OSR-CONFIG env var or place .config.json there`);
        return undefined;
    }
    const router = (options.router ?? 'openrouter');
    let apiKey = options.api_key;
    if (!apiKey) {
        switch (router) {
            case 'openrouter':
                apiKey = config?.openrouter?.key;
                break;
            case 'openai':
                apiKey = config?.openai?.key;
                break;
            case 'deepseek':
                apiKey = config?.deepseek?.key;
                break;
            case 'huggingface':
                apiKey = config?.huggingface?.key;
                break;
            case 'ollama':
                // Ollama doesn't require an API key when running locally
                apiKey = 'ollama'; // Dummy key for Ollama
                break;
            case 'fireworks':
                apiKey = config?.fireworks?.key;
                break;
            case 'gemini':
                apiKey = config?.gemini?.key;
                break;
            case 'xai':
                apiKey = config?.xai?.key;
                break;
        }
    }
    if (!apiKey) {
        logger.error(`No ${router} key found. Please provide an "api_key", set it in the config, or pass it via JSON config.`);
        return undefined;
    }
    const baseURL = options.baseURL ?? ROUTER_BASE_URLS[router];
    if (!options.model) {
        options.model = DEFAULT_MODELS[router];
    }
    return new OpenAI({
        apiKey,
        baseURL,
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFRLE1BQU0sTUFBTyxRQUFRLENBQUE7QUFDN0IsT0FBTyxLQUFLLElBQUksTUFBTSxXQUFXLENBQUE7QUFDakMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDdkQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNuQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sYUFBYSxDQUFBO0FBS3hDLE1BQU0sZ0JBQWdCLEdBQStCO0lBQ2pELFVBQVUsRUFBRSw4QkFBOEI7SUFDMUMsTUFBTSxFQUFFLEVBQUUsRUFBRSwwQkFBMEI7SUFDdEMsUUFBUSxFQUFFLDBCQUEwQjtJQUNwQyxXQUFXLEVBQUUsc0NBQXNDO0lBQ25ELE1BQU0sRUFBRSwyQkFBMkIsRUFBRSxzQ0FBc0M7SUFDM0UsU0FBUyxFQUFFLDZCQUE2QixFQUFFLHlCQUF5QjtJQUNuRSxNQUFNLEVBQUUsa0RBQWtELEVBQUUsc0JBQXNCO0lBQ2xGLEdBQUcsRUFBRSxxQkFBcUIsRUFBRSwwQkFBMEI7Q0FDekQsQ0FBQTtBQUdELE1BQU0sY0FBYyxHQUErQjtJQUMvQyxVQUFVLEVBQUUsMkJBQTJCO0lBQ3ZDLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLFFBQVEsRUFBRSxlQUFlO0lBQ3pCLFdBQVcsRUFBRSxjQUFjO0lBQzNCLE1BQU0sRUFBRSxTQUFTLEVBQUUsdUJBQXVCO0lBQzFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEI7SUFDMUQsTUFBTSxFQUFFLGdCQUFnQixFQUFFLHVCQUF1QjtJQUNqRCxHQUFHLEVBQUUsUUFBUSxDQUFDLDJCQUEyQjtDQUM1QyxDQUFBO0FBQ0Q7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLE9BQXFCLEVBQUUsRUFBRTtJQUNsRCxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1YsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtRQUN4RSxNQUFNLENBQUMsS0FBSyxDQUNSLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxJQUFJLFlBQVksRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUM1RSx3QkFBd0IsVUFBVSx1REFBdUQsQ0FDNUYsQ0FBQztRQUNGLE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBZSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksWUFBWSxDQUFlLENBQUM7SUFFMUUsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUU3QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDVixRQUFRLE1BQU0sRUFBRSxDQUFDO1lBQ2IsS0FBSyxZQUFZO2dCQUNiLE1BQU0sR0FBRyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQztnQkFDakMsTUFBTTtZQUNWLEtBQUssUUFBUTtnQkFDVCxNQUFNLEdBQUcsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUM7Z0JBQzdCLE1BQU07WUFDVixLQUFLLFVBQVU7Z0JBQ1gsTUFBTSxHQUFHLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDO2dCQUMvQixNQUFNO1lBQ1YsS0FBSyxhQUFhO2dCQUNkLE1BQU0sR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQztnQkFDbEMsTUFBTTtZQUNWLEtBQUssUUFBUTtnQkFDVCx5REFBeUQ7Z0JBQ3pELE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyx1QkFBdUI7Z0JBQzFDLE1BQU07WUFDVixLQUFLLFdBQVc7Z0JBQ1osTUFBTSxHQUFHLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxDQUFDO2dCQUNoQyxNQUFNO1lBQ1YsS0FBSyxRQUFRO2dCQUNULE1BQU0sR0FBRyxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQztnQkFDN0IsTUFBTTtZQUNWLEtBQUssS0FBSztnQkFDTixNQUFNLEdBQUcsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQzFCLE1BQU07UUFDZCxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUksQ0FBQyxNQUFNLEVBQUcsQ0FBQztRQUNYLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxNQUFNLDRGQUE0RixDQUFDLENBQUM7UUFDdkgsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFM0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixPQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0lBQ0QsT0FBTyxJQUFJLE1BQU0sQ0FBQztRQUNkLE1BQU07UUFDTixPQUFPO0tBQ1YsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBIn0=