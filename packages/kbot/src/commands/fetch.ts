import path from 'node:path'
import { sync as write } from '@polymech/fs/write'
import { logger, module_root } from '../index.js'
import { fetchOpenAIModels } from '../models/openai.js'
import { fetchOpenRouterModels } from '../models/openrouter.js'
import { CONFIG_DEFAULT } from '@polymech/commons'

export const fetch = async () => {
  
  const config = CONFIG_DEFAULT() as any
  if (config.openai && config.openai.key) {
    const modelsOpenAI = await fetchOpenAIModels(config.openai.key)
    if (modelsOpenAI) {
      const modelsOpenAIPath = path.resolve(module_root(), 'openai.json')
      write(modelsOpenAIPath, modelsOpenAI)
      logger.info(`Fetched ${modelsOpenAI.length} OpenAI models, to ${modelsOpenAIPath}`)
    } else {
      logger.error(`Failed to fetch OpenAI models`)
    }
  }

  const modelsOpenRouter = (await fetchOpenRouterModels()).map((model) => {
    return {
      id: model.id,
      name: model.name,
      pricing: model.pricing,
      context: model.context,
      created: model.created
    }
  })
  const modelsOpenRouterPath = path.resolve(module_root(), 'openrouter.json')
  write(modelsOpenRouterPath, modelsOpenRouter)
  logger.info(`Fetched ${modelsOpenRouter.length} OpenRouter models, to ${modelsOpenRouterPath}`)
}
