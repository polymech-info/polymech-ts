import { IObjectLiteral } from '../interfaces/index';
import { RpcMethod } from '../services/Base';
import { JSONFileService } from './JSONFile';
import { serialize } from '../io/json';
import * as dotProp from 'dot-prop';
import * as _ from 'lodash';
export class TrackingService extends JSONFileService {
	// implement Base#method
	public method = 'XApp_Tracking_Service';
	root = "admin";
	@RpcMethod
	public get(section: string, path: string, query?: any): any {
		let data = this.readConfig(this._getConfigPath(arguments, 'meta.json'), serialize({ admin: { meta: {} } }));
		let result: IObjectLiteral = {};
		result[section] = dotProp.get(data, this.root + path + section);
		return result;
	}

	@RpcMethod
	public set(section: string, path: string = '.', searchQuery: any = null, value: any, decodeValue: boolean = true) {
		let data = this.readConfig(this._getConfigPath(arguments, 'meta.json'));
		const dataAt = dotProp.get(data, this.root + path + section);
		dataAt && _.extend(_.find(dataAt, searchQuery), value);
		this.write(this._getConfigPath(arguments, 'meta.json'), data);
		return data;
	}
	//
	// ─── DECORATORS ─────────────────────────────────────────────────────────────────
	//
	methods() {
		return this.toMethods(['get', 'set']);
	}
}
