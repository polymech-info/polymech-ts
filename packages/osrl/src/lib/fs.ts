const fg = require('fast-glob');
export { sync as read } from '@plastichub/fs/read';
export { sync as exists } from '@plastichub/fs/exists';
export { sync as dir } from '@plastichub/fs/dir';
export { sync as write } from '@plastichub/fs/write';

const parseGlob = require('parse-glob')
const GLOB_GROUP_PATTERN = /[!*+?@]\(.*\)/

import * as fs from 'fs'

export const sizeToString = (bytes: number, si: boolean = true) => {
    var units;
    var u;
    var b = bytes;
    var thresh = si ? 1000 : 1024;
    if (Math.abs(b) < thresh) {
        return b + ' B';
    }
    units = si
        ? ['kB', 'MB', 'GB', 'TB']
        : ['KiB', 'MiB', 'GiB', 'TiB'];
    u = -1;
    do {
        b /= thresh;
        ++u;
    } while (Math.abs(b) >= thresh && u < units.length - 1);
    return b.toFixed(1) + ' ' + units[u];
};

export const getExtensions = (glob: string) => {
    const match = glob.match(GLOB_GROUP_PATTERN);
    if (match) {
        return glob.substring(match.index + 2, glob.lastIndexOf(')')).split('|');
    } else {
        return [parseGlob(glob).path.ext];
    }
}

export const isFile = (src: string) => {
    let srcIsFile = false;
    try {
        srcIsFile = fs.lstatSync(src).isFile();
    } catch (e) {

    }
    return srcIsFile;
}
export const isFolder = (src: string) => {
    let srcIsFolder = false;
    try {
        srcIsFolder = fs.lstatSync(src).isDirectory();
    } catch (e) {

    }
    return srcIsFolder;
}

export const files = (dir, glob, options?: any) => fg.sync(glob, { ...{ dot: true, cwd: dir, absolute: true }, ...options || {} }) as [];


export const forward_slash = (path) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(path);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex
    if (isExtendedLengthPath || hasNonAscii) {
        return path;
    }

    return path.replace(/\\/g, '/');
};

const jekyllNop = "---\n#jekyll\n---\n";
const frontMatter = /^---[.\r\n]*---/;

