import { sync as exists } from '@polymech/fs/exists'
import { IOptions, IOptionsSync } from './types'
import { logger } from './'
import * as path from 'path'

import { forward_slash, pathInfo } from "@polymech/commons"
import { isFile, resolve } from "@polymech/commons"

import { substitute } from './index'

const globBase = require('glob-base')

export const defaults = () => {
    // default command
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    // currently no default handler, display only :
    process.on('unhandledRejection', (reason: string) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
}

export const sanitize = (argv: any): IOptionsSync | IOptions | boolean => {

    let ret: any = {
        ...argv
    }

    ret.src = argv.src
    let srcInfo
    let variables = {}

    /*
    if (ret.src) {
        ret.src = forward_slash(substitute(ret.alt,ret.src,variables))        
        // in case a file with a glob pattern is provided, strip the glob
        // this is a special case, enabling shared scripts in Alt-Tap Salamand
        const glob_base = globBase(ret.src)
        const file = ret.src.replace(glob_base.glob, '').replace(/\/$/, '')
        
        if(exists(file) && isFile(file)){
            ret.src = file
        }
        
        srcInfo = pathInfo(resolve(ret.src, ret.alt, variables))

        if (srcInfo && srcInfo.FILES && srcInfo.FILES.length) {
            ret.srcInfo = srcInfo
            for (const key in srcInfo) {
                if (Object.prototype.hasOwnProperty.call(srcInfo, key)) {
                    variables['SRC_' + key] = srcInfo[key];
                }
            }
        } else {
            ret.src = resolve(ret.src, ret.alt, variables)
        }
    }
    */

    if (argv.cwd) {
        ret.cwd = path.resolve(argv.cwd);
        if (!exists((ret.cwd))) {
            logger.error(`Invalid working directory ${argv.cwd}`)
        }
    } else {
        ret.cwd = process.cwd()
    }

    ret = {
        ...ret,
        variables,
        srcInfo
    }

    return ret
}