import { IOptions } from '../types.js';
export declare const translateFiles: (file: any, targets: string[], options: IOptions) => Promise<false | any[]>;
export declare const translate: (opts: IOptions) => Promise<any[]>;
export declare const TRANSLATORS: {
    '.md': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.html': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.json': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.toml': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.yaml': (src: string, dst: string, options: IOptions) => Promise<string | import("smol-toml").TomlTable>;
    '.xlsx': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.xls': (src: string, dst: string, options: IOptions) => Promise<any>;
    '.txt': (text: string, srcLang: string, dstLang: string, options?: IOptions) => Promise<any>;
};
export declare const getTranslator: (file: string, options?: IOptions) => any;
