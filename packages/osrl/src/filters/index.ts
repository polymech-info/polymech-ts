import { Converter } from 'showdown'
import { html_beautify } from 'js-beautify'
import { markdownSync as markdown, markdownSync } from '../plugins/turndown'
import { IOptions } from '../types'
import { substitute } from '..'
import { logger } from '../index'

export type Filter = (src: any) => any
export type FilterMap = { [key: string]: Filter }
//////////////////////////////////////////////////////
//
// Filters
export const md2html = (content) => {
    let converter = new Converter({
        tables: true,
        parseImgDimensions: true,
        simplifiedAutoLink: true,
        tasklists: true
    });
    converter.setOption('literalMidWordUnderscores', 'true')
    return converter.makeHtml(content)
}
export const beautify = (content) => html_beautify(content, {})

//////////////////////////////////////////////////////
//
// Filter Utils
export const toFilters = (src: any, Filters: FilterMap): Filter[] => {
    src = (src || '').split(',')
    const ret: Filter[] = []
    src.forEach((f) => {
        if (Filters[f]) {
            ret.push(Filters[f])
        }
    })
    return ret
}
export const applyFilters = async (src: any, _filters: string, filters: FilterMap): Promise<string> => {
    toFilters(_filters, filters).forEach((f) => {
        let _ret = f(src)
        if (_ret) {
            src = _ret
        }
    })
    return src
}


export function cleanArray(arr: any[]): any[] {
    const uniqueItems = Array.from(new Set(arr.map(item => JSON.stringify(item))))
        .map(item => JSON.parse(item))
    return uniqueItems.filter(item => {
        if (Array.isArray(item)) {
            return item.length > 0; // Exclude empty arrays
        } else if (typeof item === 'object' && item !== null) {
            return Object.keys(item).length > 0; // Exclude empty objects
        } else if (typeof item === 'string') {
            return (item)
        }
        return true
    }).map(item => {
        if (typeof item === 'string') {
            return item
        }
        return item
    })
}
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

export const Filters = (options: IOptions): FilterMap => {
    return {
        html: md2html,
        beautify: beautify,
        substitute: (str) => substitute(false, str, options.variables),
        markdown: (str) => markdownSync(str, options, null),
        JSONParse: (str) => {
            try {
                return JSON.parse(str)
            } catch (e) {
                logger.error(`Filter Error : JSONParse: ${e} : ${str} @ ${options.source}`)
                return str
            }
        }
    }
}