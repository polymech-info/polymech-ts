import { PATH_INFO } from '@polymech/commons';
import * as sharp from 'sharp';
export type IOptions = {
    alt?: boolean;
    config?: any;
    cwd?: string;
    root?: string;
    debug?: boolean;
    verbose?: boolean;
    dry?: boolean;
    dst: string;
    dstInfo?: PATH_INFO;
    env?: string;
    cache?: boolean;
    src: string;
    srcInfo?: PATH_INFO;
    stdout?: boolean;
    variables?: Record<string, string>;
    key?: string;
    logLevel?: string;
    gui?: boolean;
};
export interface IResizeOptionsSharp {
    /** Alternative means of specifying width. If both are present this takes priority. */
    width?: number | undefined;
    /** Alternative means of specifying height. If both are present this takes priority. */
    height?: number | undefined;
    /** How the image should be resized to fit both provided dimensions, one of cover, contain, fill, inside or outside. (optional, default 'cover') */
    fit?: keyof sharp.FitEnum | undefined;
    /** Position, gravity or strategy to use when fit is cover or contain. (optional, default 'centre') */
    position?: number | string | undefined;
    /** Background color when using a fit of contain, parsed by the color module, defaults to black without transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
    background?: sharp.Color | undefined;
    /** The kernel to use for image reduction. (optional, default 'lanczos3') */
    kernel?: keyof sharp.KernelEnum | undefined;
    /** Do not enlarge if the width or height are already less than the specified dimensions, equivalent to GraphicsMagick's > geometry option. (optional, default false) */
    withoutEnlargement?: boolean | undefined;
    /** Do not reduce if the width or height are already greater than the specified dimensions, equivalent to GraphicsMagick's < geometry option. (optional, default false) */
    withoutReduction?: boolean | undefined;
    /** Take greater advantage of the JPEG and WebP shrink-on-load feature, which can lead to a slight moiré pattern on some images. (optional, default true) */
    fastShrinkOnLoad?: boolean | undefined;
}
export type IResizeOptions = IOptions & IResizeOptionsSharp & {
    percent?: number;
    minWidth?: number;
    minHeight?: number;
    minSize?: number;
    square?: boolean;
    fillColor?: string;
};
export type IConvertVideoOptions = IOptions & {
    interval?: number;
    verb: string;
    audio: string;
};
export type { WatermarkOptions, LogoWatermarkOptions, TextWatermarkOptions } from './lib/media/images/watermark.js';
export type { BackgroundRemoveOptions } from './lib/media/images/background-remove.js';
export type { BriaBackgroundRemoveOptions } from './lib/media/images/background-remove-bria.js';
export type { CropForegroundOptions } from './lib/media/images/crop-foreground.js';
