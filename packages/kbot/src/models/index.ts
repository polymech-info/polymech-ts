import chalk from 'chalk'
import * as path from 'node:path'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'

import { logger, module_root } from '../index.js'
import { CACHE_PATH as OPENROUTER_CACHE_PATH, CachedModels as OpenRouterCachedModels, fetchOpenRouterModels, listModelsAsStrings as listOpenRouterModelsAsStrings } from './openrouter.js'
import { CACHE_PATH as OPENAI_CACHE_PATH, CachedModels as OpenAICachedModels, listModelsAsStrings as listOpenAIModelsAsStrings } from './openai.js'

import { fetchOpenAIModels } from '../models/openai.js'
import { CONFIG_DEFAULT } from '@polymech/commons'

import { models as OpenAIModels } from './cache/openai.js'
import { models as OpenRouterModels } from './cache/openrouter.js'

export const models_dist = () => {

  let or_models = OpenRouterModels
  let oai_models = OpenAIModels
  let deepseek_models = [
    {
      "id": "deepseek-chat",
      "name": "deepseek-chat"
    },
    {
      "id": "deepseek-reasoner",
      "name": "deepseek-reasoner"
    },
  ]

  const modelsOpenAIPath = path.resolve(module_root(), 'openai.json')
  if (exists(modelsOpenAIPath)) {
    oai_models = read(modelsOpenAIPath, 'json') as any
  }

  const modelsRouterPath = path.resolve(module_root(), 'openrouter.json')
  if (exists(modelsRouterPath)) {
    or_models = read(modelsRouterPath, 'json') as any
  }
  const models: string[] = []
  models.push(chalk.magenta.bold('\n OpenRouter models:\n'))
  models.push(...listOpenRouterModelsAsStrings(or_models as any))

  models.push(chalk.magenta.bold('\n OpenAI models:\n'))
  models.push(...listOpenAIModelsAsStrings(oai_models as any))
  models.push('-----\n')

  models.push(chalk.magenta.bold('\n Deepseek models:\n'))
  models.push(...listOpenAIModelsAsStrings(deepseek_models as any))
  models.push('-----\n')
  return models
}

export const models = () => {
  const models: string[] = []
  const openRouterPath = path.resolve(OPENROUTER_CACHE_PATH)
  if (!exists(openRouterPath)) {
    fetchOpenRouterModels()
  }else{
    const modelData: OpenRouterCachedModels = read(openRouterPath, 'json') as OpenRouterCachedModels
    models.push(chalk.magenta.bold('\n OpenRouter models:\n'))
    models.push(...listOpenRouterModelsAsStrings(modelData.models))
  }
  logger.debug('Openrouter models cache: ', OPENAI_CACHE_PATH)

  const openAIPath = path.resolve(OPENAI_CACHE_PATH)
  const config = CONFIG_DEFAULT() as any
  if (!exists(openAIPath) && config?.openai?.key) {
    fetchOpenAIModels(config.openai.key)
  }

  if (exists(openAIPath)) {
    const modelData: OpenAICachedModels = read(openAIPath, 'json') as OpenAICachedModels
    models.push(chalk.magenta.bold('\n OpenAI models:\n'))
    models.push(...listOpenAIModelsAsStrings(modelData.models))
  }
  logger.debug('OpenAI models cache: ', OPENAI_CACHE_PATH)
  models.push('-----\n')
  return models
}

export const all = () => {
  let models: any[] = []
  const openRouterPath = path.resolve(OPENROUTER_CACHE_PATH)
  if (!exists(openRouterPath)) {
    fetchOpenRouterModels()
  }else{
    const modelData: OpenRouterCachedModels = read(openRouterPath, 'json') as OpenRouterCachedModels
    models = models.concat(modelData.models)
  }
  const openAIPath = path.resolve(OPENAI_CACHE_PATH)
  const config = CONFIG_DEFAULT() as any
  if (!exists(openAIPath) && config?.openai?.key) {
    fetchOpenAIModels(config.openai.key)
  }

  if (exists(openAIPath)) {
    const modelData: OpenAICachedModels = read(openAIPath, 'json') as OpenAICachedModels
    models.push(chalk.magenta.bold('\n OpenAI models:\n'))
    models = models.concat(modelData.models)
  }
  return models
}
