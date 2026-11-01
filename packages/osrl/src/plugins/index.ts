import { TypeGuards, evalToken, evalQuotedToken } from '../liquidjs/liquid'
export * from './csv'
export const arg = function* (hash, key, context, defaultValue = null) {
    const value = hash[key]
    if (value == undefined) return defaultValue
    const ret = context.opts.dynamicPartials
        ? (TypeGuards.isQuotedToken(value)
            ? yield evalQuotedToken(value)
            : yield evalToken(value, context))
        : value.getText()

    return ret != undefined ? ret : defaultValue
}
