import { Rule } from './Rule.js';
import { RMarkOptions } from './types.js';
export declare const RE_IMAGES: RegExp;
export declare const RE_LINKS: RegExp;
export declare class RMark {
    constructor(options: RMarkOptions);
    private rules;
    addRuleBefore(rule: Rule, before: string): RMark;
    addRule(rule: Rule): RMark;
    render(raw: string): string;
}
export { Rule } from './Rule.js';
export { Pattern } from './Pattern.js';
export declare const toHTML: (content: any) => string;
