import { Pattern } from './Pattern';
export declare class Rule {
    name: string;
    patterns: Pattern[];
    constructor(name: string, patterns: Pattern[]);
    apply(raw: string): string;
}
