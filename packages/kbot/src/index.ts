import { platform } from 'node:process'
import path from 'node:path'
const isWindows = platform === 'win32'

import { get_var } from '@polymech/commons'
import { MODULE_NAME } from './constants.js'
import { IKBotTask, IKBotLogger } from './ai-tools/index.js'

import { kbotLogger, createKbotLogger } from './logger.js'

export const logger: IKBotLogger = kbotLogger

let _logger: IKBotLogger = kbotLogger

export const getLogger = (options: IKBotTask): IKBotLogger => {
  if (_logger) {
    return _logger
  }
  _logger = createKbotLogger(MODULE_NAME, 'kbot')
  return _logger
}

export { run } from './commands/run.js'
export { complete_options, complete_messages, complete_params } from './commands/run.js'
export const module_root = () => path.resolve(path.join(get_var(isWindows ? 'HOMEPATH' : 'HOME'), `.${MODULE_NAME}`))

export const assistant_supported: Record<string, string> = {
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".cs": "text/x-csharp",
  ".css": "text/css",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".go": "text/x-golang",
  ".html": "text/html",
  ".java": "text/x-java",
  ".js": "text/javascript",
  ".json": "application/json",
  ".md": "text/markdown",
  ".pdf": "application/pdf",
  ".php": "text/x-php",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".py": "text/x-python",
  ".rb": "text/x-ruby",
  ".sh": "application/x-sh",
  ".tex": "text/x-tex",
  ".ts": "application/typescript",
  ".txt": "text/plain"
}
export * from './types.js'
export * from './zod_types.js'
export * from './zod_schema.js'

export { E_OPENAI_MODEL } from './models/cache/openai-models.js'
export { E_OPENROUTER_MODEL } from './models/cache/openrouter-models.js'
export { E_OPENROUTER_MODEL_FREE } from './models/cache/openrouter-models-free.js'
export type { IKBotTask } from './ai-tools/index.js'