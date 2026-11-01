export declare const getFormats: (product: any, folder: any) => {
    src: string;
    dist: string;
    format: string;
}[];
export declare const updateImages: (root: any, product_root: any, content: any) => Promise<any>;
export declare const format: (formats: any) => any;
export declare const getResizePatterns: (product: any, folder: any) => {
    src: string;
    dist: string;
    percent: number;
}[];
export declare const resize: (patterns: any) => any;
