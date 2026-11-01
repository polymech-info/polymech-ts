import * as path from 'node:path'
import { Logger }  from 'tslog'
import { sync as dir } from '@polymech/fs/dir'
import { sync as exists } from '@polymech/fs/exists'
import { sync as write } from '@polymech/fs/write'
import { MODULE_NAME } from '../constants.js'
import { IKBotTask } from '../ai-tools/index.js'

const PREFERENCES_TEMPLATE = `# Personal Preferences

This file stores personal information and preferences to help the AI assistant provide more personalized and contextual responses.

## My Preferences

Gender : 
Location : 
Language : 
Occupation : 
Age : 

## Contacts

My email address : 
My wife's email address : 
My second wife's email address : 

## Content

When creating content

- always Markdown
- always add links to sources
- when searching for news, always add links to videos
`

const CONFIG_TEMPLATE = {
  "deepl": {
    "auth_key": "YOUR_DEEPL_AUTH_KEY",
    "free_api": false
  },
  "scaleserp": {
    "key": "YOUR_SCALE_SERP_KEY"
  },
  "geocoder": {
    "key": "YOUR_GEOCODER_KEY"
  },
  "serpapi": {
    "key": "YOUR_SERPAPI_KEY"
  },
  "openai": {
    "key": "YOUR_OPENAI_KEY"
  },
  "bigdata": {
    "key": "YOUR_BIGDATA_KEY"
  },
  "novita": {
    "key": "YOUR_NOVITA_KEY"
  },
  "perplexity": {
    "key": "YOUR_PERPLEXITY_KEY"
  },
  "gemini": {
    "key": "YOUR_GEMINI_KEY"
  },
  "openrouter": {
    "key": "YOUR_OPENROUTER_KEY"
  },
  "deepseek": {
    "key": "YOUR_DEEPSEEK_KEY"
  },
  "google": {
    "cse": "YOUR_GOOGLE_CSE",
    "api_key": "YOUR_GOOGLE_API_KEY"
  }
}

export const init = async (argv: IKBotTask) => {
  const logger = new Logger<unknown>({
    hideLogPositionForProduction: true,
    maskPlaceholder: '***',
    name: MODULE_NAME,
    prettyLogTemplate: "{{logLevelName}}\t[{{filePathWithLine}}{{name}}]\t",
  })
  const kbotDir = path.resolve(path.join(process.cwd(), `.${MODULE_NAME}`))
  if (!exists(kbotDir)) {
    dir(kbotDir)
  }
  // Create preferences file if it doesn't exist
  const preferencesPath = path.resolve(kbotDir, 'preferences.md')
  if (!exists(preferencesPath)) {
    write(preferencesPath, PREFERENCES_TEMPLATE)
    logger.info(`📋 Created preferences file: ${preferencesPath}`)
  }else{
    logger.info(`📋 Preferences file already exists: ${preferencesPath}`)
  }

  // Create config file if it doesn't exist
  const configPath = path.resolve(kbotDir, 'config.json')
  if (!exists(configPath)) {
    write(configPath, CONFIG_TEMPLATE)
    logger.info(`📋 Created configuration file: ${configPath}`)
  }else{  
    logger.info(`📋 Configuration file already exists: ${configPath}`)
  }
  logger.info('📋 Initialization complete!')
  return 0
}