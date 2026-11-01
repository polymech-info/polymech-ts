import { zodSchema, zodSchemaEach, yargsOptions, yargsOptionsEach, IOptionsGoogleMaps, IOptionsGoogleMapsInput, IOptionsGoogleMapsEach, IOptionsGoogleMapsEachInput, ResolveFlags } from './googlemaps-zod.js';
export { zodSchema, zodSchemaEach, yargsOptions, yargsOptionsEach, IOptionsGoogleMaps, IOptionsGoogleMapsInput, IOptionsGoogleMapsEach, IOptionsGoogleMapsEachInput, ResolveFlags };
import type { GoogleParameters } from "serpapi";
import { IScaleserpSearch } from './types.js';
import { GoogleMapResultInternal, type GoogleMapResult } from './google.js';
export declare enum SearchQueriesES {
    INJECTION = "inyecci\u00F3n de plastico"
}
export declare const locationString: (coords: string, zoom?: number) => string;
export declare const store: (storePath: string, ns?: string) => Promise<any>;
export declare const getStored: (title: string, storePath: string, ns?: string) => Promise<any>;
export declare const searchVendor: (name: string, dst: string, opts: IScaleserpSearch) => Promise<import("./types.js").OrganicResult[]>;
export declare const defaultParamsGoogleES: (query: any, mixin: any) => any;
export declare const defaultSearchParamsMapsES: (query: any, zoom: any, mixin?: {}) => {
    engine: string;
    type: string;
    q: any;
    ll: string;
    google_domain: string;
    hl: string;
};
export declare const searchVendorSA: (query: string, location: string, key: string, opts: GoogleParameters) => Promise<import("serpapi").BaseResponse<GoogleParameters>>;
export declare const searchGoogleMap: (query: string, key: string, opts: IOptionsGoogleMaps) => Promise<GoogleMapResult[]>;
export declare const parse: (argv: IOptionsGoogleMaps) => IOptionsGoogleMaps;
export declare const googleMaps: (opts: IOptionsGoogleMapsInput) => Promise<GoogleMapResultInternal[]>;
export declare const migrate: (opts: IOptionsGoogleMapsEach) => Promise<void[]>;
export declare const each: (opts: IOptionsGoogleMapsEach) => Promise<any[]>;
