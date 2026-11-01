import sharp from 'sharp';
import { IOptions, IResizeOptions } from '../../../types.js';
export declare const convertFile: (file: any, target: any, onNode: (data: any) => void, options: IResizeOptions) => Promise<sharp.OutputInfo>;
export declare function _convert(file: any, targets: string[], onNode: (data: any) => void, options: IOptions): Promise<any[]>;
export declare const convert: (options: IOptions) => Promise<void>;
