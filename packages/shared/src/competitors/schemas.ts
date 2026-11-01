import { z } from 'zod/v4'

import { ZodMetaMap } from '../map.js';

import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const CompetitorSchema = z.object({
    place_id: z.string(),
    title: z.string(),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    gps_coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    operating_hours: z.record(z.string(), z.any()).optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    types: z.array(z.string()).optional().nullable(),
    continent: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    raw_data: z.record(z.string(), z.any()).optional().nullable()
})

// Shared schemas
export const GpsCoordinatesSchema = z.object({
    latitude: z.number(),
    longitude: z.number()
})

export const OperatingHoursSchema = z.object({
    sunday: z.string(),
    monday: z.string(),
    tuesday: z.string(),
    wednesday: z.string(),
    thursday: z.string(),
    friday: z.string(),
    saturday: z.string()
})

// Extension schemas
export const AccessibilityExtensionSchema = z.object({
    accessibility: z.array(z.string())
})

export const CrowdExtensionSchema = z.object({
    crowd: z.array(z.string())
})

export const ExtensionsSchema = z.array(
    z.union([AccessibilityExtensionSchema, CrowdExtensionSchema])
)

// Locality info schemas
export const AdministrativeAreaFullSchema = z.object({
    name: z.string(),
    description: z.string(),
    isoName: z.string(),
    order: z.number(),
    adminLevel: z.number(),
    isoCode: z.string(),
    wikidataId: z.string(),
    geonameId: z.number()
})

export const AdministrativeAreaMinimalSchema = z.object({
    name: z.string(),
    order: z.number(),
    adminLevel: z.number()
})

export const AdministrativeAreaWithWikidataSchema = z.object({
    name: z.string(),
    description: z.string(),
    order: z.number(),
    adminLevel: z.number(),
    wikidataId: z.string()
})

export const AdministrativeAreaWithGeonameSchema = z.object({
    name: z.string(),
    description: z.string(),
    order: z.number(),
    adminLevel: z.number(),
    wikidataId: z.string(),
    geonameId: z.number()
})

export const InformativeAreaFullSchema = z.object({
    name: z.string(),
    description: z.string(),
    isoName: z.string(),
    order: z.number(),
    isoCode: z.string(),
    wikidataId: z.string(),
    geonameId: z.number()
})

export const InformativeAreaBasicSchema = z.object({
    name: z.string(),
    description: z.string(),
    order: z.number()
})

export const InformativeAreaWithGeonameSchema = z.object({
    name: z.string(),
    description: z.string(),
    order: z.number(),
    wikidataId: z.string(),
    geonameId: z.number()
})

export const InformativeAreaWithWikidataSchema = z.object({
    name: z.string(),
    description: z.string(),
    order: z.number(),
    wikidataId: z.string()
})

export const InformativeAreaMinimalSchema = z.object({
    name: z.string(),
    order: z.number()
})

export const LocalityInfoSchema = z.object({
    administrative: z.array(
        z.union([
            AdministrativeAreaFullSchema,
            AdministrativeAreaMinimalSchema,
            AdministrativeAreaWithWikidataSchema,
            AdministrativeAreaWithGeonameSchema
        ])
    ),
    informative: z.array(
        z.union([
            InformativeAreaFullSchema,
            InformativeAreaBasicSchema,
            InformativeAreaWithGeonameSchema,
            InformativeAreaWithWikidataSchema,
            InformativeAreaMinimalSchema
        ])
    )
})

// Geo schema
export const GeoSchema = z.object({
    latitude: z.number(),
    longitude: z.number(),
    localityLanguageRequested: z.string(),
    continent: z.string(),
    continentCode: z.string(),
    countryName: z.string(),
    countryCode: z.string(),
    principalSubdivision: z.string(),
    principalSubdivisionCode: z.string(),
    city: z.string(),
    locality: z.string(),
    postcode: z.string(),
    plusCode: z.string(),
    localityInfo: LocalityInfoSchema
})

// Google Media schemas
export const SearchMetadataSchema = z.object({
    id: z.string(),
    status: z.string(),
    json_endpoint: z.string(),
    created_at: z.string(),
    processed_at: z.string(),
    google_maps_photos_url: z.string(),
    raw_html_file: z.string(),
    prettify_html_file: z.string(),
    total_time_taken: z.number()
})

export const SearchParametersSchema = z.object({
    engine: z.string(),
    data_id: z.string(),
    hl: z.string()
})

export const CategorySchema = z.object({
    title: z.string(),
    id: z.string()
})

export const PhotoSchema = z.object({
    thumbnail: z.string(),
    image: z.string(),
    photo_meta_serpapi_link: z.string()
})

export const SerpapiPaginationSchema = z.object({
    next: z.string(),
    next_page_token: z.string()
})

export const GoogleMediaSchema = z.object({
    search_metadata: SearchMetadataSchema,
    search_parameters: SearchParametersSchema,
    categories: z.array(CategorySchema),
    photos: z.array(PhotoSchema),
    serpapi_pagination: SerpapiPaginationSchema
})

// Raw data schema
export const LocationSchema = z.object({
    position: z.number(),
    title: z.string(),
    description: z.string(),
    place_id: z.string(),
    data_id: z.string(),
    data_cid: z.string(),
    reviews_link: z.string(),
    photos_link: z.string(),
    gps_coordinates: GpsCoordinatesSchema,
    place_id_search: z.string(),
    provider_id: z.string(),
    type: z.string(),
    types: z.array(z.string()),
    type_id: z.string(),
    type_ids: z.array(z.string()),
    address: z.string(),
    open_state: z.string(),
    hours: z.string(),
    operating_hours: OperatingHoursSchema,
    phone: z.string(),
    website: z.string(),
    extensions: ExtensionsSchema,
    thumbnail: z.string(),
    serpapi_thumbnail: z.string(),
    page: z.number(),
    geo: GeoSchema,
    meta: z.record(z.string(), z.any()),
    google_media: GoogleMediaSchema
}).partial()

// Main CompetitorSchemaFull
export const CompetitorSchemaFull = z.object({
    place_id: z.string(),
    title: z.string(),
    address: z.string().optional().nullable(),
    gps_coordinates: GpsCoordinatesSchema.optional().nullable(),
    phone: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    operating_hours: OperatingHoursSchema.optional().nullable(),
    thumbnail: z.string().optional().nullable(),
    types: z.array(z.string()).optional().nullable(),
    raw_data: LocationSchema.optional().nullable(),
    continent: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable()
})


export const CompetitorResponseSchema = z.object({
    message: z.string(),
    data: z.array(CompetitorSchemaFull).optional(),
})

export const CompetitorDetailResponseSchema = z.object({
    message: z.string(),
    data: CompetitorSchemaFull.optional(),
})

export type Competitor = z.infer<typeof CompetitorSchema>;
export type CompetitorResponse = z.infer<typeof CompetitorResponseSchema>;
export type CompetitorDetailResponse = z.infer<typeof CompetitorDetailResponseSchema>;
export type CompetitorFull = z.infer<typeof CompetitorSchemaFull>;


export type OptionsSchemaMeta = Record<string, unknown>

let schemaMap: ZodMetaMap<OptionsSchemaMeta>;

export const CompetitorRequestSchemaMap = () => {
    schemaMap = ZodMetaMap.create<OptionsSchemaMeta>()
    schemaMap.add(
        'location',
        z.string().default('dresden, germany') as any
        , { 'ui:group': 'Search Parameters' })
        .add(
            'query',
            z.string().default('plastichub') as any
            , { 'ui:group': 'Search Parameters' })
        .add(
            'filterCity',
            z.string().optional() as any
            , { 'ui:group': 'Filters' })
        .add(
            'filterContinent',
            z.string().optional() as any
            , { 'ui:group': 'Filters' })
        .add(
            'filterCountry',
            z.string().optional() as any
            , { 'ui:group': 'Filters' })
        .add(
            'filterType',
            z.string().optional() as any
            , { 'ui:group': 'Filters' })
        .add(
            'excludedTypes',
            z.array(z.string()).optional() as any
            , { 'ui:group': 'Filters' })
        .add(
            'concurrency',
            z.string().optional().default('5') as any
            , { 'ui:group': 'Settings' })
        .add(
            'refresh',
            z.boolean().optional().default(false) as any
            , { 'ui:group': 'Settings' })
        .add(
            'limit',
            z.string().optional().default('250') as any
            , { 'ui:group': 'Settings' })

    return schemaMap;
}

export const CompetitorRequestSchema = CompetitorRequestSchemaMap().root() as any;
export const CompetitorUISchema = CompetitorRequestSchemaMap().getUISchema();
export type LocationType = z.infer<typeof LocationSchema>;
export type CompetitorRequest = z.infer<typeof CompetitorRequestSchema>;

