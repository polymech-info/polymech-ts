import { IObjectLiteral } from '../interfaces/index';
import { IStoreAccess } from '../interfaces/Store';
import * as dotProp from 'dot-prop';
import { mixin } from '@xblox/core/objects';
import * as _ from 'lodash';
export class ResourceQuery implements IStoreAccess {
	public root: string;
	public data: IObjectLiteral;
	constructor(data: IObjectLiteral) {
		this.root = '';
		this.data = data;
	}
	public get(section: string, path: string, query?: any): IObjectLiteral {
		let data = this.data;
		let result: IObjectLiteral = {};
		result[section] = dotProp.get(data, this.root + path + section);
		return result;
	}
	public set(section: string, path: string = '.', searchQuery: any = null, value: any, decodeValue: boolean = true): IObjectLiteral {
		let data = this.data;
		const dataAt = dotProp.get(data, this.root + path + section);
		const chunk = _.find(dataAt, searchQuery);
		mixin(chunk, value);
		return data;
	}
	public update(section: string, path: string = '.', searchQuery: any = null, value: any = null, decodeValue: boolean = true): void {
		this.set(section, path, searchQuery, value, decodeValue);
	}
}
