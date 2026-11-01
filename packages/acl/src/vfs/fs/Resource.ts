export interface Hash<T> {
	[id: string]: T;
}
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
export type ObjectType<T> = (new () => T) | ((...args: never[]) => unknown);
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
	JS_HEADER_INCLUDE = 'JS-HEADER-INCLUDE' as any,
	JS_HEADER_SCRIPT_TAG = 'JS-HEADER-SCRIPT-TAG' as any,
	CSS = 'CSS' as any,
	FILE_PROXY = 'FILE_PROXY' as any
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
