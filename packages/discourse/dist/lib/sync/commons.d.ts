/// <reference types="node" resolution-mode="require"/>
export declare const fileAsBuffer: (path: string) => Buffer;
export declare const images_urls: (content: string) => any[];
export declare const adjustUrls: (content: string, options: IOptionsSync) => any;
export declare const fromJSON: (content: string, file: string, options: IOptionsSyncComponent) => void;
export declare const fromYAML: (content: string, options: IOptionsSync) => {
    attributes: any;
    body: any;
};
export declare const option: (option: string, taskOptions: any, col: any, _default?: any) => any;
export declare const createContent: (file: any, _options: any) => Promise<any>;
