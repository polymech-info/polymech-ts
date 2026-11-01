import * as path from 'path';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { resolve } from '@polymech/commons';
import { logger } from '../index.js';
import { sync as read } from '@polymech/fs/read';
import { sync as exists } from '@polymech/fs/exists';
import { home, locationString, defaultSearchParamsMapsES } from '../lib/googlemaps.js';
import { defaultEngine, defaultGoogleDomain, defaultLanguage } from '../lib/constants.js';
export const defaultOptions = (yargs) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    });
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
        default: '${POLYMECH_ROOT}/campaign/maps/${FROM}/${CATEGORY}/${QUERY}-${MM}.xls'
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
    });
};
export const defaultReportOptions = (yargs) => {
    yargs.parserConfiguration({
        "camel-case-expansion": false
    });
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
    });
};
export const parse = (argv) => {
    const args = argv;
    logger.settings.minLevel = args.logLevel || 2;
    const config = CONFIG_DEFAULT(args.env_key);
    if (!config) {
        logger.warn('No config found!');
        return;
    }
    if (config && !config.serpapi.key) {
        logger.warn('No serpapi key found in config!');
        return;
    }
    const opts = {
        query: argv.query,
        ...defaultSearchParamsMapsES(argv.query, argv.zoom),
        ...argv,
        api_key: argv.api_key || config.serpapi.key,
        geocode_key: argv.geocode_key || config.geocoder.key,
        openai: config.openai,
        headless: argv.headless ? true : false,
        bigdata: { key: config.bigdata.key },
        verb: argv.verb || 'search',
    };
    opts.source && (opts.source = path.resolve(resolve(args.source, false)));
    if (opts.source) {
        if (exists(opts.source)) {
            opts.source = read(opts.source, 'json');
        }
        else {
            logger.error(`Source file ${args.source} not found : ${opts.source}`);
            return;
        }
    }
    if (!opts.source && !opts.query) {
        logger.warn(`Invalid source and query`);
        return;
    }
    if (opts.index) {
        opts.index = path.resolve(resolve(args.index, false));
    }
    if (!opts.source) {
        opts.source = {};
        opts.source[opts.category] = [opts.query];
    }
    if (!opts.api_key) {
        logger.error('No Serpapi key found in config or options!');
        return;
    }
    if (!opts.query) {
        logger.error('No query specified');
        return;
    }
    return opts;
};
export const resolvePath = (str, query, category, opts) => {
    return path.resolve(resolve(str, false, {
        QUERY: query,
        FROM: opts.searchFrom.split(',').map((s) => s.trim()).join('/'),
        ENGINE: opts.engine,
        DOMAIN: opts.google_domain,
        LANG: opts.language,
        COUNTRY: opts.filterCountry,
        CATEGORY: category || 'unknown'
    }));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9vcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFBO0FBQzVCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFFM0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQTtBQUNwQyxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQ2hELE9BQU8sRUFBRSxJQUFJLElBQUksTUFBTSxFQUFFLE1BQU0scUJBQXFCLENBQUE7QUFDcEQsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUN0RixPQUFPLEVBQUUsYUFBYSxFQUFFLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBRXpGLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQWUsRUFBRSxFQUFFO0lBQzlDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztRQUN0QixzQkFBc0IsRUFBRSxLQUFLO0tBQ2hDLENBQUMsQ0FBQTtJQUNGLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDekIsT0FBTyxFQUFFLEtBQUs7UUFDZCxRQUFRLEVBQUUsZ0JBQWdCO1FBQzFCLElBQUksRUFBRSxTQUFTO0tBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ2YsV0FBVyxFQUFFLE9BQU87UUFDcEIsT0FBTyxFQUFFLFlBQVk7S0FDeEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUU7UUFDdkIsV0FBVyxFQUFFLGVBQWU7UUFDNUIsT0FBTyxFQUFFLG1CQUFtQjtLQUMvQixD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