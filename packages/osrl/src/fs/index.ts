
import * as path from 'path'
import { resolve as nodeResolve, extname } from 'path'
import { stat, statSync, readFileSync as nodeReadFileSync } from 'fs'

export { sync as dir } from '@plastichub/fs/dir'
import { sync as read } from '@plastichub/fs/read'
import { async as readAsync } from '@plastichub/fs/read'
import * as _ from '../liquid/underscore'

export const exists = (filepath: string) => statAsync(filepath).then(() => true).catch(() => false);

import { md2html } from '../filters'
import { csvToMarkdown } from '../plugins/'


const statAsync = _.promisify(stat)
const csv = (file: string) => {
    let content = read(file) as string;
    return new Promise((resolve) => {
        resolve(csvToMarkdown(content));
    });
}

const plugins = {
    '.csv': csv
}

export function readFile(filepath: string): any {
    const parts = path.parse(filepath);
    if (plugins[parts.ext]) {
        return plugins[parts.ext](filepath);
    }
    if (filepath.includes('.md.') || filepath.endsWith('.md')) {
        let content = read(filepath) as string;
        return new Promise((resolve) => {
            resolve(md2html(content));
        });
    }
    return readAsync(filepath);
}
export function existsSync(filepath: string) {
    try {
        statSync(filepath)
        return true
    } catch (err) {
        return false
    }
}
export function readFileSync(filepath: string) {
    return nodeReadFileSync(filepath, 'utf8')
}
export function resolve(root: string, file: string, ext: string) {
    if (!extname(file)) file += ext
    return nodeResolve(root, file)
}

export const defaultFS = (resolve) => {
    return {
        exists: (f) => exists(f),
        existsSync: existsSync,
        readFile: (f) => readFile(resolve(f)),
        readFileSync: readFileSync,
        resolve
    }
}