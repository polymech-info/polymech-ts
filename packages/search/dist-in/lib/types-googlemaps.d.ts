export interface IOptionsGoogleMaps {
    /** API Key */
    api_key?: string | undefined;
    cache?: boolean;
    category?: string;
    dst?: string;
    dump?: string | undefined;
    engine?: string;
    env_key?: string;
    filterCity?: string | undefined;
    filterCountry?: string | undefined;
    filterType?: string | undefined;
    findEMail?: boolean;
    geocode_key?: string | undefined;
    google_domain?: string;
    /** Headless mode */
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    searchCoord?: string | undefined;
    searchFrom?: string | undefined;
    source?: string | undefined;
    type?: string;
    zoom?: number;
    /** Index file */
    index?: string;
    /** Index store */
    store?: string;
}
export interface IOptionsGoogleMapsEach {
    /** API Key */
    api_key?: string | undefined;
    cache?: boolean;
    category?: string;
    dst?: string;
    dump?: string | undefined;
    engine?: string;
    env_key?: string;
    filterCity?: string | undefined;
    filterCountry?: string | undefined;
    filterType?: string | undefined;
    findEMail?: boolean;
    geocode_key?: string | undefined;
    google_domain?: string;
    /** Headless mode */
    headless?: boolean;
    language?: string;
    limit?: number;
    logLevel?: string;
    meta?: boolean;
    searchCache?: boolean;
    query?: string;
    searchCoord?: string | undefined;
    searchFrom?: string | undefined;
    source?: string | undefined;
    type?: string;
    zoom?: number;
    /** Index file */
    index?: string;
    /** Index store */
    store?: string;
    log?: string | undefined;
    /** The country to search in, variable ${COUNTRY} */
    country: string;
    /** The city to search in, variable ${AREA} */
    area: string;
    /** List of items to process, FILE|GLOB|AI-Query, provided as ${TOWN} */
    list: string;
    /** the current working directory to use, otherwise . is being assumed */
    cwd?: string;
    env?: string;
    profile?: string;
    migrate?: boolean;
}
