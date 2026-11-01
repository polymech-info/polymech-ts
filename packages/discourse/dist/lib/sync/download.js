import * as path from 'path';
const _sanitize = require("sanitize-filename");
const filenamify = require('filenamify');
import * as download from 'download';
const URI = require("uri-js");
import * as url from 'url';
export const sanitize = (f) => {
    let str = filenamify(_sanitize(f)).replace(/[^\x00-\x7F]/g, "");
    if (str.startsWith('_')) {
        str = str.substring(1);
    }
    return str;
};
export const sanitize_ex = (f) => {
    let str = filenamify(_sanitize(f)).replace(/[^\x00-\x7F]/g, "").replace('_', '');
    return str;
};
export const filename = (_url) => {
    return path.basename(url.parse(_url).path);
};
export const imageName = (url) => {
    if (!url) {
        return "";
    }
    try {
        const parsed = URI.parse(decodeURIComponent(url));
        const pParsed = path.parse(parsed.path);
        return sanitize(decodeURIComponent(pParsed.base));
    }
    catch (error) {
        console.error('error image name : ', url);
        return "";
    }
};
export const downloadFile = async (_url, dir) => {
    return download(_url, dir, {
        filename: imageName(_url)
    });
};
//# sourceMappingURL=download.js.map