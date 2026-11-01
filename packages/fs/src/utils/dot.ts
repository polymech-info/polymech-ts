export const DOT_DIR_REGEX = /(?:^|[\\/])(\.\w+)[\\/]/;
export const isDotDir = (str: string) => DOT_DIR_REGEX.test(str);
export function isDotFile(str: string) {
	if (str.charCodeAt(0) === 46 /* . */ && !str.includes('/', 1)) {
		return true;
	}

	const last = str.lastIndexOf('/');
	return last !== -1 ? str.charCodeAt(last + 1) === 46  /* . */ : false;
}
	