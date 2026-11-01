import * as path from 'path'

import { resolve, resolveConfig } from '@polymech/commons'
import { isString } from '@polymech/core/primitives'
import { pathInfo, DEFAULT_ROOTS } from '@polymech/commons'

import { IOptions, TranslateFilter } from './types.js'
import { Filters } from './lib/filters.js'

export const clone = (obj) => {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export const targets = (f: string, options: IOptions) => {
    const srcParts = path.parse(f)
    const variables = {
        ...clone(options.pathVariables),
        ...DEFAULT_ROOTS
    }
    const targets = []

    variables.SRC_NAME = srcParts.name
    variables.SRC_DIR = srcParts.dir
    variables.SRC_EXT = srcParts.ext

    if (variables.ROOT) {
        variables.SRC_REL = path.relative(variables.ROOT, srcParts.dir)
    }

    const dashed = srcParts.name.split('-')
    if(dashed.length > 1){
        for (let i = 0; i < dashed.length; i++) {
            variables[`SRC_NAME-${i}`] = dashed[i]
        }
    }
    const dotted = srcParts.name.split('.')
    if (dotted.length > 1) {
        for (let i = 0; i < dotted.length; i++) {
            variables[`SRC_NAME.${i}`] = dotted[i]
        }
    }

    const underscored = srcParts.name.split('_')
    if(underscored.length > 1){
        for (let i = 0; i < underscored.length; i++) {
            variables[`SRC_NAME_${i}`] = underscored[i]
        }
    }

    if (options.targetInfo.IS_GLOB) {
        options.targetInfo.GLOB_EXTENSIONS.forEach((e) => {
            let targetPath = resolve(options.pathVariables.DST_PATH, options.alt, variables)
            targetPath = path.resolve(targetPath.replace(options.pathVariables.DST_FILE_EXT, '') + e)
            targets.push(targetPath)
        })
    } else {
        let targetPath = resolve(options.pathVariables.DST_PATH, options.alt, variables);
        //targetPath = path.resolve(targetPath.replace(options.pathVariables.DST_FILE_EXT, ''));
        targets.push(targetPath)
    }
    return targets
}


export const parse = (options: IOptions, argv: any): IOptions => {
    for (const k in argv) {
        if (!(k in options.variables) && k !== '_'
            && k !== '$0'
            && k !== 'variables'
            && k !== 'source'
            && k !== 'language'
            && k !== 'envVariables'
            && k !== 'format'
            && k !== 'profile'
            && k !== 'output'
            && k !== 'plugins'
            && k !== 'dry'
            && k !== 'stdout'
            && k !== 'filters'
            && k !== 'cache'
            && k !== 'text'
            && k !== 'keys'
            && k !== 'glossary'
            && k !== 'logLevel'
            && k !== 'bootstrap') {
            options.variables[k] = argv[k];
        }
    }

    options.variables['cwd'] = path.resolve(options.variables['cwd'] ? options.variables['cwd'] : options.cwd)
    resolveConfig(options.variables)
    let variables = {}
    let srcInfo
    if (options.src) {
        srcInfo = pathInfo(resolve(options.src, options.alt, options.variables));
        //we have glob patterns:
        if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
            options.srcInfo = srcInfo;
            for (const key in srcInfo) {
                if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                    variables['SRC_' + key] = srcInfo[key];
                }
            }
        } else {
            options.src = resolve(options.src, options.alt, options.variables);
            options.srcInfo = srcInfo
            options.srcInfo.FILES = [options.src]
        }
    }

    if (options.dst) {
        const out = resolve(options.dst, options.alt, options.variables)
        let targetInfo = pathInfo(out)
        //we have glob patterns:
        if (options.srcInfo && targetInfo) {
            targetInfo.PATH = options.dst as string;
            for (const key in targetInfo) {
                if (Object.prototype.hasOwnProperty.call(targetInfo, key)) {
                    variables['DST_' + key] = targetInfo[key]
                }
            }
            options.targetInfo = targetInfo

        } else {
            options.dst = resolve(options.dst || '', options.alt, options.variables)
        }
    } else {
        options.stdout = true
    }

    options.pathVariables = variables

    if (argv.filters && isString(argv.filters)) {
        const filters = argv.filters.split(',')
        options.filters = []
        filters.forEach((f) => {
            if (Filters[f]) {
                (options.filters as TranslateFilter[]).push(Filters[f])
            }
        })
    }
    if (argv.keys && isString(argv.keys)) {
        options.keys = argv.keys.split(',')
    }
    options.logLevel = options.logLevel || 'warn'
    options.storeRoot = options.storeRoot || '${OSR_ROOT}/i18n-store/'
    return options;
}