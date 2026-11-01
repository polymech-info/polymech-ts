// tslint:disable-next-line:interface-name
export interface Hash<T> {
	[ id: string ]: T;
}
// tslint:disable-next-line:interface-name
export interface List<T> {
	[index: number]: T;
	length: number;
}
/**
 * Interface of the simple literal object with any string keys.
 */
export interface IObjectLiteral {
	[key: string]: any;
}
/**
 * Represents some Type of the Object.
 */
export type ObjectType<T> = { new (): T } | Function;
/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: DeepPartial<T[P]>;
};

export interface IDelimitter {
	begin: '%';
	end: '%';
}


export enum EResourceType {
	JS_HEADER_INCLUDE = <any> 'JS-HEADER-INCLUDE',
	JS_HEADER_SCRIPT_TAG = <any> 'JS-HEADER-SCRIPT-TAG',
	CSS = <any> 'CSS',
	FILE_PROXY = <any> 'FILE_PROXY'
}

export interface IResource {
	type?: EResourceType;
	name?: string;
	url?: string;
	enabled?: boolean;
	label?: string;
}

export type IResourceProperty = IObjectLiteral & {};

export interface IFileResource {
	readOnly?: boolean;
	label?: string;
	path?: string;
	vfs?: string;
	options?: IObjectLiteral;
}

export function DefaultDelimitter(): IDelimitter {
	return {
		begin: '%',
		end: '%'
	};
}

export interface IResourceDriven {
	configPath?: string | null;
	relativeVariables: any;
	absoluteVariables: any;
}

export type FileResource = IResource & IFileResource;
