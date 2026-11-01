export let canNormalize = typeof (('' as any).normalize) === 'function';
const nonAsciiCharactersPattern = /[^\u0000-\u0080]/;
export const normalizeNFC = (str: string): string => {
	if (!canNormalize || !str) {
		return str;
	}

	let res: string;
	if (nonAsciiCharactersPattern.test(str)) {
		res = (str as any).normalize('NFC');
	} else {
		res = str;
	}
	return res;
};
