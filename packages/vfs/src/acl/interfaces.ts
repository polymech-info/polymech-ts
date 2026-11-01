export type strings = string | string[];
export type Value = string | number;
export type Values = Value | Value[];
export type Action = () => any;
export type Callback = (err: Error) => any;
export type AnyCallback = (err: Error, obj: any) => any;
export type AllowedCallback = (err: Error, allowed: boolean) => any;
import * as bluebird from 'bluebird';

export interface IOption {
	buckets?: IBucketsOption;
}

export interface IBucketsOption {
	meta?: string;
	parents?: string;
	permissions?: string;
	resources?: string;
	roles?: string;
	users?: string;
}

export interface IAclSet {
	roles: strings;
	allows: IAclAllow[];
}

export interface IAclAllow {
	resources: strings;
	permissions: strings;
}

export interface IAcl {
	addUserRoles: (userId: Value, roles: strings, cb?: Callback) => Promise<void>;
	removeUserRoles: (userId: Value, roles: strings, cb?: Callback) => Promise<void>;
	userRoles: (userId: Value, cb?: (err: Error, roles: string[]) => any) => bluebird<string[]>;
	roleUsers: (role: Value, cb?: (err: Error, users: Values) => any) => Promise<any>;
	hasRole: (userId: Value, role: string, cb?: (err: Error, isInRole: boolean) => any) => bluebird<boolean>;
	addRoleParents: (role: string, parents: Values, cb?: Callback) => Promise<void>;
	removeRole: (role: string, cb?: Callback) => Promise<void>;
	removeResource: (resource: string, cb?: Callback) => Promise<void>;
	allow: (roles: Values, resources: strings, permissions: strings, cb?: Callback) => Promise<void>;
	removeAllow: (role: string, resources: strings, permissions: strings, cb?: Callback) => Promise<void>;
	removePermissions: (role: string, resources: strings, permissions: strings, cb?: Function) => Promise<void>;
	allowedPermissions: (userId: Value, resources: strings, cb?: AnyCallback) => bluebird<any>;
	isAllowed: (userId: Value, resources: strings, permissions: strings, cb?: AllowedCallback) => Promise<boolean>;
	areAnyRolesAllowed: (roles: strings, resource: strings, permissions: strings, cb?: AllowedCallback) => Promise<any>;
	whatResources: (roles: strings, permissions: strings, cb?: AnyCallback) => Promise<any>;
	permittedResources: (roles: strings, permissions: strings, cb?: Function) => Promise<void>;
	// middleware: (numPathComponents?: number, userId?: Value | GetUserId, actions?: strings) => express.RequestHandler;
}
//
// For internal use
//
export interface IBackend<T> {
	begin: () => T;
	end: (transaction: T, cb?: Action) => void;
	clean: (cb?: Action) => void;
	get: (bucket: string, key: Value, cb?: Action) => void;
	union: (bucket: string, keys: Value[], cb?: Action) => void;
	add: (transaction: T, bucket: string, key: Value, values: Values) => void;
	del: (transaction: T, bucket: string, keys: Value[]) => void;
	remove: (transaction: T, bucket: string, key: Value, values: Values) => void;
	unions(buckets, keys, cb);
	endAsync?: Function;
	getAsync?: Function;
	cleanAsync?: Function;
	unionAsync: Function;
	unionsAsync?: Function;
	data: () => T;
}
export type IDefaultBackend = IBackend<Action[]>;

export interface IContract {
	(args: IArguments): IContract | INoOp;
	debug: boolean;
	fulfilled: boolean;
	args: any[];
	checkedParams: string[];
	params: (...types: string[]) => IContract | INoOp;
	end: () => void;
}

export interface INoOp {
	params: (...types: string[]) => INoOp;
	end: () => void;
}
export interface ILogger {
	debug: (msg: string) => any;
}
