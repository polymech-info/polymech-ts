import OpenAI from 'openai'
import * as path from 'node:path'
import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'

import { logger } from '../index.js'

interface OpenAIModel {
    id: string;
    created: number;
    owned_by: string;
    root?: string;
    parent?: string | null;
}
export interface CachedModels {
    timestamp: number;
    models: OpenAIModel[];
}
import { fileURLToPath } from 'node:url';
//export const CACHE_PATH = path.resolve(path.join(path.parse(__filename).dir), 'data', 'openrouter_models.json')
const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const CACHE_PATH = path.resolve(path.join(path.parse(__dirname).dir, 'data', 'openai_models.json'))

const CACHE_DURATION = 24 * 60 * 60 * 1000

async function readFromCache(cachePath: string = CACHE_PATH): Promise<OpenAIModel[] | null> {
    try {
        if (!exists(cachePath)) {
            return null
        }
        const cacheData = read(cachePath) as CachedModels
        const now = Date.now()
        if (now - cacheData.timestamp > CACHE_DURATION) {
            //return null
        }
        return cacheData.models
    } catch (error) {
        logger.error('Error reading from cache:', error)
        return null
    }
}
function writeToCache(models: OpenAIModel[], cachePath: string = CACHE_PATH): void {
    try {
        const cacheData: CachedModels = {
            timestamp: Date.now(),
            models
        }
        write(cachePath, cacheData)
    } catch (error) {
        logger.error('Error writing to cache:', error)
    }
}
export async function fetchOpenAIModels(apiKey: string, cachePath: string = CACHE_PATH): Promise<OpenAIModel[]> {
    try {
        const openai = new OpenAI({ apiKey })
        const response = await openai.models.list()
        const models = response.data
        logger.info(`Fetched ${models.length} OpenAI models, to ${cachePath}`)
        writeToCache(models, cachePath)
        return models
    } catch (error) {
        logger.error('Error fetching OpenAI models:', error)
        throw error
    }
}
export function listModelsAsStrings(models: OpenAIModel[]): string[] {
    models = models.sort((a, b) => a.id.localeCompare(b.id))
    return models.map((model) => `${model.id}`);
}
