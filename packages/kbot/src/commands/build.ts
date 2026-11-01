import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONFIG_DEFAULT } from '@polymech/commons'

import { sync as read } from '@polymech/fs/read'
import { sync as write } from '@polymech/fs/write'
import { sync as exists } from '@polymech/fs/exists'

import { logger } from '../index.js'
import { fetchOpenAIModels } from '../models/openai.js'
import { fetchOpenRouterModels } from '../models/openrouter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const generateModelEnum = (models: any[], provider: string) => {
  const enumName = `E_${provider.toUpperCase()}_MODEL`
  const enumContent = `export enum ${enumName} {
${models.map(model => `  MODEL_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`
  return enumContent
}

const generateModelEnumFree = (models: any[], provider: string) => {
  const enumName = `E_${provider.toUpperCase()}_MODEL_FREE`
  const freeModels = models.filter(model => {
    if (!model.pricing) return false
    const pricing = model.pricing
    return (
      (pricing.prompt === 0 || pricing.prompt === "0") &&
      (pricing.completion === 0 || pricing.completion === "0") &&
      (pricing.image === 0 || pricing.image === "0")
    )
  })
  const enumContent = `export enum ${enumName} {
${freeModels.map(model => `  MODEL_FREE_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`
  return enumContent
}

const generateModelEnumTools = (models: any[], provider: string) => {
  const enumName = `E_${provider.toUpperCase()}_MODEL`
  const toolModels = models.filter(model => {
    if (!model.top_provider) return false
    return model.top_provider.supports_functions === true || 
           model.top_provider.supports_function_calling === true ||
           model.top_provider.supports_tools === true
  })
  const enumContent = `export enum ${enumName} {
${toolModels.map(model => `  MODEL_TOOLS_${model.id.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = "${model.id}"`).join(',\n')}
}`
  return enumContent
}

export const build = async () => {  
  const examplesSrc =  path.resolve(__dirname, '../../docs_/examples.md')
  if(exists(examplesSrc)) {
    const examples = read(examplesSrc,'string') || ''
    const examplesPath = path.resolve(__dirname, '../src/docs-internal/examples.ts')
    write(examplesPath,`export const examples = ${JSON.stringify(examples)}`)
    logger.info(`Examples file generated " ${examplesPath}`)
  }else{
    logger.error(`Examples file not found ${examplesSrc}`)
  }

  const config = CONFIG_DEFAULT() as any
  
  const modelsOpenAI =  await fetchOpenAIModels(config.openai.key)
  const modelsOpenRouter = (await fetchOpenRouterModels()).map((model) => {
    return {
      id: model.id,
      name: model.name,
      pricing: model.pricing,
      context: model.context,
      created: model.created,
      top_provider: model.top_provider
    }
  })
  // Generate model enums
  const openAIEnumPath = path.resolve(__dirname, '../../src/models/cache/openai-models.ts')
  const openRouterEnumPath = path.resolve(__dirname, '../../src/models/cache/openrouter-models.ts')
  const openAIEnumFreePath = path.resolve(__dirname, '../../src/models/cache/openai-models-free.ts')
  const openRouterEnumFreePath = path.resolve(__dirname, '../../src/models/cache/openrouter-models-free.ts')
  const openAIEnumToolsPath = path.resolve(__dirname, '../../src/models/cache/openai-models-tools.ts')
  const openRouterEnumToolsPath = path.resolve(__dirname, '../../src/models/cache/openrouter-models-tools.ts')
    
  write(openAIEnumPath, generateModelEnum(modelsOpenAI, 'OpenAI'))
  write(openRouterEnumPath, generateModelEnum(modelsOpenRouter, 'OpenRouter'))
  write(openAIEnumFreePath, generateModelEnumFree(modelsOpenAI, 'OpenAI'))
  write(openRouterEnumFreePath, generateModelEnumFree(modelsOpenRouter, 'OpenRouter'))
  write(openAIEnumToolsPath, generateModelEnumTools(modelsOpenAI, 'OpenAI'))
  write(openRouterEnumToolsPath, generateModelEnumTools(modelsOpenRouter, 'OpenRouter'))
  logger.info('Model enums generated')

  // Write model data
  const modelsOpenAIPath = path.resolve(__dirname, '../src/models/cache/openai.ts')
  write(modelsOpenAIPath,`export const models = ${JSON.stringify(modelsOpenAI)}`)
  
  const modelsOpenRouterPath = path.resolve(__dirname, '../src/models/cache/openrouter.ts')
  write(modelsOpenRouterPath,`export const models = ${JSON.stringify(modelsOpenRouter)}`)
}
