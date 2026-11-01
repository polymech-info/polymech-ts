import { AxiosRequestConfig } from "axios";
import { Browser, Page } from 'puppeteer';
import { LocalResult, LocationSiteMeta } from './map_types.js';
export declare const STATS_SUFFIX = "_stats.json";
export declare const SESSION_EVENTS_SUFFIX = "_session.json";
export declare const TRACE_SUFFIX = "_trace.json";
export declare var scope: Scope;
export declare const extractEmail: (input: string) => string | null;
export declare const meta: (loc: LocalResult, options: any) => Promise<LocationSiteMeta | void>;
export declare const isValidUrl: (url: string) => boolean;
export declare const parseHtml: (url: string, config: AxiosRequestConfig | null, options: any) => Promise<LocationSiteMeta>;
export declare const getScope: (cliArgs?: any) => Scope;
export declare function capture_responses(scope: Scope, page: Page): Promise<void>;
export declare class Scope {
    browser: Browser;
    context: any;
    page: Page;
    args: any;
    requests: any[];
    responses: any[];
    eventBeacons: any[];
    mutationBeacons: any[];
    sessionSuffix: string;
    onResponse: any;
    onRequest: any;
    init(): Promise<void>;
}
export declare const body: (url: string) => Promise<unknown>;
