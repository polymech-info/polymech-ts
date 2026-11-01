import * as path from 'path'
import { stringify as csv } from 'csv-stringify/sync'

const OSR_REGEX = /^[0-9].+$/
const isOSR = (filename) => filename.match(OSR_REGEX) != null

export const reportCSV = (data) => {

    const image = (path) => `![](./${(encodeURI(path))})`;
    const file = (path) => `[${path}](./${(encodeURI(path))})`;

    const qty = (filename) => {
        if (isOSR(filename)) {
            const parts = filename.split("_");
            const partsLength = parts.length;
            const token = parts[partsLength - 3];
            if (token) {
                return parseInt(token.replace('x', ''));
            }
        }
        return 'unknown';
    }

    const thickness = (filename) => {
        if (isOSR(filename)) {
            const parts = filename.split("_");
            const partsLength = parts.length;
            const token = parts[partsLength - 2];
            if (token) {
                return token;
            }
        }
        return 'unknown';
    }

    const set = data.map((d) => [
        `${path.parse(d.target).name}`,
        `${image(path.parse(d.target).name + path.parse(d.target).ext)}`,
        `${file(path.parse(d.src).name + path.parse(d.src).ext)}`,
        `${qty(path.parse(d.src).name)}`,
        `${thickness(path.parse(d.src).name)}`,
        `${isOSR(path.parse(d.src).name) ? 'Laser' : 'Unkown'}`,
        ''
    ]
    );

    const csvString = csv(set, {
        header: true,
        delimiter: ',',
        columns: { 'a': 'Name', 'b': 'Thumbnail', 'c': 'File', 'd': 'Qty', 'f': 'Thickness', 'g': 'Type', 'h': 'Missing' }
    });

    return csvString;

}
