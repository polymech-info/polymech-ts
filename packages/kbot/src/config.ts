import * as path from 'node:path'
import { CONFIG_DEFAULT, CONFIG_DEFAULT_PATH, resolve } from '@polymech/commons'
import { sync as exists } from '@polymech/fs/exists'
import { sync as read } from '@polymech/fs/read'
import { IKBotOptions } from './zod_types.js'
import { logger  } from './index.js'
import { env_vars } from './utils/env.js'

export const loadConfig = (options: IKBotOptions) => {
    if (options.config) {
        try {
            const configPath = path.resolve(resolve(options.config,false,env_vars()))
            if ( exists(configPath) ) {
                const parsedConfig = read(configPath,'json')
                return parsedConfig
            }else{
                logger.error({ configPath }, `Config file not found: ${configPath}`)
            }
        } catch (error:any) {
            logger.error({ err: error.message }, `Failed to parse config JSON: ${error.message}`)
        }
    } else {
        // 1. OSR-CONFIG env / $HOME/.osr/.config.json
        const defaultPath = path.resolve(CONFIG_DEFAULT_PATH())
        const config = CONFIG_DEFAULT() as any
        if (config) return config

        // 2. cwd/.config.json
        const cwdPath = path.join(process.cwd(), '.config.json')
        if (exists(cwdPath)) {
            logger.debug({ configPath: cwdPath }, `Loading config from cwd: ${cwdPath}`)
            return read(cwdPath, 'json')
        }

        logger.error(
            {
                tried: [defaultPath, cwdPath],
                envKey: 'OSR-CONFIG',
                envValue: process.env['OSR-CONFIG'] ?? process.env['OSR_CONFIG'] ?? null,
            },
            `Config not found — tried: ${defaultPath}, ${cwdPath}`,
        )
        return false
    }
}


