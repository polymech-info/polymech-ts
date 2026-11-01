import * as CLI from 'yargs'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { logger } from '../index.js'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: 'false',
        describe: 'debug messages'
    }).option('env_key', {
        default:'OSR-CONFIG',
        describe:'Environment key to the config path'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('info', 'info', options, async (argv: CLI.Arguments) => {
        if (argv.help) { return }
        const args:any = argv
        const src:any = CONFIG_DEFAULT(args.env_key)
        logger.debug(`Reading OSR Config with key "${argv.env_key}"`, src.deepl)
        logger.info(`Supported languages \n
            | 'BG'
            | 'CS'
            | 'DA'
            | 'DE'
            | 'EL'
            | 'EN-GB'
            | 'EN-US'
            | 'EN'
            | 'ES'
            | 'ET'
            | 'FI'
            | 'FR'
            | 'HU'
            | 'IT'
            | 'JA'
            | 'LT'
            | 'LV'
            | 'NL'
            | 'PL'
            | 'PT-PT'
            | 'PT-BR'
            | 'PT'
            | 'RO'
            | 'RU'
            | 'SK'
            | 'SL'
            | 'SV'
            | 'ZH'
        `)
    })
}
