import * as path from 'path';
import { CONFIG_DEFAULT, DEFAULT_ROOTS, pathInfo, filesEx } from '@polymech/commons';
import { cleanObjectStrings } from './googlemaps-utils.js';
import { parse as parseProfile } from '@polymech/commons/profile';
import { isFile, resolve, substitute } from '@polymech/commons';
import { zodSchema, zodSchemaEach, yargsOptions, yargsOptionsEach, ResolveFlags, } from './googlemaps-zod.js';
import { parseCustomUrl, resolvePath } from './googlemaps-utils.js';
export { zodSchema, zodSchemaEach, yargsOptions, yargsOptionsEach, ResolveFlags };
import { clone } from '../options.js';
import { sync as write } from '@polymech/fs/write';
import { sync as read } from '@polymech/fs/read';
import { sync as exists } from '@polymech/fs/exists';
import { isArray, isObject } from '@polymech/core/primitives';
import pMap from 'p-map';
import { get_cached_object, set_cached_object } from '@polymech/cache/lib';
import { OSR_CACHE } from '@polymech/commons';
import { logger } from '../index.js';
import { cleanOptions, SearchProviders } from './providers.js';
import { findEMail } from './email.js';
import { defaultEngine, defaultFromLocation, defaultGoogleDomain, defaultLanguage, PAGE_SIZE, SEARCH_AI_PROMPTS } from './constants.js';
import { meta } from './html.js';
import { reverse, REVERSE_DEFAULT } from './geo.js';
import { writeReport } from '../lib/report_map.js';
import { geocode_forward } from './geo.js';
import { store as getStore } from '@polymech/registry';
import axios from 'axios';
const MODULE_NAME = 'osr-search';
const queryExtras = '';
export var SearchQueriesES;
(function (SearchQueriesES) {
    SearchQueriesES["INJECTION"] = "inyecci\u00F3n de plastico";
})(SearchQueriesES || (SearchQueriesES = {}));
export const locationString = (coords, zoom = 13) => `@${coords},${zoom}z`;
export const store = async (storePath, ns = 'osr-search') => getStore(storePath, ns);
export const getStored = async (title, storePath, ns = 'osr-search') => getStore(storePath, ns).get(title);
export const searchVendor = async (name, dst, opts) => {
    let q = name;
    let ret = await SearchProviders.scaleserp({
        api_key: opts.api_key,
        q: q + queryExtras,
    });
    let urls = ret.organic_results.filter((u) => {
        return !opts.blacklist.includes(new URL(u.link).hostname);
    });
    urls = urls.map((u) => u.link);
    dst && write(dst, urls);
    return urls;
};
export const defaultParamsGoogleES = (query, mixin) => {
    return {
        location: defaultFromLocation,
        hl: defaultLanguage,
        gl: defaultLanguage,
        google_domain: defaultGoogleDomain,
        q: query,
        ...mixin
    };
};
export const defaultSearchParamsMapsES = (query, zoom, mixin = {}) => {
    return {
        engine: defaultEngine,
        type: 'search',
        q: query,
        ll: locationString('41.6911354,2.1652746', zoom),
        google_domain: defaultGoogleDomain,
        hl: defaultLanguage,
        ...mixin,
    };
};
export const searchVendorSA = async (query, location, key, opts) => {
    const googleParams = {
        api_key: key,
        location: location,
        hl: "en",
        gl: "us",
        google_domain: "google.com",
        ...opts,
        q: query + queryExtras,
    };
    return await SearchProviders.serpApi("google", googleParams);
};
export const searchGoogleMap = async (query, key, opts) => {
    const roundCoords = (coords, decimals = 3) => {
        const [latitude, longitude, zoom] = coords.split(',').map((part, index) => {
            if (index < 2) {
                return parseFloat(parseFloat(part).toFixed(decimals));
            }
            return part;
        });
        return `@${latitude},${longitude},${zoom}`;
    };
    const googleParams = {
        ...opts,
        api_key: key,
        q: query + queryExtras,
        ll: opts.searchCoord
    };
    let results = [];
    let pageIdx = 0;
    let index = opts.index ? read(opts.index, 'json') || {} : {};
    const params = googleParams;
    let cached;
    const cache_key = {
        engine: params.engine,
        type: params.type,
        q: params.q,
        google_domain: params.google_domain,
        hl: params.hl,
        zoom: params.zoom,
        searchFrom: params.searchFrom,
        limit: params.limit
    };
    if (opts.searchCache && OSR_CACHE()) {
        cached = await get_cached_object(cache_key, MODULE_NAME);
    }
    let page = cached || await SearchProviders.serpApi(googleParams.engine, {
        ...googleParams
    });
    while (page && page.local_results) {
        page.local_results.forEach((r) => {
            r.page = pageIdx;
        });
        results.push(...page.local_results);
        if (results.length >= opts.limit)
            break;
        pageIdx++;
        page = await page.next?.();
    }
    if (page && page.place_results && !isArray(page.place_results)) {
        page.place_results = [page.place_results];
    }
    while (page && page.place_results) {
        page.place_results.forEach((r) => {
            r.page = pageIdx;
        });
        results.push(...page.place_results);
        if (results.length >= opts.limit)
            break;
        pageIdx++;
        page = await page.next?.();
    }
    if (opts.searchCache && OSR_CACHE()) {
        set_cached_object(cache_key, MODULE_NAME, results);
    }
    // Optimization: Defer expensive enrichment (photos, meta) until AFTER filtering
    // Only perform cheaper geo-enrichment (reverse geocoding) if needed for filtering
    const preFilterOpts = { ...opts, resolve: [], meta: false, findEMail: false };
    await enrichResults(results, index, preFilterOpts);
    logger.debug(`search ${query} with ${params.ll} / ${params.searchFrom} @ ${opts.zoom} | ${results.length} results before filters`);
    if (opts.filterCity) {
        results = results.filter((r) => r.geo.city.toLowerCase() === opts.filterCity.toLowerCase());
    }
    if (opts.filterCountry) {
        results = results.filter((r) => r.geo.countryName.toLowerCase() === opts.filterCountry.toLowerCase());
    }
    if (opts.filterContinent) {
        results = results.filter((r) => r.geo.continent.toLowerCase() === opts.filterContinent.toLowerCase());
    }
    if (opts.filterType) {
        results = results.filter((r) => r.type === opts.filterType);
    }
    if (opts.excludedTypes && opts.excludedTypes.length > 0) {
        results = results.filter((r) => {
            // If result has no types, keep it (conservative)
            if (!r.types || r.types.length === 0)
                return true;
            // If ANY of result types matches ANY of excluded types, filter it OUT
            return !r.types.some(t => opts.excludedTypes.includes(t));
        });
    }
    results = results.filter((r) => r.gps_coordinates);
    const beforeCached = results.length;
    const newResults = results.filter((r) => {
        return index[r.title] == null || !index[r.title].geo || !index[r.title].meta;
    });
    logger.info(`found ${newResults.length} new items for "${query}" (Zoom: ${opts.zoom} | Limit: ${opts.limit}) from "${params.searchFrom}" | ${beforeCached} total before cache filtering`);
    const processedResults = newResults.slice(0, opts.limit);
    await enrichResults(processedResults, index, opts);
    return results;
};
const enrichResults = async (results, index, opts) => {
    let idx = 0;
    await pMap(results, async (entry) => {
        idx++;
        entry.position = entry.page * PAGE_SIZE + idx;
        try {
            if (index[entry.title] && index[entry.title].geo) {
                entry.geo = index[entry.title].geo;
                return;
            }
            return reverse(entry, opts);
        }
        catch (e) {
            logger.error(`Error reverse geocoding ${entry.title}`);
            entry.geo = REVERSE_DEFAULT;
        }
    }, { concurrency: opts.concurrency });
    if (opts.meta) {
        await pMap(results, (entry) => {
            if (entry.meta || !entry.website || entry.rejected) {
                return;
            }
            try {
                if (index[entry.title] && index[entry.title].meta) {
                    entry.meta = index[entry.title].meta;
                    return;
                }
                return meta(entry, opts);
            }
            catch (e) {
                // entry.meta = {}
            }
        }, { concurrency: 1 });
    }
    if (opts.findEMail && opts.meta) {
        await pMap(results, async (entry) => {
            if (index[entry.title] && index[entry.title].email) {
                entry.email = index[entry.title].email;
                return;
            }
            if (entry.meta && entry.website && !entry.email) {
                try {
                    return findEMail(SEARCH_AI_PROMPTS.GET_EMAIL, entry.website, opts, entry);
                }
                catch (e) {
                    logger.error(`Error retrieving EMail data ${entry.title}`);
                }
            }
        }, { concurrency: 1 });
    }
    if (opts.resolve?.includes(ResolveFlags.PHOTOS)) {
        await pMap(results, async (entry) => {
            if (entry.google_media || !entry.data_id) {
                return;
            }
            if (index[entry.title] && index[entry.title].google_media) {
                entry.google_media = index[entry.title].google_media;
                return;
            }
            try {
                if (!entry.photos_link)
                    return;
                const url = `${entry.photos_link}&api_key=${opts.api_key}`;
                const response = await axios.get(url);
                const photos = response.data;
                if (photos) {
                    entry.google_media = photos;
                }
            }
            catch (e) {
                logger.error(`Error retrieving photo data for ${entry.title}`, e);
            }
        }, { concurrency: 10 });
    }
    return results;
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
    let opts = {
        query: argv.query,
        ...defaultSearchParamsMapsES(argv.query, argv.zoom),
        ...argv,
        api_key: argv.api_key || config.serpapi.key,
        geocode_key: argv.geocode_key || config.geocoder.key,
        openai: config.openai,
        headless: argv.headless ? true : false,
        bigdata: { key: config.bigdata.key }
    };
    opts = zodSchema().parse(opts);
    /*
    opts.source && isString(opts.source) && (opts.source = path.resolve(resolve(args.source, false)))
    
    if (opts.source && isString(opts.source)) {
        if (exists(opts.source)) {
            opts.source = read(opts.source, 'json')
        } else {
            logger.error(`Source file ${args.source} not found : ${opts.source}`)
            return
        }
    }
    */
    if (!opts.source && !opts.query) {
        logger.warn(`Invalid source and query`);
        return;
    }
    if (opts.index) {
        opts.index = path.resolve(resolve(opts.index, false));
    }
    if (opts.store) {
        opts.store = path.resolve(resolve(opts.store, false));
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
export const googleMaps = async (opts) => {
    opts = parse(opts);
    if (!opts) {
        logger.error('Invalid options', opts);
        return;
    }
    try {
        const searchFrom = substitute(false, opts.searchFrom, opts.variables);
        if (searchFrom && opts.geocode_key && !opts.searchCoord) {
            const coords = await geocode_forward(searchFrom, opts.geocode_key);
            if (coords) {
                opts.searchCoord = locationString(coords, opts.zoom);
            }
            else {
                logger.error(`Error geocoding "${searchFrom}"`);
            }
        }
    }
    catch (error) {
        logger.error(`Error geocoding "${opts.searchFrom}"`, error, error.stack);
    }
    let ret = [];
    const search = async (query, category, opts) => {
        opts = clone(opts);
        if (opts.dst) {
            opts.dst = resolvePath(path.join(opts.cwd || '', opts.dst || ''), query, category, opts);
            logger.debug(`output destination --dst "${opts.dst}"`);
        }
        if (opts.dst && opts.cache !== false && exists(opts.dst + '.json')) {
            const cachedPath = opts.dst + '.json';
            const cached = read(cachedPath, 'json') || [];
            logger.debug(`Searching ${opts.query} with ${opts.searchFrom} :: returning cached ${cached.length}`);
            ret = [...ret, ...cached];
            return cached;
        }
        try {
            const sr = await searchGoogleMap(query, opts.api_key, { ...opts });
            if (sr && sr.length && opts.dst) {
                write(opts.dst + '.json', sr);
                writeReport(sr, opts.dst, opts);
                const parts = path.parse(opts.dst);
                write(path.join(parts.dir, parts.name + '_options.json'), cleanOptions(opts));
            }
            ret = [...ret, ...sr];
            return sr;
        }
        catch (error) {
            logger.error('Error searching GoogleMaps : ' + error.message, error, error.stack);
            return [];
        }
    };
    // @todos : retry, ...
    const all = (await pMap(Object.keys(opts.source), (k) => {
        return pMap(opts.source[k], (t) => {
            return search(t, k, opts);
        }, {
            concurrency: 1,
        });
    }, {
        concurrency: 1,
    })).flat(2);
    if (opts.dst) {
        opts.dst = resolvePath(opts.dst, 'all', 'all', opts);
        let existingResults = [];
        if (exists(opts.dst + '.json')) {
            existingResults = read(opts.dst + '.json', 'json') || [];
        }
        // Combine, deduplicate, clean, and process URLs in a single chain
        const finalResults = Array.from([...existingResults, ...ret].reduce((map, obj) => {
            if (obj.place_id) {
                map.set(obj.place_id, obj);
            }
            return map;
        }, new Map()).values()).map(cleanObjectStrings)
            .map((r) => {
            if (r.website && typeof r.website === 'string' && r.website.startsWith('/url?q=')) {
                try {
                    const urlString = r.website.substring('/url?q='.length);
                    const decodedUrl = decodeURIComponent(urlString);
                    const urlParts = decodedUrl.split('&');
                    r.website = urlParts[0];
                }
                catch (e) {
                    logger.warn(`Could not parse website URL: ${r.website}`);
                }
            }
            return r;
        });
        write(opts.dst + '.json', finalResults);
        writeReport(finalResults, opts.dst, opts);
    }
    if (opts.index) {
        let index = read(opts.index, 'json') || {};
        ret.forEach((r) => {
            if (!index[r.title]) {
                index[r.title] = r;
            }
        });
        write(opts.index, index);
    }
    return all;
};
export const migrate = async (opts) => {
    if (!opts.store) {
        logger.error('No store provided');
        return;
    }
    if (!opts.index) {
        logger.error('No index provided');
        return;
    }
    let index = read(opts.index, 'json') || {};
    if (!isArray(index) && isObject(index)) {
        index = Object.keys(index).map((k) => index[k]);
    }
    const ns = 'osr-search';
    let _store = store(opts.store, ns);
    const ret = await pMap(index, async (r) => {
        // return _store.set(r.title, r)
    });
    return ret;
};
export const each = async (opts) => {
    logger.settings.minLevel = opts.logLevel || 2;
    let items = [];
    if (!opts.list) {
        logger.error('No list provided for each command');
        return;
    }
    let listPath = path.resolve(resolve(opts.list));
    const profile = parseProfile(opts.profile, {
        variables: {
            AREA: opts.area,
            COUNTRY: opts.country,
            ...DEFAULT_ROOTS
        }, includes: [], env: {}
    }, { env: opts.env });
    opts = parse(opts);
    if (!opts) {
        logger.error('Invalid options', opts);
        return;
    }
    if (opts.migrate) {
        return migrate(opts);
    }
    const list = await parseCustomUrl(substitute(false, opts.list, profile.variables));
    if (isArray(list)) {
        items = list;
    }
    else if (exists(listPath) && isFile(listPath) && path.parse(listPath).ext === '.json') {
        items = read(listPath, 'json') || [];
    }
    else if (pathInfo(opts.list).IS_GLOB) {
        items = filesEx(path.resolve(resolve(opts.cwd)) || './', opts.list) || [];
    }
    if (!items || items.length === 0) {
        logger.error('osr-cli::each: invalid list or empty list');
        return;
    }
    items = items.filter((item) => !!item);
    logger.debug(`${items.length} items`);
    write(path.join(path.resolve(resolve(opts.cwd), 'list.json')), items);
    const all = await pMap(items, (KEY) => {
        const variables = {
            KEY,
            TOWN: KEY,
            ...profile.variables
        };
        const googleOpts = {
            ...opts,
            query: substitute(false, opts.query, variables),
            dst: substitute(false, opts.dst, variables),
            searchFrom: substitute(false, opts.searchFrom, variables),
            variables
        };
        const ret = googleMaps(googleOpts);
        return ret;
    }, { concurrency: 1 });
    opts.log && write(path.resolve(resolve(opts.log)), all);
    return all;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ29vZ2xlbWFwcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZ29vZ2xlbWFwcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQTtBQUU1QixPQUFPLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBWSxRQUFRLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUE7QUFDOUYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFFMUQsT0FBTyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQTtBQUVqRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUUvRCxPQUFPLEVBQ0gsU0FBUyxFQUNULGFBQWEsRUFDYixZQUFZLEVBQ1osZ0JBQWdCLEVBS2hCLFlBQVksR0FDZixNQUFNLHFCQUFxQixDQUFBO0FBQzVCLE9BQU8sRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLE1BQU0sdUJBQXVCLENBQUE7QUFDbkUsT0FBTyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFvRyxZQUFZLEVBQUUsQ0FBQTtBQUVuTCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFBO0FBRXJDLE9BQU8sRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFDbEQsT0FBTyxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFBO0FBQ3BELE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFZLE1BQU0sMkJBQTJCLENBQUE7QUFDdkUsT0FBTyxJQUFJLE1BQU0sT0FBTyxDQUFBO0FBQ3hCLE9BQU8sRUFBRSxp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