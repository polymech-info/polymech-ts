import * as CLI from 'yargs'
import * as path from 'path'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { resolve } from '@polymech/commons'

import { logger } from '../index.js'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { home, locationString, defaultSearchParamsMapsES } from '../lib/googlemaps.js'
import { defaultEngine, defaultGoogleDomain, defaultLanguage } from '../lib/constants.js'

export const defaultOptions = (yargs: CLI.Argv) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    })
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('query', {
        description: 'query',
        default: 'plastichub'
    }).option('google_domain', {
        description: 'google_domain',
        default: defaultGoogleDomain
    }).option('language', {
        description: 'Language of the search results, independent of the google search domain',
        default: defaultLanguage
    }).option('engine', {
        description: 'engine',
        default: defaultEngine
    }).option('source', {
        description: 'source of the search, JSON, eg: {"Category":["SearchTerm-1","SearchTerm2"]}'
    }).option('searchCoord', {
        description: 'search coord, comma separated: ' + locationString(home()),
        _default: locationString(home())
    }).option('category', {
        description: 'for internal use, category of the search,eg: to be used for --dst="outputpath-${CATEGORY}.json"',
    }).option('searchFrom', {
        description: 'search from this location instead of coordinates, requires an API key for geocode'
    }).option('limit', {
        describe: 'Limit results',
        type: 'number',
        default: 50
    }).option('dst', {
        description: 'dst output path, supports XLS|CSV|HTML',
        default: './test/campaign/maps/${FROM}/${CATEGORY}/${QUERY}-${MM}.xls'
    }).option('filterCountry', {
        description: ' by this country',
    }).option('filterCity', {
        description: ' by this city',
    }).option('filterType', {
        description: ' by this type, eg: Design agency, restaurant, etc',
    }).option('translate', {
        description: 'translate main page for this language (ISO code), using osr-i18n',
    }).option('dump', {
        description: 'dump every found url in this file:${DST_DIR}/${DOMAIN}-dump.json',
    }).option('meta', {
        default: true,
        describe: 'Retrieve HTML meta data',
        type: 'boolean'
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    }).option('api_key', {
        describe: 'SerpAPI key'
    }).option('geocode_key', {
        describe: 'Geocode API key'
    }).option('findEMail', {
        describe: 'Find EMail, using OpenAI & langchain webloader. Requires --meta=true',
        type: 'boolean',
        default: false
    }).option('cache', {
        describe: 'Use cache',
        type: 'boolean',
        default: true
    }).option('headless', {
        describe: 'Dont show browser',
        type: 'boolean',
        default: true
    }).option('index', {
        default: '${OSR_ROOT}/osr-directory/meta/index.json',
        type: 'string'
    })
}

export const defaultReportOptions = (yargs: CLI.Argv) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    })
    return yargs.option('debug', {
        default: false,
        describe: 'debug messages',
        type: 'boolean'
    }).option('query', {
        description: 'query',
        default: 'plastichub'
    }).option('google_domain', {
        description: 'google_domain',
        default: defaultGoogleDomain
    }).option('language', {
        description: 'Language of the search results, independent of the google search domain',
        default: defaultLanguage
    }).option('source', {
        description: 'source of the search, JSON, eg: {"Category":["SearchTerm-1","SearchTerm2"]}'
    }).option('searchCoord', {
        description: 'search coord, comma separated: ' + locationString(home()),
        _default: locationString(home())
    }).option('category', {
        description: 'for internal use, category of the search,eg: to be used for --dst="outputpath-${CATEGORY}.json"',
    }).option('searchFrom', {
        description: 'search from this location instead of coordinates, requires an API key for geocode'
    }).option('limit', {
        describe: 'Limit results',
        type: 'number',
        default: 50
    }).option('dst', {
        description: 'dst output path, supports XLS|CSV|HTML',
        default: '${POLYMECH_ROOT}/campaign/maps/${FROM}/${CATEGORY}/${QUERY}-${MM}.xls'
    }).option('country', {
        description: 'country',
    }).option('city', {
        description: 'by this city',
    }).option('type', {
        description: 'by this type, eg: Design agency, restaurant, etc',
    }).option('env_key', {
        default: 'OSR-CONFIG',
        describe: 'Environment key to the config path'
    }).option('api_key', {
        describe: 'SerpAPI key'
    }).option('cache', {
        describe: 'Use cache',
        type: 'boolean',
        default: true
    }).option('index', {
        default: '${OSR_ROOT}/osr-directory/meta/index.json',
        type: 'string'
    })
}
export const parse = (argv: any): any => {
    const args: any = argv
    logger.settings.minLevel = args.logLevel as any || 2
    const config = CONFIG_DEFAULT(args.env_key) as any
    if (!config) {
        logger.warn('No config found!')
        return
    }

    if (config && !config.serpapi.key) {
        logger.warn('No serpapi key found in config!')
        return
    }

    const opts = {
        query: argv.query as string,
        ...defaultSearchParamsMapsES(argv.query, argv.zoom),
        ...argv,
        api_key: argv.api_key || config.serpapi.key,
        geocode_key: argv.geocode_key || config.geocoder.key,
        openai: config.openai,
        headless: argv.headless ? true : false,
        bigdata: { key: config.bigdata.key },
        verb: argv.verb || 'search',
    } as any

    opts.source && (opts.source = path.resolve(resolve(args.source, false)))
    if (opts.source) {
        if (exists(opts.source)) {
            opts.source = read(opts.source, 'json')
        } else {
            logger.error(`Source file ${args.source} not found : ${opts.source}`)
            return
        }
    }
    if (!opts.source && !opts.query) {
        logger.warn(`Invalid source and query`)
        return
    }

    if (opts.index) {
        opts.index = path.resolve(resolve(args.index, false))
    }
    if (!opts.source) {
        opts.source = {}
        opts.source[opts.category] = [opts.query]
    }

    if (!opts.api_key) {
        logger.error('No Serpapi key found in config or options!')
        return
    }

    if (!opts.query) {
        logger.error('No query specified')
        return;
    }
    return opts
}

export const resolvePath = (str: string, query, category, opts: any) => {
    return path.resolve(resolve(str, false,
        {
            QUERY: query,
            FROM: opts.searchFrom.split(',').map((s) => s.trim()).join('/'),
            ENGINE: opts.engine,
            DOMAIN: opts.google_domain,
            LANG: opts.language,
            COUNTRY: opts.filterCountry,
            CATEGORY: category || 'unknown'
        }))
}