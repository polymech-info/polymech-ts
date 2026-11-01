// fancy ES7 - Aspect - decorator
export enum SIGNALS {
	BEFORE = <any> Symbol('before'),
	AFTER = <any> Symbol('after'),
	AROUND = <any> Symbol('around'),
	ERROR = <any> Symbol('error')
}

const SignalMap = {
	[SIGNALS.BEFORE](original, advice) {
		return function before() {
			advice(this, arguments);
			return original.apply(this, arguments);
		};
	},
	[SIGNALS.AFTER](original, advice) {
		return function after() {
			const ret = original.apply(this, arguments);
			return advice(this, ret, arguments);
		};
	},
	[SIGNALS.AROUND](original, advice) {
		return function around() {
			return advice(() => original.apply(this, arguments));
		};
	},
	[SIGNALS.ERROR](original, advice) {
		return function around() {
			try {
				return original.apply(this, arguments);
			}
			catch (err) {
				return advice(err);
			}
		};
	}
};

const isMethod = (target, descriptor) => descriptor && descriptor.value;

const cutMethod = (target, name, descriptor, advice, type) => {
	const original = descriptor.value;
	descriptor.value = SignalMap[type](original, advice);
	return descriptor;
};

const cut = (target, advice, type) => {
	return SignalMap[type](target, advice);
};

function aspect({ type, advice }) {
	if (!(type in SignalMap)) {
		return function crosscut(target, name, descriptor) {
			return descriptor || target;
		};
	}
	return function crosscut(target, name, descriptor) {
		if (isMethod(target, descriptor)) {
			return cutMethod(target, name, descriptor, advice, type);
		}
		return cut(target, advice, type);
	};
}

export function before(advice) { return aspect({ type: SIGNALS.BEFORE, advice }); }
export function after(advice) { return aspect({ type: SIGNALS.AFTER, advice }); }
export function around(advice) { return aspect({ type: SIGNALS.AROUND, advice }); }
export function error(advice) { return aspect({ type: SIGNALS.ERROR, advice }); }

export default {
	before, after, around, error
};
