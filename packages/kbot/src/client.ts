import  OpenAI  from 'openai'
import * as path from 'node:path'
import { CONFIG_DEFAULT_PATH } from '@polymech/commons'
import { logger } from './index.js'
import { loadConfig } from './config.js'
import { IKBotOptions } from './zod_types.js'

type RouterType = 'openrouter' | 'openai' | 'deepseek' | 'huggingface' | 'ollama' | 'fireworks' | 'gemini' | 'xai'

const ROUTER_BASE_URLS: Record<RouterType, string> = {
    openrouter: 'https://openrouter.ai/api/v1',
    openai: '', // OpenAI uses default URL
    deepseek: 'https://api.deepseek.com',
    huggingface: 'https://api-inference.huggingface.co',
    ollama: 'http://localhost:11434/v1', // Ollama's default local API endpoint
    fireworks: 'https://api.fireworks.ai/v1', // Fireworks API endpoint
    gemini: 'https://generativelanguage.googleapis.com/v1beta', // Gemini API base URL
    xai: 'https://api.x.ai/v1', // XAI (Grok) API base URL
}


const DEFAULT_MODELS: Record<RouterType, string> = {
    openrouter: 'anthropic/claude-sonnet-4',
    openai: 'gpt-4o',   
    deepseek: 'deepseek-chat',
    huggingface: 'meta-llama/2',
    ollama: 'leonard', // Default Ollama model
    fireworks: 'llama-v2-70b-chat', // Default Fireworks model
    gemini: 'gemini-1.5-pro', // Default Gemini model
    xai: 'grok-1' // Default XAI (Grok) model
}
/*
 * Creates an OpenAI client instance based on the provided options.
 * @param options - Configuration options for the client
 * @returns OpenAI client instance or undefined if configuration is invalid
 */
export const createClient = (options: IKBotOptions) => {
    const config = loadConfig(options);
    if (!config) {
        const configPath = options.config ?? path.resolve(CONFIG_DEFAULT_PATH())
        logger.error(
            { configPath, router: options.router ?? 'openrouter', model: options.model },
            `Config not found at: ${configPath} — set OSR-CONFIG env var or place .config.json there`,
        );
        return undefined;
    }
    const router: RouterType = (options.router ?? 'openrouter') as RouterType;

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

    if (!apiKey ) {
        logger.error(`No ${router} key found. Please provide an "api_key", set it in the config, or pass it via JSON config.`);
        return undefined;
    }

    const baseURL = options.baseURL ?? ROUTER_BASE_URLS[router]

    if (!options.model) {
        options.model = DEFAULT_MODELS[router]
    }    
    return new OpenAI({
        apiKey,
        baseURL,
    })
}
