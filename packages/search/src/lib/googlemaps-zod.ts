
import { z } from 'zod'
import * as CLI from 'yargs'
import { toYargs } from '@polymech/commons'

export enum ResolveFlags {
    PHOTOS = 'PHOTOS',
}


// Base schema without transformation - allows merging
export const zodSchemaBase = () =>
    z.object(
        {
            api_key: z.string().optional().describe('API Key'),
            blacklist: z
                .array(z.string())
                .default(['bazar.preciousplastic.com'])
                .describe('A list of hostnames to exclude from the results').optional(),
            cache: z.boolean().default(false),
            category: z.string().optional().default('category'),
            concurrency: z.number().default(3).describe('The concurrency level for async operations'),
            dst: z.string().optional().describe('${POLYMECH_ROOT}/campaign/maps/${FROM}/${CATEGORY}/${QUERY}-10.xls'),
            dump: z.string().optional(),
            engine: z.string().default('google_maps'),
            env_key: z.string().default('OSR-CONFIG'),
            filterCity: z.string().optional(),
            filterCountry: z.string().optional(),
            filterContinent: z.string().optional(),
            filterType: z.string().optional(),
            findEMail: z.boolean().default(false),
            geocode_key: z.string().optional(),
            google_domain: z.string().default('google.com'),
            headless: z.boolean().default(true).describe('Headless mode'),
            language: z.string().default('en'),
            limit: z.number().default(250),
            logLevel: z.string().default('info'),
            meta: z.boolean().default(false),
            searchCache: z.boolean().default(false).describe('Use search cache'),
            query: z.string().default('plastichub'),
            resolve: z.array(z.nativeEnum(ResolveFlags)).default([ResolveFlags.PHOTOS]).optional(),
            searchCoord: z.string().optional(),
            searchFrom: z.string().optional().default('barcelona, spain'),
            source: z.union([z.string(), z.record(z.string(), z.array(z.string()))]).optional(),
            type: z.string().optional().default('search'),
            zoom: z.number().optional().default(12),
            excludedTypes: z.array(z.string()).optional().describe('Types to exclude'),
            //index: z.string().optional().default('${OSR_ROOT}/osr-directory/meta/index.json').describe('Index file'),
            //store: z.string().optional().default('${OSR_ROOT}/osr-directory/meta/index.db').describe('Index store'),
            index: z.string().optional().describe('Index file'),
            store: z.string().optional().describe('Index store'),
            variables: z.any().optional(),
        })
        .passthrough()

// Schema with transformation applied
export const zodSchema = () =>
    zodSchemaBase()
        .transform((data) => {
            if (!data.source) {
                data.source = {
                    [data.category || 'unknown']: [data.query],
                }
            }
            return data
        })

export const zodSchemaEachExtras = () =>
    z.object({
        logLevel: z.string().default('info'),
        log: z.string().optional(),
        country: z.string().describe('The country to search in, variable ${COUNTRY}'),
        area: z.string().describe('The city to search in, variable ${AREA}'),
        list: z.string().describe('List of items to process, FILE|GLOB|AI-Query, provided as ${TOWN}'),
        cwd: z.string().optional().default('./').describe('the current working directory to use, otherwise . is being assumed'),
        env: z.string().default(''),
        profile: z.string().default('${OSR_ROOT}/osr-templates/osrl/.osrl.json'),
        migrate: z.boolean().default(false),
    })

// Merge the base schemas first, then apply transformation
export const zodSchemaEach = () =>
    zodSchemaBase()
        .merge(zodSchemaEachExtras())
        .transform((data) => {
            if (!data.source) {
                data.source = {
                    [data.category || 'unknown']: [data.query],
                }
            }
            return data
        })
        .describe('IOptionsGoogleMapsEach')

export type IOptionsGoogleMaps = z.infer<ReturnType<typeof zodSchema>>
export type IOptionsGoogleMapsInput = z.input<ReturnType<typeof zodSchema>>
export type IOptionsGoogleMapsEach = z.infer<ReturnType<typeof zodSchemaEach>>
export type IOptionsGoogleMapsEachInput = z.input<ReturnType<typeof zodSchemaEach>>

export const yargsOptions = (yargs: CLI.Argv) => toYargs(yargs as any, zodSchema() as any)
export const yargsOptionsEach = (yargs: CLI.Argv) => toYargs(yargs as any, zodSchemaEach() as any)


export const meta_schema = z.object({
    og: z.object({
        url: z.string(),
        type: z.string(),
        title: z.string(),
        site_name: z.string()
    }),
    meta: z.object({ url: z.string(), title: z.string() }),
    links: z.array(z.unknown()),
    images: z.array(z.object({ src: z.string() })),
    allLinks: z.array(z.string()),
    keywords: z.array(z.unknown()),
    instagram: z.string(),
    structured: z.array(
        z.object({
            "@graph": z.array(
                z.union([
                    z.object({
                        "@id": z.string(),
                        url: z.string(),
                        name: z.string(),
                        "@type": z.string(),
                        isPartOf: z.object({ "@id": z.string() }),
                        breadcrumb: z.object({ "@id": z.string() }),
                        inLanguage: z.string(),
                        dateModified: z.string(),
                        datePublished: z.string(),
                        potentialAction: z.array(
                            z.object({ "@type": z.string(), target: z.array(z.string()) })
                        )
                    }),
                    z.object({
                        "@id": z.string(),
                        "@type": z.string(),
                        itemListElement: z.array(
                            z.object({
                                name: z.string(),
                                "@type": z.string(),
                                position: z.number()
                            })
                        )
                    }),
                    z.object({
                        "@id": z.string(),
                        url: z.string(),
                        name: z.string(),
                        "@type": z.string(),
                        inLanguage: z.string(),
                        description: z.string(),
                        potentialAction: z.array(
                            z.object({
                                "@type": z.string(),
                                target: z.object({
                                    "@type": z.string(),
                                    urlTemplate: z.string()
                                }),
                                "query-input": z.object({
                                    "@type": z.string(),
                                    valueName: z.string(),
                                    valueRequired: z.boolean()
                                })
                            })
                        )
                    })
                ])
            ),
            "@context": z.string()
        })
    )
})
