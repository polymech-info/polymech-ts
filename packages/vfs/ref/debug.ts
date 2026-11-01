export { debug } from 'debug';
export function hookStream(obj: any) {
	if (obj.hook || obj.unhook) {
		throw new Error('Object already has properties hook and/or unhook');
	}

	obj.hook = function (methName, _fn, isAsync) {
		let self = this,
			methodRef;

		// Make sure method exists
		if (!(Object.prototype.toString.call(self[methName]) === '[object Function]')) {
			throw new Error('Invalid method: ' + methName);
		}

		// We should not hook a hook
		if (self.unhook.methods[methName]) {
			throw new Error('Method already hooked: ' + methName);
		}

		// Reference default method
		methodRef = (self.unhook.methods[methName] = self[methName]);

		self[methName] = function () {
			let args = Array.prototype.slice.call(arguments);

			// Our hook should take the same number of arguments
			// as the original method so we must fill with undefined
			// optional args not provided in the call
			while (args.length < methodRef.length) {
				args.push(undefined);
			}

			// Last argument is always original method call
			args.push(function () {
				let args = arguments;

				if (isAsync) {
					process.nextTick(function () {
						methodRef.apply(self, args);
					});
				} else {
					methodRef.apply(self, args);
				}
			});

			_fn.apply(self, args);
		};
	};

	obj.unhook = function (method) {
		let self = this,
			ref = self.unhook.methods[method];

		if (ref) {
			self[method] = self.unhook.methods[method];
			delete self.unhook.methods[method];
		} else {
			throw new Error('Method not hooked: ' + method);
		}
	};

	obj.unhook.methods = {};
};
