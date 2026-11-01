import { IOptions } from '../../../types.js';
export interface BackgroundRemoveOptions extends IOptions {
    apiKey?: string;
    model?: string;
    alpha_matting?: boolean;
    alpha_matting_foreground_threshold?: number;
    alpha_matting_background_threshold?: number;
    alpha_matting_erode_size?: number;
}
export declare const BackgroundRemoveOptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
export declare function removeBackgroundFile(inputPath: string, outputPath: string, options: BackgroundRemoveOptions): Promise<void>;
export declare const backgroundRemove: (options: BackgroundRemoveOptions) => Promise<void[][]>;
