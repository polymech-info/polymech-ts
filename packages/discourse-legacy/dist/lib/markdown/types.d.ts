export type RegExCallback = (match: any, capture: any, arg1: any, arg2: any) => string;
export interface RMarkOptions {
    images: RegExCallback;
    links?: RegExCallback;
}
