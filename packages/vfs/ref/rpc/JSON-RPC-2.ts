import { InvalidRequest, JSON_RPC_ERROR, MethodNotFound, ParserError } from './JSON-RPC-2-Errors';
import { Response } from './JSON-RPC-2-Response';
import * as _ from 'lodash';
const parse = require('co-body');
const debug = require('debug');
export type JSONRPC = any;
export function JSON_RPC_2(): JSONRPC {
	let registry = Object.create(null);
	return {
		registry: registry,
		use: function (name: string, func: Function, owner: any = null) {
			if (registry[name]) {
				debug('Overwrite already registered function \'%s\'', name);
			}
			else {
				debug('Register function \'%s\'', name);
			}
			if (owner) {
				registry[name] = {
					owner: owner,
					handler: func
				};
			} else {
				registry[name] = func;
			}
		},
		app: function () {
			return function* rpcApp(next: Function) {
				let body: any = {};
				try {
					body = yield parse.json(this);
				}
				catch (err) {
					this.body = new Response(null, new ParserError(err.message));
					return;
				}
				if (body.jsonrpc !== '2.0'
					|| !body.hasOwnProperty('method')
					|| !body.hasOwnProperty('id')) {
					debug('JSON is not correct JSON-RPC2 request: %O', body);
					this.body = new Response(body.id || null, new InvalidRequest());
					return;
				}
				if (!registry[body.method]) {
					debug('Method not found \'%s\' in registry', body.method);
					this.body = new Response(body.id, new MethodNotFound(body.method));
					return;
				}
				debug('Request: %o', body);
				if (_.isObject(registry[body.method])) {
					const _method = body.method;
					const service = registry[_method];
					const args = _.values(body.params).concat([this.request, this]);
					try {
						const result = yield service.handler.apply(service.owner, args) || {};
						this.body = new Response(body.id, null, result);
						return;
					} catch (err) {
						console.error('JSON-RPC Error : ', err);
						this.body = new Response(body.id || null, new JSON_RPC_ERROR(err, 1));
						return;
					}
				}
				let result = yield registry[body.method](body.params) || {};
				this.body = new Response(body.id, null, result);
				return;
			};
		}
	};
}
