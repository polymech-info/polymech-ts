import * as base64 from 'base-64';
import * as jp from 'jsonpath';
import { parse } from 'qs';
import { IObjectLiteral, JSONPathExpression } from '../interfaces/index';
export function to(data: Array<any> | IObjectLiteral, path?: JSONPathExpression): any {
	let value: any = path ? jp.query(data, path)[0] : data;
	let changed = false;
	try {
		// make sure its base64 and then decode
		const decoded = base64.decode(value);
		if (base64.encode(base64.decode(value)) === value) {
			value = Object.keys(parse(decoded))[0];
			changed = true;
		}
	} catch (e) {
		// we swollow this!
	}
	changed && path && jp.value(data, path, value);
	return data;
}
export function encode(data: string): string {
	return base64.encode(data);
}
