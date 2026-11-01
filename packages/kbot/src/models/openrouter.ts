import axios from 'axios'
import * as path from 'node:path';

import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'

import { logger } from '../index.js'

interface ModelPricing {
  prompt: number;
  completion: number;
  image: number;
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

interface ModelContext {
  max_tokens: number;
  supported_parameters: SupportedParameter[];
}

interface TopProvider {
  context_length: number;
  max_completion_tokens: number | null;
  is_moderated: boolean;
  supports_functions?: boolean;
  supports_function_calling?: boolean;
  supports_tools?: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: ModelPricing;
  context: ModelContext;
  created: number;
  top_provider?: TopProvider;
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export interface CachedModels {
  timestamp: number;
  models: OpenRouterModel[];
}

import { fileURLToPath } from 'node:url';
//export const CACHE_PATH = path.resolve(path.join(path.parse(__filename).dir), 'data', 'openrouter_models.json')
const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const CACHE_PATH = path.resolve(path.join(path.parse(__dirname).dir, 'data', 'openrouter_models.json'))
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const readFromCache = (cachePath: string = CACHE_PATH): Promise<OpenRouterModel[] | null> => {
  try {
    if (!exists(cachePath)) {
      return null
    }
    const cacheData = read(cachePath, 'json') as CachedModels;
    const now = Date.now();
    if (now - cacheData.timestamp > CACHE_DURATION) {
      //return null
    }
    return cacheData.models as any;
  } catch (error) {
    logger.error('Error reading from cache:', error)
    return null;
  }
}
function writeToCache(models: OpenRouterModel[], cachePath: string = CACHE_PATH): void {
  const cacheData: CachedModels = {
    timestamp: Date.now(),
    models
  };
  write(cachePath, cacheData)
}

export const fetchOpenRouterModels = async (cachePath: string = CACHE_PATH): Promise<OpenRouterModel[]> => {
  try {
    // If no cache or expired, fetch from API
    const response = await axios.get<OpenRouterResponse>(
      'https://openrouter.ai/api/v1/models',
      {
        params: {
          // supported_parameters: 'tools'
        }
      }
    )
    writeToCache(response.data.data)
    logger.debug(`Fetched ${response.data.data.length} OpenRouter models to ${cachePath}`)
    return response.data.data as any[]
  } catch (error) {
    logger.error('Error fetching OpenRouter models:', error)
    throw error;
  }
}

export function findFreeModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter(
    (model) =>
      model.pricing.prompt === 0 &&
      model.pricing.completion === 0 &&
      model.pricing.image === 0
  );
}
export function findFreePromptModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter((model) => model.pricing.prompt === 0);
}

export function findFreeCompletionModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter((model) => model.pricing.completion === 0);
}

export function findFreeImageModels(models: OpenRouterModel[]): OpenRouterModel[] {
  return models.filter((model) => model.pricing.image === 0);
}
export function listModelsAsStrings(models: OpenRouterModel[]): string[] {
  models = models.sort((a, b) => a.name.localeCompare(b.name))
  return models.map((model) => {
    const isFree = model.name.includes('free')
    return `${model.id} | ${isFree ? 'free' : 'paid'}`
  })
}
