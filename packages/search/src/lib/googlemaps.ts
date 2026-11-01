import * as path from 'path'

import { CONFIG_DEFAULT, DEFAULT_ROOTS, IProfile, pathInfo, filesEx } from '@polymech/commons'
import { cleanObjectStrings } from './googlemaps-utils.js'

import { parse as parseProfile } from '@polymech/commons/profile'

import { isFile, resolve, substitute } from '@polymech/commons'

import {
    zodSchema,
    zodSchemaEach,
    yargsOptions,
    yargsOptionsEach,
    IOptionsGoogleMaps,
    IOptionsGoogleMapsInput,
    IOptionsGoogleMapsEach,
    IOptionsGoogleMapsEachInput,
    ResolveFlags,
} from './googlemaps-zod.js'
import { parseCustomUrl, resolvePath } from './googlemaps-utils.js'
export { zodSchema, zodSchemaEach, yargsOptions, yargsOptionsEach, IOptionsGoogleMaps, IOptionsGoogleMapsInput, IOptionsGoogleMapsEach, IOptionsGoogleMapsEachInput, ResolveFlags }

import { clone } from '../options.js'
import type { GoogleMapsParameters, GoogleParameters } from "serpapi"
import { sync as write } from '@polymech/fs/write'
import { sync as read } from '@polymech/fs/read'
import { sync as exists } from '@polymech/fs/exists'
import { isArray, isObject, isString } from '@polymech/core/primitives'
import pMap from 'p-map'
import { get_cached_object, set_cached_object } from '@polymech/cache/lib'
import { OSR_CACHE } from '@polymech/commons'

import { logger } from '../index.js'
import { cleanOptions, SearchProviders } from './providers.js'
import { IScaleserpSearch } from './types.js'
import { findEMail } from './email.js'
import { defaultEngine, defaultFromLocation, defaultGoogleDomain, defaultLanguage, PAGE_SIZE, SEARCH_AI_PROMPTS } from './constants.js'
import { meta } from './html.js'
import { reverse, REVERSE_DEFAULT } from './geo.js'
import { writeReport } from '../lib/report_map.js'
import { geocode_forward } from './geo.js'
import { LocalResult } from './map_types.js'
import { GoogleMapResultEx, GoogleMapResultInternal, type GoogleMapResult, type GoogleMapPhotos } from './google.js'
import { store as getStore } from '@polymech/registry'
import axios from 'axios'

const MODULE_NAME = 'osr-search'
const queryExtras = ''

export enum SearchQueriesES {
    INJECTION = 'inyección de plastico',
}
export const locationString = (coords: string, zoom: number = 13) => `@${coords},${zoom}z`

export const store = async (storePath: string, ns: string = 'osr-search') => getStore(storePath, ns) as any

export const getStored = async (title: string, storePath: string, ns: string = 'osr-search') =>
    getStore(storePath, ns).get(title)

export const searchVendor = async (name: string, dst: string, opts: IScaleserpSearch) => {
    let q = name
    let ret = await SearchProviders.scaleserp({
        api_key: opts.api_key,
        q: q + queryExtras,
    })

    let urls = ret.organic_results.filter((u) => {
        return !opts.blacklist.includes(new URL(u.link).hostname)
    })

    urls = urls.map((u) => u.link) as any
    dst && write(dst, urls)
    return urls
}
export const defaultParamsGoogleES = (query, mixin) => {
    return {
        location: defaultFromLocation,
        hl: defaultLanguage,
        gl: defaultLanguage,
        google_domain: defaultGoogleDomain,
        q: query,
        ...mixin
    }
}
export const defaultSearchParamsMapsES = (query, zoom, mixin = {}) => {
    return {
        engine: defaultEngine,
        type: 'search',
        q: query,
        ll: locationString('41.6911354,2.1652746', zoom),
        google_domain: defaultGoogleDomain,
        hl: defaultLanguage,
        ...mixin,
    }
}
export const searchVendorSA = async (
    query: string,
    location: string,
    key: string,
    opts: GoogleParameters
) => {

    const googleParams = {
        api_key: key,
        location: location,
        hl: "en",
        gl: "us",
        google_domain: "google.com",
        ...opts,
        q: query + queryExtras,
    }
    return await SearchProviders.serpApi("google", googleParams as GoogleParameters)
}
export const searchGoogleMap = async (
    query: string,
    key: string,
    opts: IOptionsGoogleMaps,
) => {

    const roundCoords = (coords: string, decimals: number = 3): string => {
        const [latitude, longitude, zoom] = coords.split(',').map((part, index) => {
            if (index < 2) {
                return parseFloat(parseFloat(part).toFixed(decimals))
            }
            return part
        })
        return `@${latitude},${longitude},${zoom}`;
    }

    const googleParams = {
        ...opts,
        api_key: key,
        q: query + queryExtras,
        ll: opts.searchCoord
    } as GoogleMapsParameters

    let results: GoogleMapResult[] = []
    let pageIdx = 0
    let index = opts.index ? (read(opts.index, 'json') as any) || {} : {}
    const params: any = googleParams
    let cached: null
    const cache_key = {
        engine: params.engine,
        type: params.type,
        q: params.q,
        google_domain: params.google_domain,
        hl: params.hl,
        zoom: params.zoom,
        searchFrom: params.searchFrom,
        limit: params.limit
    }

    if (opts.searchCache && OSR_CACHE()) {
        cached = await get_cached_object(cache_key, MODULE_NAME)
    }

    let page = cached || await SearchProviders.serpApi((googleParams as any).engine, {
        ...googleParams
    })

    while (page && page.local_results) {
        page.local_results.forEach((r) => {
            r.page = pageIdx
        })
        results.push(...page.local_results)
        if (results.length >= opts.limit) break
        pageIdx++
        page = await page.next?.()
    }

    if (page && page.place_results && !isArray(page.place_results)) {
        page.place_results = [page.place_results]
    }

    while (page && page.place_results) {
        page.place_results.forEach((r) => {
            r.page = pageIdx
        })
        results.push(...page.place_results)
        if (results.length >= opts.limit) break
        pageIdx++
        page = await page.next?.()
    }

    if (opts.searchCache && OSR_CACHE()) {
        set_cached_object(cache_key, MODULE_NAME, results)
    }

    // Optimization: Defer expensive enrichment (photos, meta) until AFTER filtering
    // Only perform cheaper geo-enrichment (reverse geocoding) if needed for filtering
    const preFilterOpts = { ...opts, resolve: [], meta: false, findEMail: false }

    await enrichResults(results as GoogleMapResult[], index, preFilterOpts)

    logger.debug(
        `search ${query} with ${params.ll} / ${params.searchFrom} @ ${opts.zoom} | ${results.length} results before filters`,
    )

    if (opts.filterCity) {
        results = results.filter((r) => r.geo.city.toLowerCase() === opts.filterCity.toLowerCase())
    }
    if (opts.filterCountry) {
        results = results.filter((r) => r.geo.countryName.toLowerCase() === opts.filterCountry.toLowerCase())
    }
    if (opts.filterContinent) {
        results = results.filter((r) => r.geo.continent.toLowerCase() === opts.filterContinent.toLowerCase())
    }
    if (opts.filterType) {
        results = results.filter((r) => r.type === opts.filterType)
    }
    if (opts.excludedTypes && opts.excludedTypes.length > 0) {
        results = results.filter((r) => {
            // If result has no types, keep it (conservative)
            if (!r.types || r.types.length === 0) return true
            // If ANY of result types matches ANY of excluded types, filter it OUT
            return !r.types.some(t => opts.excludedTypes!.includes(t))
        })
    }

    results = results.filter((r) => r.gps_coordinates)
    const beforeCached = results.length
    const newResults = results.filter((r) => {
        return index[r.title] == null || !index[r.title].geo || !index[r.title].meta
    })
    logger.info(
        `found ${newResults.length} new items for "${query}" (Zoom: ${opts.zoom} | Limit: ${opts.limit}) from "${params.searchFrom}" | ${beforeCached} total before cache filtering`,
    )
    const processedResults = newResults.slice(0, opts.limit)
    await enrichResults(processedResults, index, opts)
    return results
}

const enrichResults = async (results: GoogleMapResult[], index: any, opts: IOptionsGoogleMaps): Promise<GoogleMapResultInternal[]> => {
    let idx = 0

    await pMap(
        results,
        async (entry: any) => {
            idx++
            entry.position = entry.page * PAGE_SIZE + idx
            try {
                if (index[entry.title] && index[entry.title].geo) {
                    entry.geo = index[entry.title].geo
                    return
                }
                return reverse(entry, opts)
            } catch (e) {
                logger.error(`Error reverse geocoding ${entry.title}`)
                entry.geo = REVERSE_DEFAULT
            }
        },
        { concurrency: opts.concurrency },
    )

    if (opts.meta) {
        await pMap(
            results,
            (entry: any) => {
                if (entry.meta || !entry.website || entry.rejected) {
                    return
                }
                try {
                    if (index[entry.title] && index[entry.title].meta) {
                        entry.meta = index[entry.title].meta
                        return
                    }
                    return meta(entry, opts)
                } catch (e) {
                    // entry.meta = {}
                }
            },
            { concurrency: 1 },
        )
    }

    if (opts.findEMail && opts.meta) {
        await pMap(
            results,
            async (entry: any) => {
                if (index[entry.title] && index[entry.title].email) {
                    entry.email = index[entry.title].email
                    return
                }
                if (entry.meta && entry.website && !entry.email) {
                    try {
                        return findEMail(SEARCH_AI_PROMPTS.GET_EMAIL, entry.website, opts, entry)
                    } catch (e) {
                        logger.error(`Error retrieving EMail data ${entry.title}`)
                    }
                }
            },
            { concurrency: 1 },
        )
    }
    if (opts.resolve?.includes(ResolveFlags.PHOTOS)) {
        await pMap(
            results,
            async (entry: GoogleMapResultInternal) => {
                if (entry.google_media || !entry.data_id) {
                    return
                }
                if (index[entry.title] && index[entry.title].google_media) {
                    entry.google_media = index[entry.title].google_media
                    return
                }
                try {
                    if (!entry.photos_link) return
                    const url = `${entry.photos_link}&api_key=${opts.api_key}`
                    const response = await axios.get(url)
                    const photos: GoogleMapPhotos = response.data
                    if (photos) {
                        entry.google_media = photos
                    }
                } catch (e) {
                    logger.error(`Error retrieving photo data for ${entry.title}`, e)
                }
            },
            { concurrency: 10 },
        )
    }

    return results as GoogleMapResultInternal[]
}

export const parse = (argv: IOptionsGoogleMaps): IOptionsGoogleMaps => {
    const args: IOptionsGoogleMaps = argv
    logger.settings.minLevel = (args.logLevel as any) || 2
    const config = CONFIG_DEFAULT(args.env_key) as any
    if (!config) {
        logger.warn('No config found!')
        return
    }
    if (config && !config.serpapi.key) {
        logger.warn('No serpapi key found in config!')
        return
    }
    let opts = {
        query: argv.query as string,
        ...defaultSearchParamsMapsES(argv.query, argv.zoom),
        ...argv,
        api_key: argv.api_key || config.serpapi.key,
        geocode_key: argv.geocode_key || config.geocoder.key,
        openai: config.openai,
        headless: argv.headless ? true : false,
        bigdata: { key: config.bigdata.key }
    } as any
    opts = zodSchema().parse(opts)
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
        logger.warn(`Invalid source and query`)
        return
    }

    if (opts.index) {
        opts.index = path.resolve(resolve(opts.index, false))
    }
    if (opts.store) {
        opts.store = path.resolve(resolve(opts.store, false))
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

export const googleMaps = async (opts: IOptionsGoogleMapsInput): Promise<GoogleMapResultInternal[]> => {
    opts = parse(opts)
    if (!opts) {
        logger.error('Invalid options', opts)
        return
    }
    try {
        const searchFrom = substitute(false, opts.searchFrom, (opts as any).variables)
        if (searchFrom && opts.geocode_key && !opts.searchCoord) {
            const coords = await geocode_forward(searchFrom, opts.geocode_key)
            if (coords) {
                opts.searchCoord = locationString(coords, opts.zoom)
            } else {
                logger.error(`Error geocoding "${searchFrom}"`)
            }
        }
    } catch (error) {
        logger.error(`Error geocoding "${opts.searchFrom}"`, error, error.stack)
    }

    let ret: any[] = []
    const search = async (query: string, category, opts: any) => {
        opts = clone(opts)

        if (opts.dst) {
            opts.dst = resolvePath(path.join(opts.cwd || '', opts.dst || ''), query, category, opts)
            logger.debug(`output destination --dst "${opts.dst}"`)
        }
        if (opts.dst && opts.cache !== false && exists(opts.dst + '.json')) {
            const cachedPath = opts.dst + '.json'
            const cached = read(cachedPath, 'json') as any || []
            logger.debug(`Searching ${opts.query} with ${opts.searchFrom} :: returning cached ${cached.length}`)
            ret = [...ret, ...cached]
            return cached
        }
        try {
            const sr = await searchGoogleMap(query, opts.api_key, { ...opts })
            if (sr && sr.length && opts.dst) {
                write(opts.dst + '.json', sr)
                writeReport(sr, opts.dst, opts)
                const parts = path.parse(opts.dst)
                write(path.join(parts.dir, parts.name + '_options.json'), cleanOptions(opts))
            }
            ret = [...ret, ...sr]
            return sr
        } catch (error) {
            logger.error('Error searching GoogleMaps : ' + error.message, error, error.stack)
            return []
        }
    }
    // @todos : retry, ...
    const all: GoogleMapResultInternal[] = (await pMap(
        Object.keys(opts.source),
        (k: string) => {
            return pMap(
                opts.source[k],
                (t: string) => {
                    return search(t, k, opts)
                },
                {
                    concurrency: 1,
                },
            )
        },
        {
            concurrency: 1,
        },
    )).flat(2)


    if (opts.dst) {
        opts.dst = resolvePath(opts.dst, 'all', 'all', opts)
        let existingResults: LocalResult[] = []
        if (exists(opts.dst + '.json')) {
            existingResults = (read(opts.dst + '.json', 'json') as LocalResult[]) || []
        }
        // Combine, deduplicate, clean, and process URLs in a single chain
        const finalResults = Array.from(
            [...existingResults, ...ret].reduce((map, obj) => {
                if (obj.place_id) {
                    map.set(obj.place_id, obj)
                }
                return map
            }, new Map<string, LocalResult>()).values(),
        ).map(cleanObjectStrings)
            .map((r: any) => {
                if (r.website && typeof r.website === 'string' && r.website.startsWith('/url?q=')) {
                    try {
                        const urlString = r.website.substring('/url?q='.length)
                        const decodedUrl = decodeURIComponent(urlString)
                        const urlParts = decodedUrl.split('&')
                        r.website = urlParts[0]
                    } catch (e) {
                        logger.warn(`Could not parse website URL: ${r.website}`)
                    }
                }
                return r
            })


        write(opts.dst + '.json', finalResults)
        writeReport(finalResults, opts.dst, opts)
    }

    if (opts.index) {
        let index = (read(opts.index, 'json') as any) || {}
        ret.forEach((r) => {
            if (!index[r.title]) {
                index[r.title] = r
            }
        })
        write(opts.index, index)
    }
    return all as any
}

export const migrate = async (opts: IOptionsGoogleMapsEach) => {
    if (!opts.store) {
        logger.error('No store provided')
        return
    }
    if (!opts.index) {
        logger.error('No index provided')
        return
    }
    let index = read(opts.index, 'json') as any || {}
    if (!isArray(index) && isObject(index)) {
        index = Object.keys(index).map((k) => index[k])
    }
    const ns = 'osr-search'
    let _store = store(opts.store, ns)
    const ret = await pMap(index, async (r: LocalResult) => {
        // return _store.set(r.title, r)
    })

    return ret
}
export const each = async (opts: IOptionsGoogleMapsEach) => {
    logger.settings.minLevel = (opts.logLevel as any) || 2
    let items: string[] = []
    if (!opts.list) {
        logger.error('No list provided for each command')
        return
    }
    let listPath = path.resolve(resolve(opts.list))

    const profile: IProfile = parseProfile(opts.profile,
        {
            variables: {
                AREA: opts.area,
                COUNTRY: opts.country,
                ...DEFAULT_ROOTS
            }, includes: [], env: {}
        }, { env: opts.env })

    opts = parse(opts)
    if (!opts) {
        logger.error('Invalid options', opts)
        return
    }
    if (opts.migrate) {
        return migrate(opts)
    }
    const list = await parseCustomUrl(substitute(false, opts.list, profile.variables))

    if (isArray(list)) {
        items = list
    } else if (exists(listPath) && isFile(listPath) && path.parse(listPath).ext === '.json') {
        items = read(listPath, 'json') as [] || []
    } else if (pathInfo(opts.list).IS_GLOB) {
        items = filesEx(path.resolve(resolve(opts.cwd)) || './', opts.list) as [] || []
    }
    if (!items || items.length === 0) {
        logger.error('osr-cli::each: invalid list or empty list')
        return
    }
    items = items.filter((item) => !!item)
    logger.debug(`${items.length} items`)
    write(path.join(path.resolve(resolve(opts.cwd), 'list.json')), items)
    const all: any[] = await pMap(
        items,
        (KEY) => {
            const variables = {
                KEY,
                TOWN: KEY,
                ...profile.variables
            }
            const googleOpts: IOptionsGoogleMaps = {
                ...opts,
                query: substitute(false, opts.query, variables),
                dst: substitute(false, opts.dst, variables),
                searchFrom: substitute(false, opts.searchFrom, variables),
                variables
            }
            const ret = googleMaps(googleOpts)
            return ret
        },
        { concurrency: 1 },
    )
    opts.log && write(path.resolve(resolve(opts.log)), all)
    return all
}
