import { OverlayOptions } from "sharp";
import { IOptions } from '../../../types.js';
type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
export interface LogoWatermarkOptions {
    position?: Corner;
    margin?: number;
    sizePct?: number;
    opacity?: number;
    blend?: OverlayOptions["blend"];
}
export interface TextWatermarkOptions {
    position?: Corner;
    margin?: number;
    fontSize?: number;
    opacity?: number;
    color?: string;
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
}
export interface WatermarkOptions extends IOptions {
    watermark: string;
    position?: Corner;
    margin?: number;
    opacity?: number;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    strokeColor?: string;
    strokeWidth?: number;
    sizePct?: number;
    blend?: OverlayOptions["blend"];
    watermarkType?: 'text' | 'image';
    text?: string;
    logoPath?: string;
    textOptions?: TextWatermarkOptions;
    imageOptions?: LogoWatermarkOptions;
}
export declare const WatermarkOptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
export declare function addLogoWatermark(inputPath: string, logoPath: string, outputPath: string, opts?: LogoWatermarkOptions): Promise<void>;
export declare function addTextWatermark(inputPath: string, text: string, outputPath: string, opts?: TextWatermarkOptions): Promise<void>;
export declare const watermark: (options: WatermarkOptions) => Promise<{
    src: string;
    dst: string;
}[]>;
export {};
