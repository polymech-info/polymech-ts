import * as CLI from 'yargs'

import { defaults, sanitize } from '../_cli'
import { IOptions } from '../types'
import { logger, IImportUser } from '../index'

import { Instance } from '../lib/discourse'

import { sync as write } from '@polymech/fs/write'

import {
    read_users, filter_invalid,
    filter_email_missing,
    updateUsers,
    filter_email_only,
    importUsers,
    filter_accepted,
    oa_user_email,
    getDataPath
} from '../lib/oa/users'

import {
    read_categories,
    read_howtos,
    read_tags,
    filter_valid
} from '../lib/oa/commons'

import {
    importHowtos, updateHowtos
} from '../lib/oa/howtos'

import {
    IOAHowtoImport
} from '../'

import { IUserPP } from '@polymech/commons'

import * as path from 'path'
import { resolve } from '@polymech/commons'
import { CONFIG_DEFAULT, DEFAULT_ROOTS } from '@polymech/commons'

const KB_ROOT = '${KB_ROOT}'

import {
    IOACategory,
    IOATag,
    IOAStep
} from '../lib/oa/types'

import { OA_LATEST } from '@polymech/commons'

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: true,
        describe: 'debug messages',
        type: 'boolean'
    }).option('src', {
        default: OA_LATEST,
        type: 'string',
    }).option('track', {
        default: '${OA_ROOT}/oa-data/howtos/latest_track.json',
        type: 'string',
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('import-howtos', 'Import oa-howtos', options, async (argv: CLI.Arguments) => {
        defaults()
        if (argv.help) { return }
        let options = (argv as any) as IOptions

        if (!options) {
            return
        }
        options.debug && logger.debug(`CLI Args In`, argv)

        const discourse = Instance()

        const _opts = {
            src: path.resolve(resolve(options.src)),
            track: path.resolve(resolve(options.track))
        } as IOptions

        let howtos = read_howtos(_opts.src)
        howtos = filter_valid(howtos)
        await importHowtos(discourse, _opts, howtos)
        await updateHowtos(discourse, _opts, howtos)
    })
}
