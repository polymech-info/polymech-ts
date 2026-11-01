import { IOptions } from '../../../types.js';
export interface BriaBackgroundRemoveOptions extends IOptions {
    apiKey?: string;
    sync?: boolean;
    contentModeration?: boolean;
    preserveAlpha?: boolean;
    jpg?: boolean;
}
export declare const BriaBackgroundRemoveOptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
export declare function removeBriaBackground(inputPath: string, outputPath: string, options: BriaBackgroundRemoveOptions): Promise<void>;
export declare const briaBackgroundRemove: (options: BriaBackgroundRemoveOptions) => Promise<{
    src: string;
    dst: string;
}[]>;
