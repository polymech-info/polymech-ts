import * as CLI from 'yargs'
import { sync as write } from '@polymech/fs/write'

import { logger } from '../index'

import {
    test
} from '../lib/nodemailer'

import {
    sanitize,
    defaults
} from '../_cli'

import {
    IOptions
} from '../types'

export const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('src', {
        describe: 'FILE|FOLDER|GLOB',
        type: 'string',
        default: './tests/email/test.html'
    }).option('transport', {
        default: 'newsletter',
        describe: 'select the transport options with the OSR configuration',
        type: 'string'
    }).option('from', {
        default: 'newsletter@osr-plastic.org',
        describe: 'from email address',
        type: 'string'
    }).option('to', {
        default: 'cgoflyn@gmail.com',
        describe: 'to email address',
        type: 'string'
    }).option('subject', {
        default: 'Schwarzer Kater Weisser Kater',
        describe: 'the subject',
        type: 'string'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Run without conversion',
        type: 'boolean'
    }).option('logLevel', {
        describe: 'Log level : warn, info, debug, error',
        type: 'string',
        default: 'info'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)

export const register = (cli: CLI.Argv) => {
    return cli.command('test', 'Send Test EMail', options, async (argv: CLI.Arguments) => {
        defaults()
        const options = sanitize(argv) as IOptions
        logger.setSettings({
            minLevel: options.logLevel as any
        })
        logger.info("options " + argv.dst, options)
        const ret = await test(options)
        write('./tests/email/log.json', ret)
    })
}
