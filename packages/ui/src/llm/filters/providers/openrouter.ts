/**
 * OpenRouter provider implementation
 * Fetches models from OpenRouter API and provides typing/utilities
 */

import axios from 'axios';

// Types from ref/openrouter.ts
interface ModelPricing {
  prompt: string;
  completion: string;
  request: string;
  image: string;
  web_search: string;
  internal_reasoning: string;
}

export type SupportedParameter =
  | 'max_tokens'
  | 'temperature'
  | 'top_p'
  | 'tools'
  | 'tool_choice'
  | 'reasoning'
  | 'include_reasoning'
  | 'stop'
  | 'frequency_penalty'
  | 'presence_penalty'
  | 'seed'
  | 'top_k'
  | 'min_p'
  | 'repetition_penalty'
  | 'logprobs'
  | 'logit_bias'
  | 'top_logprobs'
  | 'response_format'
  | 'structured_outputs';

interface Architecture {
  modality: string;
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string | null;
}

interface TopProvider {
  context_length: number;
  max_completion_tokens: number | null;
  is_moderated: boolean;
}

interface DefaultParameters {
  temperature: number | null;
  top_p: number | null;
  frequency_penalty: number | null;
}

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  hugging_face_id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: Architecture;
  pricing: ModelPricing;
  top_provider: TopProvider;
  per_request_limits: any | null;
  supported_parameters: SupportedParameter[];
  default_parameters: DefaultParameters;
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsText: boolean;
  modality: string;
  company: string;
  pricing: {
    prompt: number;
    completion: number;
  };
}

interface CachedModelData {
  timestamp: number;
  models: ModelInfo[];
}

const CACHE_KEY = 'openrouter-models-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Fetch all available models from OpenRouter API
 */
export const fetchOpenRouterModels = async (): Promise<OpenRouterModel[]> => {
  try {
    const response = await axios.get<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/models'
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    throw new Error('Failed to fetch OpenRouter models');
  }
};

/**
 * Load models from localStorage cache
 */
const loadFromCache = (): ModelInfo[] | null => {
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
    console.error('Failed to load models from cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/**
 * Save models to localStorage cache
 */
const saveToCache = (models: ModelInfo[]): void => {
  try {
    const data: CachedModelData = {
      timestamp: Date.now(),
      models
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save models to cache:', error);
  }
};

/**
 * Extract company name from model ID
 */
const extractCompany = (modelId: string): string => {
  const parts = modelId.split('/');
  return parts.length > 1 ? parts[0] : 'Other';
};

/**
 * Convert OpenRouter model to simplified ModelInfo
 */
export const convertToModelInfo = (model: OpenRouterModel): ModelInfo => {
  const promptPrice = parseFloat(model.pricing.prompt);
  const completionPrice = parseFloat(model.pricing.completion);
  const isFree = promptPrice === 0 && completionPrice === 0;
  
  const supportsTools = model.supported_parameters.includes('tools');
  const supportsImages = model.architecture.input_modalities.includes('image');
  const supportsText = model.architecture.input_modalities.includes('text');
  
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    isFree,
    supportsTools,
    supportsImages,
    supportsText,
    modality: model.architecture.modality,
    company: extractCompany(model.id),
    pricing: {
      prompt: promptPrice,
      completion: completionPrice,
    },
  };
};

/**
 * Fetch models and convert to ModelInfo array (with caching)
 */
export const fetchOpenRouterModelInfo = async (): Promise<ModelInfo[]> => {
  // Try to load from cache first
  const cached = loadFromCache();
  if (cached) {
    console.debug('Using cached OpenRouter models');
    return cached;
  }
  
  // Cache miss or expired, fetch from API
  console.debug('Fetching OpenRouter models from API');
  const models = await fetchOpenRouterModels();
  const modelInfo = models.map(convertToModelInfo);
  
  // Save to cache
  saveToCache(modelInfo);
  
  return modelInfo;
};

/**
 * Filter models by criteria
 */
export const filterModels = {
  free: (models: ModelInfo[]) => models.filter(m => m.isFree),
  withTools: (models: ModelInfo[]) => models.filter(m => m.supportsTools),
  withImages: (models: ModelInfo[]) => models.filter(m => m.supportsImages),
  textOnly: (models: ModelInfo[]) => models.filter(m => m.supportsText && !m.supportsImages),
};

/**
 * Sort models by various criteria
 */
export const sortModels = {
  byName: (models: ModelInfo[]) => [...models].sort((a, b) => a.name.localeCompare(b.name)),
  byPrice: (models: ModelInfo[]) => [...models].sort((a, b) => 
    (a.pricing.prompt + a.pricing.completion) - (b.pricing.prompt + b.pricing.completion)
  ),
  byFree: (models: ModelInfo[]) => [...models].sort((a, b) => {
    if (a.isFree === b.isFree) return 0;
    return a.isFree ? -1 : 1;
  }),
};

/**
 * Group models by company
 */
export const groupModelsByCompany = (models: ModelInfo[]): Record<string, ModelInfo[]> => {
  const groups: Record<string, ModelInfo[]> = {};
  
  models.forEach(model => {
    const company = model.company;
    if (!groups[company]) {
      groups[company] = [];
    }
    groups[company].push(model);
  });
  
  // Sort models within each group by name
  Object.keys(groups).forEach(company => {
    groups[company] = sortModels.byName(groups[company]);
  });
  
  return groups;
};
