import { CONFIG_DEFAULT } from '@polymech/commons';
import { translate } from '../lib/translate.js';
import { sanitize } from '../_cli.js';
import { logger } from '../index.js';
export const options = (yargs) => {
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
    });
};
export const handler = async (argv) => {
    if (argv.help) {
        return;
    }
    const args = argv;
    const config = CONFIG_DEFAULT(args.env_key);
    let options = sanitize(argv);
    if (!options) {
        logger.error(`Invalid options, abort`);
        throw new Error('Invalid options');
    }
    await translate({ ...options, api_key: config?.deepl?.auth_key || options.api_key });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1hbmRzL3RyYW5zbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQy9DLE9BQU8sRUFBWSxRQUFRLEVBQUUsTUFBTSxZQUFZLENBQUE7QUFFL0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUVwQyxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLGdCQUFnQjtRQUMxQixJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLE9BQU8sRUFBRSxLQUFLO1FBQ2QsUUFBUSxFQUFFLHdDQUF3QztRQUNsRCxJQUFJLEVBQUUsU0FBUztLQUNsQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtRQUNqQixPQUFPLEVBQUUsWUFBWTtRQUNyQixRQUFRLEVBQUUscUNBQXFDO0tBQ2xELENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO1FBQ2IsUUFBUSxFQUFFLHVEQUF1RDtLQUNwRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUNiLFFBQVEsRUFBRSx3REFBd0Q7UUFDbEUsT0FBTyxFQUFFLDhDQUE4QztLQUMxRCxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtRQUNuQixRQUFRLEVBQUUsOEJBQThCO1FBQ3hDLE9BQU8sRUFBRSxTQUFTO0tBQ3JCLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO1FBQ2pCLFFBQVEsRUFBRSw0RUFBNEU7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