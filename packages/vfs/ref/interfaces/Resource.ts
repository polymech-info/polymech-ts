import { IDelimitter, IObjectLiteral } from './index';
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
