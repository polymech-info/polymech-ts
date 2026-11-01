import { IConvertVideoOptions } from '../../../types';
export declare const split: (src: string, dst: string, onNode: any, options: {
    interval: number;
}) => Promise<void>;
export declare const CONVERTERS: {
    '.mp3': (src: string, dst: string, onNode: any, options: {
        interval: number;
    }) => Promise<void>;
};
export declare const converter: (file: string) => any;
export declare const convertFile: (file: any, target: any, onNode: (data: any) => void, options: IConvertVideoOptions) => Promise<any>;
export declare function _convert(file: any, targets: string[], onNode: (data: any) => void, options: IConvertVideoOptions): Promise<any[]>;
export declare const convert: (options: IConvertVideoOptions) => Promise<void>;
