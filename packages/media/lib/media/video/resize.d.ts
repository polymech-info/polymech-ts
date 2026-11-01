import * as sharp from 'sharp';
import { IOptions, IResizeOptions } from '../../../types';
export declare const meta: (file: any, image: sharp.Sharp) => Promise<sharp.Metadata>;
export declare const resizeFile: (file: any, target: any, onNode: (data: any) => void, options: IResizeOptions) => Promise<sharp.Sharp>;
export declare const _resize: (file: any, targets: string[], onNode: (data: any) => void, options: IOptions) => Promise<any>;
export declare const resize: (options: IOptions) => Promise<void>;
