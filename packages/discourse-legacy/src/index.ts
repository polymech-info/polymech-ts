export * from './constants.js'
export * from './types.js'
export * from './lib/index.js'
export * from './lib/oa/types.js'

import { logger as _logger } from '@polymech/core/debug'

import { MODULE_NAME } from './constants'
import { ISettingsParam, Logger, ILogObject } from "tslog"
export { Logger } from 'tslog'

let loggers = {};
export const logger = _logger(MODULE_NAME)

import { substitute as _substitute, substituteAlt as _substituteAlt } from "@polymech/core/strings"

import { IObjectLiteral } from "@polymech/core"

export const substitute = (alt: boolean, template: string, vars: IObjectLiteral = {}) => alt ? _substituteAlt(template, vars) : _substitute(template, vars)
