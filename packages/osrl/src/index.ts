export * from './liquid'
export * from './Engine'
export * from './options'
export * from './types'

import { MODULE_NAME } from './constants'
import { logger as _logger } from '@plastichub/core/debug'
import { substitute as _substitute, substituteAlt as _substituteAlt } from "@plastichub/core/strings"
import { IObjectLiteral } from "@plastichub/core"

export const logger = _logger(MODULE_NAME)
export { getContext } from './Engine'
export const substitute = (alt: boolean, template: string, vars: IObjectLiteral) => alt ? _substituteAlt(template, vars) : _substitute(template, vars);

