import { LocalResult } from './map_types.js';
export declare const REVERSE_DEFAULT: {
    continent: string;
    countryName: string;
    city: string;
};
export declare const geocode_forward: (query: string, key: string) => Promise<string>;
export declare const reverse: (loc: LocalResult, opts: any) => Promise<void>;
