import { resolve  } from "@polymech/commons/variables"

export * from './types.js'
export * from './cad/sw-types.js'
export * from './cad/sw-lib.js'
export * from './_cli.js'
export * from './sw_argv.js'
export * from './lib/geometry/dxf.js'

import {  Logger } from "tslog"

export function createLogger(name: string, options?: any) {
    return new Logger({
        name,
        type: 'pretty',
        ...options,
    })
}
export const defaultLogger = createLogger('DefaultLogger', {
    minLevel: 1
})

import { MODULE_NAME } from './constants.js'
export { MODULE_NAME } from './constants.js'

export const logger = createLogger(MODULE_NAME, {})

export const substitute = resolve
