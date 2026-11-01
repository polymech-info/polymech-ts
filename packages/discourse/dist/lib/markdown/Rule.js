export class Rule {
    name;
    patterns;
    constructor(name, patterns) {
        this.name = name;
        this.patterns = patterns;
    }
    apply(raw) {
        return this.patterns.reduce((result, pattern) => pattern.apply(result), raw);
    }
}
//# sourceMappingURL=Rule.js.map