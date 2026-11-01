export * from './resize';
export * from './convert';
export * from './watermark';
import * as sharp from 'sharp';
export declare const GLOB_BASIC = "png|jpg|tiff|jpeg|webp";
export declare const GLOB_MIN = "*.{png,jpg,jpeg,PNG,JPG,JPEG}";
export declare const files: (dir: any, glob: any) => any;
export declare const getFormats: (product: any, folder: any) => {
    src: string;
    dist: string;
    format: string;
}[];
export declare const meta: (file: any) => Promise<sharp.Metadata>;
export declare const format: (formats: any, options?: {
    cache: boolean;
    png: boolean;
}) => Promise<sharp.Metadata[][]>;
export declare const getResizePatterns: (product: any, folder: any) => {
    src: string;
    dist: string;
    percent: number;
}[];
export declare const resize: (patterns: any) => Promise<void[][]>;
export declare const resizeSharp: (patterns: any) => Promise<sharp.Metadata[][]>;
