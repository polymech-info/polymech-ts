import { IOptions } from '../types';
export type Filter = (src: any) => any;
export type FilterMap = {
    [key: string]: Filter;
};
export declare const md2html: (content: any) => any;
export declare const beautify: (content: any) => string;
export declare const toFilters: (src: any, Filters: FilterMap) => Filter[];
export declare const applyFilters: (src: any, _filters: string, filters: FilterMap) => Promise<string>;
export declare function cleanArray(arr: any[]): any[];
export declare const isValidUrl: (url: string) => boolean;
export declare const Filters: (options: IOptions) => FilterMap;
