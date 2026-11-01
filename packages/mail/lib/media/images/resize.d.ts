import * as sharp from 'sharp';
import { IOptions, IResizeOptions } from '../../../index';
export declare const resizeFile: (source: any, target: any, onNode: (data: any) => void, options: IResizeOptions) => Promise<sharp.Sharp | undefined>;
export declare const _resize: (file: any, targets: string[], onNode: (data: any) => void, options: IOptions) => Promise<(void | sharp.Sharp)[]>;
export declare const resize: (options: IOptions) => Promise<(void | sharp.Sharp)[][]>;
