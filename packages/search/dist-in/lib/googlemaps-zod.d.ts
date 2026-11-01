import { z } from 'zod';
import * as CLI from 'yargs';
export declare enum ResolveFlags {
    PHOTOS = "PHOTOS"
}
export declare const zodSchemaBase: () => z.ZodObject<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
export declare const zodSchema: () => z.ZodEffects<z.ZodObject<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
}, z.ZodTypeAny, "passthrough">>;
export declare const zodSchemaEachExtras: () => z.ZodObject<{
    logLevel: z.ZodDefault<z.ZodString>;
    log: z.ZodOptional<z.ZodString>;
    country: z.ZodString;
    area: z.ZodString;
    list: z.ZodString;
    cwd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    env: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodString>;
    migrate: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    logLevel?: string;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}, {
    logLevel?: string;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}>;
export declare const zodSchemaEach: () => z.ZodEffects<z.ZodObject<{
    api_key: z.ZodOptional<z.ZodString>;
    blacklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    cache: z.ZodDefault<z.ZodBoolean>;
    category: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    concurrency: z.ZodDefault<z.ZodNumber>;
    dst: z.ZodOptional<z.ZodString>;
    dump: z.ZodOptional<z.ZodString>;
    engine: z.ZodDefault<z.ZodString>;
    env_key: z.ZodDefault<z.ZodString>;
    filterCity: z.ZodOptional<z.ZodString>;
    filterCountry: z.ZodOptional<z.ZodString>;
    filterContinent: z.ZodOptional<z.ZodString>;
    filterType: z.ZodOptional<z.ZodString>;
    findEMail: z.ZodDefault<z.ZodBoolean>;
    geocode_key: z.ZodOptional<z.ZodString>;
    google_domain: z.ZodDefault<z.ZodString>;
    headless: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodDefault<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    meta: z.ZodDefault<z.ZodBoolean>;
    searchCache: z.ZodDefault<z.ZodBoolean>;
    query: z.ZodDefault<z.ZodString>;
    resolve: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodNativeEnum<typeof ResolveFlags>, "many">>>;
    searchCoord: z.ZodOptional<z.ZodString>;
    searchFrom: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>]>>;
    type: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    zoom: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    excludedTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    index: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodAny>;
} & {
    logLevel: z.ZodDefault<z.ZodString>;
    log: z.ZodOptional<z.ZodString>;
    country: z.ZodString;
    area: z.ZodString;
    list: z.ZodString;
    cwd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    env: z.ZodDefault<z.ZodString>;
    profile: z.ZodDefault<z.ZodString>;
    migrate: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    api_key?: string;
    type?: string;
    blacklist?: string[];
    cache?: boolean;
    category?: string;
    concurrency?: number;
    dst?: string;
    dump?: string;
    engine?: string;
    env_key?: string;
    filterCity?: string;
    filterCountry?: string;
    filterContinent?: string;
    filterType?: string;
    findEMail?: boolean;
    geocode_key?: string;
    google_domain?: string;
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    resolve?: ResolveFlags.PHOTOS[];
    searchCoord?: string;
    searchFrom?: string;
    source?: string | Record<string, string[]>;
    zoom?: number;
    excludedTypes?: string[];
    index?: string;
    store?: string;
    variables?: any;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}, {
    api_key?: string;
    type?: string;
    blacklist?: string[];
    cache?: boolean;
    category?: string;
    concurrency?: number;
    dst?: string;
    dump?: string;
    engine?: string;
    env_key?: string;
    filterCity?: string;
    filterCountry?: string;
    filterContinent?: string;
    filterType?: string;
    findEMail?: boolean;
    geocode_key?: string;
    google_domain?: string;
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    resolve?: ResolveFlags.PHOTOS[];
    searchCoord?: string;
    searchFrom?: string;
    source?: string | Record<string, string[]>;
    zoom?: number;
    excludedTypes?: string[];
    index?: string;
    store?: string;
    variables?: any;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}>, {
    api_key?: string;
    type?: string;
    blacklist?: string[];
    cache?: boolean;
    category?: string;
    concurrency?: number;
    dst?: string;
    dump?: string;
    engine?: string;
    env_key?: string;
    filterCity?: string;
    filterCountry?: string;
    filterContinent?: string;
    filterType?: string;
    findEMail?: boolean;
    geocode_key?: string;
    google_domain?: string;
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    resolve?: ResolveFlags.PHOTOS[];
    searchCoord?: string;
    searchFrom?: string;
    source?: string | Record<string, string[]>;
    zoom?: number;
    excludedTypes?: string[];
    index?: string;
    store?: string;
    variables?: any;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}, {
    api_key?: string;
    type?: string;
    blacklist?: string[];
    cache?: boolean;
    category?: string;
    concurrency?: number;
    dst?: string;
    dump?: string;
    engine?: string;
    env_key?: string;
    filterCity?: string;
    filterCountry?: string;
    filterContinent?: string;
    filterType?: string;
    findEMail?: boolean;
    geocode_key?: string;
    google_domain?: string;
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    resolve?: ResolveFlags.PHOTOS[];
    searchCoord?: string;
    searchFrom?: string;
    source?: string | Record<string, string[]>;
    zoom?: number;
    excludedTypes?: string[];
    index?: string;
    store?: string;
    variables?: any;
    log?: string;
    country?: string;
    area?: string;
    list?: string;
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}>;
export type IOptionsGoogleMaps = z.infer<ReturnType<typeof zodSchema>>;
export type IOptionsGoogleMapsInput = z.input<ReturnType<typeof zodSchema>>;
export type IOptionsGoogleMapsEach = z.infer<ReturnType<typeof zodSchemaEach>>;
export type IOptionsGoogleMapsEachInput = z.input<ReturnType<typeof zodSchemaEach>>;
export declare const yargsOptions: (yargs: CLI.Argv) => CLI.Argv;
export declare const yargsOptionsEach: (yargs: CLI.Argv) => CLI.Argv;
export declare const meta_schema: z.ZodObject<{
    og: z.ZodObject<{
        url: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        site_name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        url?: string;
        title?: string;
        site_name?: string;
    }, {
        type?: string;
        url?: string;
        title?: string;
        site_name?: string;
    }>;
    meta: z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url?: string;
        title?: string;
    }, {
        url?: string;
        title?: string;
    }>;
    links: z.ZodArray<z.ZodUnknown, "many">;
    images: z.ZodArray<z.ZodObject<{
        src: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        src?: string;
    }, {
        src?: string;
    }>, "many">;
    allLinks: z.ZodArray<z.ZodString, "many">;
    keywords: z.ZodArray<z.ZodUnknown, "many">;
    instagram: z.ZodString;
    structured: z.ZodArray<z.ZodObject<{
        "@graph": z.ZodArray<z.ZodUnion<[z.ZodObject<{
            "@id": z.ZodString;
            url: z.ZodString;
            name: z.ZodString;
            "@type": z.ZodString;
            isPartOf: z.ZodObject<{
                "@id": z.ZodString;
            }, "strip", z.ZodTypeAny, {
                "@id"?: string;
            }, {
                "@id"?: string;
            }>;
            breadcrumb: z.ZodObject<{
                "@id": z.ZodString;
            }, "strip", z.ZodTypeAny, {
                "@id"?: string;
            }, {
                "@id"?: string;
            }>;
            inLanguage: z.ZodString;
            dateModified: z.ZodString;
            datePublished: z.ZodString;
            potentialAction: z.ZodArray<z.ZodObject<{
                "@type": z.ZodString;
                target: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                "@type"?: string;
                target?: string[];
            }, {
                "@type"?: string;
                target?: string[];
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        }, {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        }>, z.ZodObject<{
            "@id": z.ZodString;
            "@type": z.ZodString;
            itemListElement: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                "@type": z.ZodString;
                position: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                name?: string;
                "@type"?: string;
                position?: number;
            }, {
                name?: string;
                "@type"?: string;
                position?: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        }, {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        }>, z.ZodObject<{
            "@id": z.ZodString;
            url: z.ZodString;
            name: z.ZodString;
            "@type": z.ZodString;
            inLanguage: z.ZodString;
            description: z.ZodString;
            potentialAction: z.ZodArray<z.ZodObject<{
                "@type": z.ZodString;
                target: z.ZodObject<{
                    "@type": z.ZodString;
                    urlTemplate: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    "@type"?: string;
                    urlTemplate?: string;
                }, {
                    "@type"?: string;
                    urlTemplate?: string;
                }>;
                "query-input": z.ZodObject<{
                    "@type": z.ZodString;
                    valueName: z.ZodString;
                    valueRequired: z.ZodBoolean;
                }, "strip", z.ZodTypeAny, {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                }, {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                }>;
            }, "strip", z.ZodTypeAny, {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }, {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        }, {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        }>]>, "many">;
        "@context": z.ZodString;
    }, "strip", z.ZodTypeAny, {
        "@graph"?: ({
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        } | {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        } | {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        })[];
        "@context"?: string;
    }, {
        "@graph"?: ({
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        } | {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        } | {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        })[];
        "@context"?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    meta?: {
        url?: string;
        title?: string;
    };
    og?: {
        type?: string;
        url?: string;
        title?: string;
        site_name?: string;
    };
    links?: unknown[];
    images?: {
        src?: string;
    }[];
    allLinks?: string[];
    keywords?: unknown[];
    instagram?: string;
    structured?: {
        "@graph"?: ({
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        } | {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        } | {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        })[];
        "@context"?: string;
    }[];
}, {
    meta?: {
        url?: string;
        title?: string;
    };
    og?: {
        type?: string;
        url?: string;
        title?: string;
        site_name?: string;
    };
    links?: unknown[];
    images?: {
        src?: string;
    }[];
    allLinks?: string[];
    keywords?: unknown[];
    instagram?: string;
    structured?: {
        "@graph"?: ({
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            isPartOf?: {
                "@id"?: string;
            };
            breadcrumb?: {
                "@id"?: string;
            };
            inLanguage?: string;
            dateModified?: string;
            datePublished?: string;
            potentialAction?: {
                "@type"?: string;
                target?: string[];
            }[];
        } | {
            "@id"?: string;
            "@type"?: string;
            itemListElement?: {
                name?: string;
                "@type"?: string;
                position?: number;
            }[];
        } | {
            url?: string;
            "@id"?: string;
            name?: string;
            "@type"?: string;
            inLanguage?: string;
            potentialAction?: {
                "@type"?: string;
                target?: {
                    "@type"?: string;
                    urlTemplate?: string;
                };
                "query-input"?: {
                    "@type"?: string;
                    valueName?: string;
                    valueRequired?: boolean;
                };
            }[];
            description?: string;
        })[];
        "@context"?: string;
    }[];
}>;
