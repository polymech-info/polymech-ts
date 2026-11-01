export * from './constants.js'
export * from './types.js'
export * from './lib/index.js'
export { Logger } from 'tslog'
import { substitute as _substitute, substituteAlt as _substituteAlt } from "@polymech/core/strings"
import { IObjectLiteral } from "@polymech/core"
export const substitute = (alt: boolean, template: string, vars: IObjectLiteral = {}) => alt ? _substituteAlt(template, vars) : _substitute(template, vars)
