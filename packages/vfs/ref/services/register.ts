import { Application } from '../interfaces/Application';
import { IObjectLiteral } from '../interfaces/index';
import { JSONRPC } from '../rpc/JSON-RPC-2';
import { BaseService } from '../services/Base';
import * as _ from 'lodash';

export function registerMethod(rpc: JSONRPC, method: string, handler: Function): any {
	return rpc.use(method, method);
}
export function registerService(rpc: JSONRPC, service: BaseService, application: Application): BaseService {
	let methods = service.methods();
	_.each(methods, (method, name, other) => {
		rpc.use(service.method + '.' + name, method, service);
	});
	service.rpc = rpc;
	service.application = application;
	return service;
}
export function services(rpc: any): IObjectLiteral {
	return rpc.registry;
}
