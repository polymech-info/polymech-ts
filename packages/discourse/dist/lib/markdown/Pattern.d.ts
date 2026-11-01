import { RegExCallback } from './types';
export declare class Pattern {
    regex: RegExp;
    replacement: RegExCallback;
    constructor(regex: RegExp, replacement: any);
    apply(raw: string): string;
}
