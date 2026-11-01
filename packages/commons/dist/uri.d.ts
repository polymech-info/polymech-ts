import { URL } from 'url';
import * as path from 'path';
export interface IDownloadUrl {
    urlParts: URL;
    pathParts: path.ParsedPath;
    filename: string;
    path: string;
    url: string;
}
export declare const parseForDownload: (url: string, dst: string) => IDownloadUrl;
