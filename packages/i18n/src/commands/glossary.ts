import * as CLI from 'yargs'
import * as path from 'path'

import { pairs } from '../lib/glossary.js'
import { defaults } from '../_cli.js'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { resolve } from "@polymech/commons/variables"

const defaultOptions = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    }).option('src', {
        describe: 'Path to the input file(s). Glob patters are supported',
    }).option('dst', {
        describe: 'Target file',
    }).option('dst', {
        describe: 'Path to the output file(s). Glob patters are supported',
        default: '${SRC_DIR}/${SRC_NAME}_${DST_LANG}${SRC_EXT}'
    }).option('srcLang', {
        describe: 'Source language. Please run `osr-i18n info to see all supported languages`',
        default: ''
    }).option('cache', {
        describe: 'Cache directory',
        default: '${ROOT}/.osr/cache/i18n'
    }).option('dstLang', {
        describe: 'Target Language. Please run `osr-i18n info to see all supported languages`',
        default: 'DE'
    }).option('name', {
        describe: 'Name of the glossary',
        default: 'osr-i18n-store'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    })
}

let options = (yargs: CLI.Argv) => defaultOptions(yargs)


export const register = (cli: CLI.Argv) => {
    return cli.command('glossary <verb>', 'Manages glossaries on DeepL', options, async (argv: CLI.Arguments) => {
        defaults()

        if (argv.help) { return }
        const args: any = argv
        const config: any = CONFIG_DEFAULT(args.env_key)
        const verb = argv.verb
        if (verb === 'create') {
            /*
            let options = sanitize(argv as any) as IOptions
            if (!options) {
                logger.error(`Invalid options, abort`);
                return
            }

            let opts = parse(options, args)
            opts.config = config
            if (!opts.srcInfo) {
                logger.error(`Invalid source : ${argv.src}`, opts)
                return
            }

            if (opts.srcInfo.IS_GLOB) {
                const glob_base = globBase(opts.src)
                opts.pathVariables.ROOT = path.resolve(glob_base.base)
            } else {
                options.pathVariables.ROOT = path.resolve(opts.cwd)
            }

            opts.pathVariables['DST_LANG'] = opts.dstLang.toLocaleLowerCase()
            opts.pathVariables['SRC_LANG'] = opts.srcLang.toLocaleLowerCase()
            opts.pathVariables['CWD'] = path.resolve(opts.cwd)
            if (!opts.srcInfo || (opts.srcInfo && !opts.srcInfo.FILES)) {
                logger.error(`Have no source files for ${opts.src}`)
                return
            }
            if (opts.srcInfo && opts.srcInfo.FILES) {
                await pMap(opts.srcInfo.FILES, async (files) => {
                    await pMap(files, (source: string) => {
                        //return create(options.srcLang, options.dstLang, options, source)
                    }, { concurrency: 1 })
                })
            }
            */
        }
        if (verb === 'pairs' && argv.dst) {
            await pairs(config.deepl, path.resolve(resolve(argv.dst as string)))
        }
    })
}
