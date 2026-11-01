import * as path from 'path';

export const normalizeSlashes = (str: string): string[] => {
	str = path.normalize(str);
	str = str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	return str.split(/[\\\/]+/);
};

export const containsPath = (fp: string, segment: string) => {
	if (typeof fp !== 'string' || typeof segment !== 'string') {
		throw new TypeError('contains-path expects file paths to be a string.');
	}

	let prefix = '(^|\\/)';
	if (segment.indexOf('./') === 0 || segment.charAt(0) === '/') {
		prefix = '^';
	}

	let re = new RegExp(prefix + normalizeSlashes(segment).join('\\/') + '($|\\/)');
	fp = normalizeSlashes(fp).join('/');
	return re.test(fp);
};

export const normalizePath = (str: string, stripTrailing: boolean): string => {
	if (typeof str !== 'string') {
		throw new TypeError('expected a string');
	}
	str = str.replace(/[\\\/]+/g, '/');
	if (stripTrailing !== false) {
		str = str.replace(/\/$/, '');
	}
	return str;
};
