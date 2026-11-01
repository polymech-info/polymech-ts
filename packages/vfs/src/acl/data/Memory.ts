/*
  Memory Backend.
  In-memory implementation of the storage.
*/
import * as _ from 'lodash';
import { contract } from '../contract';
import { Action, IBackend, Value, Values } from '../interfaces';
import { IObjectLiteral, List } from '../../interfaces/index';
import * as bluebird from 'bluebird';
function makeArray(arr) {
	return Array.isArray(arr) ? arr : [arr];
}
export class Memory implements IBackend<Action[]> {
	endAsync = bluebird.promisify(this.end);
	getAsync = bluebird.promisify(this.get);
	cleanAsync = bluebird.promisify(this.clean);
	unionAsync = bluebird.promisify(this.union);
	unionsAsync = bluebird.promisify(this.unions);
	_buckets: IObjectLiteral;
	data() {
		return this._buckets as Action[];
	}
	constructor() {
		this._buckets = {};
	}
	/*
	   Begins a transaction.
	*/
	begin() {
		// returns a transaction object(just an array of functions will do here.)
		return [];
	};

	/*
	   Ends a transaction (and executes it)
	*/
	end(transaction: Action[], cb: Action) {
		contract(arguments).params('array', 'function').end();
		// Execute transaction
		for (let i = 0, len = transaction.length; i < len; i++) {
			transaction[i]();
		}
		cb();
	}
	/*
	  Cleans the whole storage.
	*/
	clean(cb: Action) {
		contract(arguments).params('function').end();
		this._buckets = {};
		cb();
	}
	/*
	   Gets the contents at the bucket's key.
	*/
	get(bucket: string, key: Value, cb: Action) {
		contract(arguments)
			.params('string', 'string|number', 'function')
			.end();

		if (this._buckets[bucket]) {
			(cb as Function)(null, this._buckets[bucket][key] || []);
		} else {
			(cb as Function)(null, []);
		}
	}
	/*
	   Gets the union of the keys in each of the specified buckets
	*/
	unions(buckets, keys, cb) {
		contract(arguments)
			.params('array', 'array', 'function')
			.end();

		const self = this;
		let results = {};

		buckets.forEach(function (bucket) {
			if (self._buckets[bucket]) {
				results[bucket] = _.uniq(_.flatten(_.values(_.pick(self._buckets[bucket], keys))));
			} else {
				results[bucket] = [];
			}
		});
		cb(null, results);
	}
	/*
	  Returns the union of the values in the given keys.
	*/
	union(bucket: string, keys: Values[], cb: Action): void {
		contract(arguments)
			.params('string', 'array', 'function')
			.end();

		let match;
		let re;
		if (!this._buckets[bucket]) {
			Object.keys(this._buckets).some(function (b) {
				re = new RegExp("^" + b + "$");
				match = re.test(bucket);
				if (match) { bucket = b; }
				return match;
			});
		}

		if (this._buckets[bucket]) {
			const keyArrays = [];
			for (let i = 0, len = keys.length; i < len; i++) {
				if (this._buckets[bucket][keys[i] as Value]) {
					keyArrays.push.apply(keyArrays, this._buckets[bucket][keys[i] as Value]);
				}
			}
			(cb as Function)(undefined, _.union(keyArrays));
		} else {
			(cb as Function)(undefined, []);
		}
	}

	/*
	  Adds values to a given key inside a bucket.
	*/
	add(transaction: Action[], bucket: string, key: Value, values: Values) {
		contract(arguments)
			.params('array', 'string', 'string|number', 'string|array|number')
			.end();

		const self = this;
		values = makeArray(values);

		transaction.push(function () {
			if (!self._buckets[bucket]) {
				self._buckets[bucket] = {};
			}
			if (!self._buckets[bucket][key]) {
				self._buckets[bucket][key] = values;
			} else {
				self._buckets[bucket][key] = _.union(values as List<Value>, self._buckets[bucket][key]);
			}
		});
	}

	/*
	   Delete the given key(s) at the bucket
	*/
	del(transaction: Action[], bucket: string, keys: Values) {
		contract(arguments)
			.params('array', 'string', 'string|array')
			.end();

		const self = this;
		keys = makeArray(keys);
		transaction.push(function () {
			if (self._buckets[bucket]) {
				for (let i = 0, len = (keys as List<Value>).length; i < len; i++) {
					delete self._buckets[bucket][keys[i]];
				}
			}
		});
	}

	/*
	  Removes values from a given key inside a bucket.
	*/
	remove(transaction: Action[], bucket: string, key: Value, values: Values) {
		contract(arguments)
			.params('array', 'string', 'string|number', 'string|array|number')
			.end();

		const self = this;
		values = makeArray(values);
		transaction.push(function () {
			let old;
			if (self._buckets[bucket] && (old = self._buckets[bucket][key])) {
				self._buckets[bucket][key] = _.difference(old, values as List<Value>);
			}
		});
	}
}
