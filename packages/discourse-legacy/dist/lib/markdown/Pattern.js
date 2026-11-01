export class Pattern {
    regex;
    replacement;
    constructor(regex, replacement) {
        this.regex = regex;
        this.replacement = replacement;
    }
    apply(raw) {
        return raw.replace(this.regex, this.replacement);
    }
}
//# sourceMappingURL=Pattern.js.map