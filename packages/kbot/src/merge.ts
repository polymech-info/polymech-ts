import { isString } from '@polymech/core/primitives'
import { sync as read } from '@polymech/fs/read'

import { logger } from './index.js'

import { deepmerge as merge } from 'deepmerge-ts'
export const deepMerge = async (target: string, source: any) => {
    if (!isString(target) || !source) {
        logger.error(`Invalid deepmerge parameters:`, target, source)
        return source
    }
    target = read(target, 'json') as any || []
    try {
        source = isString(source) ? JSON.parse(source) : source
    } catch (e) {
        logger.error('Error parsing completion:', e)
        return source
    }
    try {
        const ret = merge(target, source)
        return JSON.stringify(ret, null, 2)
    } catch (error) {
        logger.error('Error merging completion:', error)
    }
    return target;
}
export const mergers =
{
    json: deepMerge
}
