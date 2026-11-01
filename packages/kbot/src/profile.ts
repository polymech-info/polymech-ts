import * as path from 'node:path'

import { isFile, resolve } from '@polymech/commons'
import { sync as exists } from '@polymech/fs/exists'
import { IProfile, parse } from '@polymech/commons'

import { IKBotTask } from './ai-tools/index.js'

import { env_vars } from './utils/env.js'

const testPath = (profilePath: string) => {
    if(!profilePath){
        return
    }
    const ret= path.resolve(resolve(profilePath, false, env_vars()))
    if(exists(ret)) return ret
}

export const load = async (options: IKBotTask): Promise<Record<string, string>> => {
    let profile: IProfile = { includes: [], variables: options.variables || {}, env: {} }
    let profilePath = testPath(options.profile || path.join(options.logs as string, 'profile.json'))
    if(!profilePath || !exists(profilePath) || !isFile(profilePath)){
        return profile.variables
    }
    profile = parse(profilePath, profile, { env: options.env || 'default' }) || profile
    return profile.variables
}