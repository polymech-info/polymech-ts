
import * as path from 'path';

export { sync as read } from '@polymech/fs/read';
export { sync as exists } from '@polymech/fs/exists';
export { sync as dir } from '@polymech/fs/dir';
export { sync as write } from '@polymech/fs/write';


import { Helper } from '../process/index';
import pMap from 'p-map';

const IMAGES_GLOB = '*.+(JPG|jpg|png|PNG|gif)';
import { filesEx } from '@polymech/commons/glob';
export const files = (dir, glob) => filesEx(glob, { dot: true, cwd: dir, absolute: true }) as [];
export const images = (source) => files(source, IMAGES_GLOB) as any[];
export const forward_slash = (path) => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
};

export async function resize_images(files) {
    return pMap(files, (file: string) => {
        const inParts = path.parse(file);
        const promise = Helper.run(inParts.dir, 'convert',
            [
                `"${inParts.base}"`,
                '-quality 70',
                '-resize 1980',
                '-sharpen 0x1.0',
                `"${inParts.name}${inParts.ext}"`
            ]);
        return promise;
    });
}