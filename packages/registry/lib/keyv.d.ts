import Keyv from 'keyv';
export declare const store: (storePath: string, ns?: string, opts?: any) => Keyv<any>;
export declare const get: (key: string, storePath: string, ns?: string, opts?: any) => Promise<any>;
export declare const set: (key: string, value: any, storePath: string, ns?: string, opts?: any) => Promise<boolean>;
export declare const list: (key: string, value: any, storePath: string, ns?: string, opts?: any) => Promise<boolean>;
