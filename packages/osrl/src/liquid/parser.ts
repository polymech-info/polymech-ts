
export const toValue = (val) => {
	const _float = parseFloat(val);
	if (!isNaN(_float)) {
		return _float;
	}
	if (val === 'true' || val === true) {
		return true;
	}
	if (val === 'false' || val === false) {
		return false;
	}
	return val;
}

export const toVariables = (parse) => {
    return parse.filter((e) => e.name === 'assign').map((t) => {
        return {
            key: t.impl.key,
            value: toValue(('' + t.impl.value).trim()),
        }
    }).concat(parse.filter((e) => e.name === 'capture').map((t) => {
        return {
            key: t.impl.variable,
            value: toValue(('' + t.impl.templates[0].str).trim()),
        }
    }));
}