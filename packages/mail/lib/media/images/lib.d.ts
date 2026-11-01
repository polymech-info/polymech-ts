/// <reference types="node" />
/// <reference types="node" />
import { IResizeOptions } from '../../../types';
import * as sharp from 'sharp';
export declare const fileAsBuffer: (path: string) => Buffer;
export declare const targets: (f: string, options: IResizeOptions) => string[];
export declare const base64ToBuffer: (b64string: string) => Promise<Buffer>;
export declare const imageToBase64: (imagePath: string) => Promise<string>;
export declare const meta: (file: any, image: sharp.Sharp) => Promise<sharp.Metadata | null>;
