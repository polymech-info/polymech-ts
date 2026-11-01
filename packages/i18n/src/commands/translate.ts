
import * as CLI from 'yargs'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { translate } from '../lib/translate.js'
import { defaults, sanitize } from '../_cli.js'
import { IOptions } from '../types.js'
import { logger } from '../index.js'

export const options = (yargs: CLI.Argv) => {
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('dry', {
        default: false,
        describe: 'Process files for debug purposes only.',
        type: 'boolean'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path.'
    }).option('src', {
        describe: 'Path to the input file(s). Glob patters are supported',
    }).option('dst', {
        describe: 'Path to the output file(s). Glob patters are supported',
        default: '${SRC_DIR}/${SRC_NAME}_${DST_LANG}${SRC_EXT}'
    }).option('formality', {
        describe: 'Formality: default|more|less',
        default: 'default'
    }).option('srcLang', {
        describe: 'Source language. Please run `osr-i18n info to see all supported languages`',
        default: ''
    }).option('cache', {
        describe: 'Cache directory',
        default: '${ROOT}/.osr/cache/i18n'
    }).option('dstLang', {
        describe: 'Target Language. Please run `osr-i18n info to see all supported languages`',
        default: 'DE'
    }).option('text', {
        describe: 'Translate a given text only.'
    }).option('all', {
        describe: 'Return all translations, only supported for --text',
        default: false,
        type: 'boolean'
    }).option('alt', {
        default: false,
        describe: 'Use alternate tokenizer, & instead of $',
        type: 'boolean'
    }).option('cache', {
        default: false,
        describe: 'Enable cache',
        type: 'boolean'
    }).option('glossary', {
        default: false,
        describe: 'Enable glossary files (see osr-i18n-store/glossary)',
        type: 'boolean'
    }).option('createGlossary', {
        default: true,
        describe: 'Automatically create glossary files (see osr-i18n-store/glossary)',
        type: 'boolean'
    }).option('filters', {
        default: false,
        describe: 'Comma separated list of filters. Currently implemented  : `Hugo`',
        type: 'string'
    }).option('keys', {
        describe: 'Comma separated list of keys to be translated for key/value files.',
        type: 'string'
    }).option('query', {
        describe: 'JSONPath query for JSON and XLSX files. See https://jsonpath-plus.github.io/JSONPath/demo/, eg: $[*][0,4] to select the first and fifth column of each xlsx file',
        type: 'string'
    }).option('dumpJSON', {
        describe: 'In case of XLSX files, dump the JSON raw data',
        type: 'boolean',
        default: false
    }).option('storeRoot', {
        describe: 'i18n store root for glossaries',
        type: 'string',
        default: '${OSR_ROOT}/i18n-store/'
    }).option('store', {
        describe: 'Language store cache file',
        type: 'string',
        default: '${OSR_ROOT}/i18n-store/store-${DST_LANG}.json'
    }).option('csv-store', {
        default: false,
        describe: 'Generate CSV files for the store (manual editing)',
        type: 'boolean'
    }).option('stdout', {
        default: true,
        describe: 'Output to stdout',
        type: 'boolean'
    }).option('logLevel', {
        default: 'warn',
        describe: 'Log level: silly|debug|trace|info|warn|error|fatal',
        type: 'string'
    }).option('engine', {
        default: 'default',
        describe: 'Translation engine: default|document',
        type: 'string'
    })
}

export const handler = async (argv) => {
    if (argv.help) { return }
    const args: any = argv
    const config: any = CONFIG_DEFAULT(args.env_key)
    let options = sanitize(argv) as IOptions
    if (!options) {
        logger.error(`Invalid options, abort`)
        throw new Error('Invalid options')
    }
    await translate({ ...options, api_key: config?.deepl?.auth_key || options.api_key })
}
