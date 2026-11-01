import { defaultFS } from '../fs'
import { Liquid } from '../liquidjs/liquid'
import { LiquidOptions } from '../liquidjs/liquid-options'
import { IOptions } from '../types'
import * as _ from './underscore'
export { sync as dir } from '@plastichub/fs/dir'

export const engine = (options) => {
    const engine = new Liquid(options)
    return engine
}

export const engineDefault = (options) => {
    const delimitters = options.language === 'osr' ?
        {
            tagDelimiterLeft: '[%',
            tagDelimiterRight: '%]',
            outputDelimiterLeft: '[[',
            outputDelimiterRight: ']]'
        } : {}

    const lOptions: LiquidOptions = {
        keepOutputType: true,
        trimOutputRight: false,
        trimOutputLeft: false,
        trimTagRight: false,
        trimTagLeft: false,
        greedy: false,
        cache: false,
        ...options,
        ...delimitters,
    };    
    return new Liquid(lOptions)
}
/**
 *
 * @param string
 * @param vars
 * @param options
 * @see https://liquidjs.com/tags/overview.html
 * @returns
 */
export async function parseText(string: string, vars: any, iterations: number = 5, options: IOptions = null) {
    const l = engine(options)
    options = {
        fs: defaultFS(options.resolve),
        ...options,
    } as any;
    let t = await l.parseAndRender(string, vars, options as any);
    for (let i = 0; i < iterations; i++) {
        t = await l.parseAndRender(t, vars, options as any);
    }
    return t;
}
