import { IOptionsGoogleMaps } from '../index.js';
import { IOptionsMap } from '../types.js';
import { LocalResult } from './map_types.js';
export declare const writerJSON: (locations: LocalResult[], dst: string, opts: IOptionsMap) => void;
export declare const writerXLS: (locations: LocalResult[], dst: string, opts: IOptionsMap) => any[];
export declare const WRITERS: {
    '.xls': (locations: LocalResult[], dst: string, opts: IOptionsMap) => any[];
    '.json': (locations: LocalResult[], dst: string, opts: IOptionsMap) => void;
    '.xlsx': (locations: LocalResult[], dst: string, opts: IOptionsMap) => any[];
    '.md': (locations: LocalResult[], dst: string, opts: IOptionsMap) => string;
};
export declare const writeReport: (locations: LocalResult[], dst: string, opts: IOptionsGoogleMaps) => any;
