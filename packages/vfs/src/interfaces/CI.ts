import { List, IObjectLiteral } from './index';
// tslint:disable-next-line:interface-name
export interface CIRaw {
	enumType?: number | null;
	visible: boolean;
	group?: string;
	name: string|any;
	value: any | null;
	type: number|string;
	id?: string|any;
}
export type CI = CIRaw & IObjectLiteral;

// tslint:disable-next-line:interface-name
export interface CIS {
	inputs: List<CI>;
	outputs?: List<CI>;
}
export type CIList = List<CI>;
