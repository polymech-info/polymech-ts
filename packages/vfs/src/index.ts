export * from './types'
export * from './_cli'
export * from './argv'

import { logger as _logger } from '@plastichub/core/debug'
import { MODULE_NAME } from './constants'

export const logger = _logger(MODULE_NAME)