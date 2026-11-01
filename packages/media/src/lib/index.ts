import * as path from 'path'
import { sync as exists } from "@polymech/fs/exists"
import { sync as read } from "@polymech/fs/read"
import { resolve, isFile } from '@polymech/commons'

import { substitute } from '@polymech/commons'
import { IResizeOptions } from '../types.js'

export const fileAsBuffer = (path: string) => read(path, 'buffer') as Buffer || Buffer.from("-")

const clone = (obj) => {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

export const targets = (f: string, options: IResizeOptions) => {
    const srcParts = path.parse(f)
    const variables = clone(options.variables || {})
    const targets: string[] = []
    const rel = path.relative(options.srcInfo.DIR, srcParts.dir)
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {

            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            variables.SRC_EXT = srcParts.ext.replace('.', '')            
            
            let targetPath: string = substitute(options.alt, variables.DST_PATH, variables)
            targetPath = targetPath.replace(variables.DST_GLOB, '')
            if(variables.DST_FILE_EXT){
                targetPath = targetPath.replace('.' + variables.DST_FILE_EXT, '')
            }

            const parts = path.parse(targetPath)            
            //back compat
            if (variables.DST_NAME === '*') {
                variables.DST_NAME = ''
            }
            if (!parts.ext) {
                if (variables.DST_PATH.indexOf(`{SRC_NAME}`) === -1) {
                    targetPath = path.join(targetPath, rel, srcParts.name + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e)
                } else {
                    targetPath = targetPath + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e
                }
            }            
            //src.base contains dots
            if (!targetPath.endsWith('.' + e)) {
                targetPath += '.' + e
            }

            targets.push(path.resolve(targetPath))
        })
    } else {
        
        let targetPath = ''
        if (!variables.DST_PATH) {
            targetPath = path.join(srcParts.dir, srcParts.base)
        } else {
            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            variables.SRC_EXT = srcParts.ext.replace('.', '')  
            targetPath = substitute(options.alt, variables.DST_PATH, variables)
            if (isFile(f) && exists(f)) {
                // targetPath = path.join(targetPath, srcParts.base)
            } else {
                targetPath = path.join(targetPath, srcParts.base)
            }

            const targetParts = path.parse(targetPath)
            if (!targetParts.ext) {
                targetPath = path.join(targetPath, srcParts.base)
            }
        }
        targets.push(path.resolve(resolve(targetPath, options.alt, variables)));
    }
    return targets;
}

export const targetsNext = (f: string, options: IResizeOptions) => {
    const srcParts = path.parse(f)
    const variables = clone(options.variables || {})
    const targets: string[] = []
    const rel = path.relative(options.srcInfo.DIR, srcParts.dir)
    if (options.dstInfo.IS_GLOB) {
        options.dstInfo.GLOB_EXTENSIONS.forEach((e) => {

            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            variables.SRC_EXT = srcParts.ext.replace('.', '')
            
            let targetPath: string = substitute(options.alt, variables.DST_PATH, variables)
            targetPath = targetPath.replace(variables.DST_GLOB, '')
            if(variables.DST_FILE_EXT){
                targetPath = targetPath.replace('.' + variables.DST_FILE_EXT, '')
            }

            const parts = path.parse(targetPath)
            
            //back compat
            if (variables.DST_NAME === '*') {
                variables.DST_NAME = ''
            }
            if (!parts.ext) {
                if (variables.DST_PATH.indexOf(`{SRC_NAME}`) === -1) {
                    targetPath = path.join(targetPath, rel, srcParts.name + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e)
                } else {
                    targetPath = targetPath + variables.DST_NAME.replace(variables.DST_GLOB, '') + '.' + e
                }
            }            
            //src.base contains dots
            if (!targetPath.endsWith('.' + e)) {
                targetPath += '.' + e
            }

            targets.push(path.resolve(targetPath))
        })
    } else {
        
        let targetPath = ''
        if (!variables.DST_PATH) {
            targetPath = path.join(srcParts.dir, srcParts.base)
        } else {
            variables.SRC_NAME = srcParts.name
            variables.SRC_DIR = srcParts.dir
            variables.SRC_EXT = srcParts.ext.replace('.', '')
            targetPath = substitute(options.alt, variables.DST_PATH, variables)
            if (isFile(f) && exists(f)) {
                // targetPath = path.join(targetPath, srcParts.base)
            } else {
                targetPath = path.join(targetPath, srcParts.base)
            }

            const targetParts = path.parse(targetPath)
            if (!targetParts.ext) {
                targetPath = path.join(targetPath, srcParts.base)
            }
        }
        targets.push(path.resolve(resolve(targetPath, options.alt, variables)));
    }
    return targets
}
