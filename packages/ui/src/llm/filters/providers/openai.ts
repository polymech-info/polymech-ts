/**
 * OpenAI provider implementation
 * Fetches models from OpenAI API with API key from user profile
 */

import OpenAI from 'openai';
import { apiClient } from '@/lib/db';

// Types based on ref/openai.ts
interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
  root?: string;
  parent?: string | null;
}

export interface OpenAIModelInfo {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsText: boolean;
  company: string;
  created: number;
  owned_by: string;
}

interface CachedModelData {
  timestamp: number;
  models: OpenAIModelInfo[];
}

const CACHE_KEY = 'openai-models-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Get user's OpenAI API key from their profile
 */
const getOpenAIApiKey = async (providedKey?: string): Promise<string | null> => {
  // If API key is provided directly, use it
  if (providedKey) {
    return providedKey;
  }

  try {
    const data = await apiClient<{ api_keys?: Record<string, any> }>('/api/me/secrets');
    const key = data.api_keys?.openai_api_key;
    if (!key) {
      console.error('No OpenAI API key found in user secrets. Please add your OpenAI API key in your profile settings.');
      return null;
    }
    return key;
  } catch (error) {
    console.error('Error getting OpenAI API key:', error);
    return null;
  }
};

/**
 * Load models from localStorage cache
 */
const loadFromCache = (): OpenAIModelInfo[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedModelData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.models;
  } catch (error) {
    console.error('Failed to load OpenAI models from cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/**
 * Save models to localStorage cache
 */
const saveToCache = (models: OpenAIModelInfo[]): void => {
  try {
    const data: CachedModelData = {
      timestamp: Date.now(),
      models
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save OpenAI models to cache:', error);
  }
};

/**
 * Fetch all available models from OpenAI API
 */
export const fetchOpenAIModels = async (apiKey?: string): Promise<OpenAIModel[]> => {
  const key = await getOpenAIApiKey(apiKey);
  if (!key) {
    throw new Error('No OpenAI API key available. Please add your API key in profile settings.');
  }

  try {
    const openai = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });

    const response = await openai.models.list();
    const models = response.data;

    console.debug(`Fetched ${models.length} OpenAI models from API`);
    return models;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    throw new Error('Failed to fetch OpenAI models');
  }
};

/**
 * Convert OpenAI model to simplified ModelInfo
 */
export const convertToOpenAIModelInfo = (model: OpenAIModel): OpenAIModelInfo => {
  // OpenAI models are generally not free (except for some legacy ones)
  const isFree = model.id.includes('free') || model.owned_by === 'openai-dev';

  // Determine capabilities based on model name
  const supportsTools = !model.id.includes('instruct') && !model.id.includes('base');
  const supportsImages = model.id.includes('vision') || model.id.includes('gpt-4');
  const supportsText = true; // All OpenAI models support text

  return {
    id: model.id,
    name: model.id, // OpenAI uses ID as display name
    description: getOpenAIModelDescription(model.id),
    isFree,
    supportsTools,
    supportsImages,
    supportsText,
    company: 'openai',
    created: model.created,
    owned_by: model.owned_by,
  };
};

/**
 * Get description for OpenAI model based on ID
 */
const getOpenAIModelDescription = (modelId: string): string => {
  if (modelId.includes('gpt-4o')) {
    return 'High-intelligence flagship model for complex, multi-step tasks';
  } else if (modelId.includes('gpt-4o-mini')) {
    return 'Affordable and intelligent small model for fast, lightweight tasks';
  } else if (modelId.includes('gpt-4-turbo')) {
    return 'Previous generation high-intelligence model';
  } else if (modelId.includes('gpt-3.5-turbo')) {
    return 'Fast, inexpensive model for simple tasks';
  } else if (modelId.includes('whisper')) {
    return 'Speech recognition model for audio transcription';
  } else if (modelId.includes('tts')) {
    return 'Text-to-speech model for audio generation';
  } else if (modelId.includes('vision')) {
    return 'Vision-capable model for image understanding';
  } else {
    return `OpenAI language model - ${modelId}`;
  }
};

/**
 * Fetch models and convert to ModelInfo array (with caching)
 */
export const fetchOpenAIModelInfo = async (apiKey?: string): Promise<OpenAIModelInfo[]> => {
  // Try to load from cache first
  const cached = loadFromCache();
  if (cached) {
    console.debug('Using cached OpenAI models');
    return cached;
  }

  // Cache miss or expired, fetch from API
  console.debug('Fetching OpenAI models from API');
  const models = await fetchOpenAIModels(apiKey);
  const modelInfo = models.map(convertToOpenAIModelInfo);

  // Save to cache
  saveToCache(modelInfo);

  return modelInfo;
};

/**
 * Filter models by criteria
 */
export const filterOpenAIModels = {
  free: (models: OpenAIModelInfo[]) => models.filter(m => m.isFree),
  withTools: (models: OpenAIModelInfo[]) => models.filter(m => m.supportsTools),
  withImages: (models: OpenAIModelInfo[]) => models.filter(m => m.supportsImages),
  textOnly: (models: OpenAIModelInfo[]) => models.filter(m => m.supportsText && !m.supportsImages),
  gptOnly: (models: OpenAIModelInfo[]) => models.filter(m => m.id.includes('gpt')),
  whisper: (models: OpenAIModelInfo[]) => models.filter(m => m.id.includes('whisper')),
};

/**
 * Sort models by various criteria
 */
export const sortOpenAIModels = {
  byName: (models: OpenAIModelInfo[]) => [...models].sort((a, b) => a.name.localeCompare(b.name)),
  byDate: (models: OpenAIModelInfo[]) => [...models].sort((a, b) => b.created - a.created),
  byCapabilities: (models: OpenAIModelInfo[]) => [...models].sort((a, b) => {
    // Sort by capabilities: tools + images > tools > text only
    const scoreA = (a.supportsTools ? 2 : 0) + (a.supportsImages ? 1 : 0);
    const scoreB = (b.supportsTools ? 2 : 0) + (b.supportsImages ? 1 : 0);
    return scoreB - scoreA;
  }),
};

/**
 * Group OpenAI models by type
 */
export const groupOpenAIModelsByType = (models: OpenAIModelInfo[]): Record<string, OpenAIModelInfo[]> => {
  const groups: Record<string, OpenAIModelInfo[]> = {
    'GPT-4': [],
    'GPT-3.5': [],
    'Whisper': [],
    'TTS': [],
    'Other': [],
  };

  models.forEach(model => {
    if (model.id.includes('gpt-4')) {
      groups['GPT-4'].push(model);
    } else if (model.id.includes('gpt-3.5')) {
      groups['GPT-3.5'].push(model);
    } else if (model.id.includes('whisper')) {
      groups['Whisper'].push(model);
    } else if (model.id.includes('tts')) {
      groups['TTS'].push(model);
    } else {
      groups['Other'].push(model);
    }
  });

  // Sort models within each group by name
  Object.keys(groups).forEach(type => {
    groups[type] = sortOpenAIModels.byName(groups[type]);
  });

  // Remove empty groups
  Object.keys(groups).forEach(type => {
    if (groups[type].length === 0) {
      delete groups[type];
    }
  });

  return groups;
};
