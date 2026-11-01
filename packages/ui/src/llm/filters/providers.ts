/**
 * Provider configuration and routing system
 * Supports multiple AI providers via OpenRouter and direct APIs
 */

import { ProviderConfig } from './types';
import { generateText } from '@/lib/openai';
import { fetchProviderConfigs } from '@/modules/providers/client-providers';
import { fetchOpenRouterModelInfo } from './providers/openrouter';
import { fetchOpenAIModelInfo } from './providers/openai';

// Default provider configurations
export const DEFAULT_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    rateLimits: {
      requests_per_minute: 60,
      tokens_per_minute: 150000
    },
    isActive: true
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    rateLimits: {
      requests_per_minute: 50,
      tokens_per_minute: 100000
    },
    isActive: true
  },
  google: {
    name: 'google',
    displayName: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: ['gemini-pro', 'gemini-pro-vision'],
    rateLimits: {
      requests_per_minute: 60,
      tokens_per_minute: 120000
    },
    isActive: true
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'google/gemini-pro'],
    rateLimits: {
      requests_per_minute: 30,
      tokens_per_minute: 75000
    },
    isActive: true
  }
};

/**
 * Get provider configuration by name
 */
export const getProviderConfig = (providerName: string): ProviderConfig | null => {
  return DEFAULT_PROVIDERS[providerName] || null;
};

/**
 * Get all available providers from API or defaults
 */
/** Pass `userId` (app UUID) to load saved providers; without it, defaults are returned. */
export const getAvailableProviders = async (userId?: string): Promise<ProviderConfig[]> => {
  if (!userId) {
    return Object.values(DEFAULT_PROVIDERS).filter(provider => provider.isActive);
  }
  try {
    const data = await fetchProviderConfigs(userId, { is_active: true });
    if (data && data.length > 0) {
      return data.map(dbProvider => convertDbToConfig(dbProvider));
    }
  } catch (error) {
    console.error('Failed to load providers from API, using defaults:', error);
  }

  return Object.values(DEFAULT_PROVIDERS).filter(provider => provider.isActive);
};

/**
 * Get all available providers synchronously (uses defaults only)
 * For use in components that need immediate access
 */
export const getAvailableProvidersSync = (): ProviderConfig[] => {
  return Object.values(DEFAULT_PROVIDERS).filter(provider => provider.isActive);
};

/**
 * Convert database provider format to ProviderConfig
 */
const convertDbToConfig = (dbProvider: any): ProviderConfig => {
  return {
    name: dbProvider.name,
    displayName: dbProvider.display_name,
    baseUrl: dbProvider.base_url,
    models: Array.isArray(dbProvider.models) ? dbProvider.models as string[] : [],
    rateLimits: (dbProvider.rate_limits as Record<string, number>) || {},
    isActive: dbProvider.is_active ?? true,
    settings: (dbProvider.settings as Record<string, any>) || {},
  };
};

/**
 * Get models for a specific provider
 */
export const getProviderModels = (providerName: string): string[] => {
  const provider = getProviderConfig(providerName);
  return provider?.models || [];
};

/**
 * Check if a model is supported by a provider
 */
export const isModelSupported = (providerName: string, model: string): boolean => {
  const models = getProviderModels(providerName);
  return models.includes(model);
};

/**
 * Route text generation to the appropriate provider
 */
export const routeProvider = async (
  provider: string,
  model: string,
  prompt: string,
  apiKey?: string
): Promise<string> => {
  const startTime = Date.now();

  try {
    switch (provider) {
      case 'openai':
        return await generateWithOpenAI(model, prompt, apiKey);

      case 'anthropic':
        return await generateWithAnthropic(model, prompt, apiKey);

      case 'google':
        return await generateWithGoogle(model, prompt, apiKey);

      case 'openrouter':
        return await generateWithOpenRouter(model, prompt, apiKey);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error: any) {
    console.error(`Provider ${provider} failed:`, error);
    throw error;
  } finally {
    const processingTime = Date.now() - startTime;
    console.debug(`Provider ${provider} processing time: ${processingTime}ms`);
  }
};

/**
 * Generate text using OpenAI
 */
async function generateWithOpenAI(
  model: string,
  prompt: string,
  apiKey?: string
): Promise<string> {
  // Use existing OpenAI integration
  const result = await generateText(prompt, model, apiKey);

  if (!result) {
    throw new Error('OpenAI generation failed');
  }

  return result;
}

/**
 * Generate text using Anthropic
 * TODO: Implement Anthropic API integration
 */
async function generateWithAnthropic(
  model: string,
  prompt: string,
  apiKey?: string
): Promise<string> {
  // Placeholder implementation
  throw new Error('Anthropic integration not yet implemented');
}

/**
 * Generate text using Google
 * TODO: Implement Google API integration
 */
async function generateWithGoogle(
  model: string,
  prompt: string,
  apiKey?: string
): Promise<string> {
  // Placeholder implementation
  throw new Error('Google integration not yet implemented');
}

/**
 * Generate text using OpenRouter
 * TODO: Implement OpenRouter API integration
 */
async function generateWithOpenRouter(
  model: string,
  prompt: string,
  apiKey?: string
): Promise<string> {
  // Placeholder implementation
  throw new Error('OpenRouter integration not yet implemented');
}

/**
 * Validate provider configuration
 */
export const validateProvider = (providerName: string, model: string): boolean => {
  const provider = getProviderConfig(providerName);

  if (!provider || !provider.isActive) {
    return false;
  }

  return isModelSupported(providerName, model);
};

/**
 * Get rate limits for a provider
 */
export const getProviderRateLimits = (providerName: string): Record<string, number> => {
  const provider = getProviderConfig(providerName);
  return provider?.rateLimits || {};
};

/**
 * Fetch available models from provider API
 * Returns simple array of model IDs
 * 
 * @param providerName - The provider to fetch models from
 * @param apiKey - Optional API key for authentication
 * @returns Promise<string[]> - Array of available model names
 */
export const fetchProviderModels = async (
  providerName: string,
  apiKey?: string
): Promise<string[]> => {
  switch (providerName) {
    case 'openai':
      return fetchOpenAIModels(apiKey);
    case 'anthropic':
      return fetchAnthropicModels(apiKey);
    case 'google':
      return fetchGoogleModels(apiKey);
    case 'openrouter':
      return fetchOpenRouterModels(apiKey);
    default:
      throw new Error(`Model fetching not implemented for provider: ${providerName}`);
  }
};

/**
 * Fetch detailed model information from provider API
 * Returns full model info including description, pricing, capabilities
 * 
 * @param providerName - The provider to fetch models from
 * @param apiKey - Optional API key for authentication
 * @returns Promise<any[]> - Array of model info objects
 */
export const fetchProviderModelInfo = async (
  providerName: string,
  apiKey?: string
): Promise<any[]> => {
  switch (providerName) {
    case 'openrouter':
      return fetchOpenRouterModelInfo();
    case 'openai':
      return fetchOpenAIModelInfo(apiKey);
    case 'anthropic':
    case 'google':
      // For now, return simple array with just IDs
      const models = await fetchProviderModels(providerName, apiKey);
      return models.map(id => ({ id, name: id }));
    default:
      throw new Error(`Model info fetching not implemented for provider: ${providerName}`);
  }
};

/**
 * Fetch OpenAI models
 * Delegates to OpenAI-specific implementation
 */
async function fetchOpenAIModels(apiKey?: string): Promise<string[]> {
  const models = await fetchOpenAIModelInfo(apiKey);
  return models.map(m => m.id);
}

/**
 * Fetch Anthropic models
 * TODO: Implement using Anthropic API
 */
async function fetchAnthropicModels(apiKey?: string): Promise<string[]> {
  // Placeholder - Anthropic doesn't have a models endpoint yet
  throw new Error('Anthropic model fetching not yet implemented');
}

/**
 * Fetch Google models
 * TODO: Implement using Google API
 */
async function fetchGoogleModels(apiKey?: string): Promise<string[]> {
  // Placeholder - will implement with Google Generative AI API
  throw new Error('Google model fetching not yet implemented');
}

/**
 * Fetch OpenRouter models
 * Delegates to OpenRouter-specific implementation
 */
async function fetchOpenRouterModels(apiKey?: string): Promise<string[]> {
  const models = await fetchOpenRouterModelInfo();
  return models.map(m => m.id);
}
