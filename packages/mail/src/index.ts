export * from './constants.js'
export * from './types.js'
export * from './lib/index.js'

import { Logger, ILogObj } from 'tslog'
import { createLogger } from '@polymech/log'
import { MODULE_NAME } from './constants.js'

export const logger = createLogger(MODULE_NAME) as unknown as Logger<ILogObj>
