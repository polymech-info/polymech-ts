export interface IStoreIO {
	read(path?: string): any;
	write(path?: string, val?: Object): any;
}
export interface IStoreAccess {
	get(section: string, path: string, query?: any): any;
	set(section: string, path: string, query: any, value: any, decodeValue: boolean);
	update(section: string, path: string, query: any, value: any, decodeValue: boolean);
}
