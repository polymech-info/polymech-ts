import { IOptions } from '../../../types.js';
export interface CropForegroundOptions extends IOptions {
    apiKey: string;
    sync?: boolean;
    contentModeration?: boolean;
    preserveAlpha?: boolean;
}
export declare const CropForegroundOptionsSchema: (opts?: any) => any;
export declare const types: () => void;
export declare const schemas: () => void;
export declare function cropForeground(options: CropForegroundOptions): Promise<void>;
