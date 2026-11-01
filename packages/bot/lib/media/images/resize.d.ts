import * as sharp from 'sharp';
import { IOptions, IResizeOptions } from '../../../index';
export declare const resizeFile: (source: string, target: string, onNode: (data: sharp.Sharp) => void, options: IResizeOptions) => Promise<sharp.Sharp | undefined>;
export declare const _resize: (file: any, targets: string[], onNode: (data: any) => void, options: IOptions) => Promise<(void | sharp.Sharp)[]>;
export declare const resize: (options: IResizeOptions) => Promise<any>;
