import { RegExCallback } from './types.js';
export declare class Pattern {
    regex: RegExp;
    replacement: RegExCallback;
    constructor(regex: RegExp, replacement: any);
    apply(raw: string): string;
}
