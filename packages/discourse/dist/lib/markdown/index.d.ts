import { Rule } from './Rule';
import { RMarkOptions } from './types';
export declare const RE_IMAGES: RegExp;
export declare const RE_LINKS: RegExp;
export declare class RMark {
    constructor(options: RMarkOptions);
    private rules;
    addRuleBefore(rule: Rule, before: string): RMark;
    addRule(rule: Rule): RMark;
    render(raw: string): string;
}
export { Rule } from './Rule';
export { Pattern } from './Pattern';
export declare const toHTML: (content: any) => any;
