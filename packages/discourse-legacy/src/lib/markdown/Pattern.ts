import { RegExCallback } from './types'
export class Pattern {
  regex: RegExp;
  replacement: RegExCallback
  constructor(regex: RegExp, replacement: any) {
    this.regex = regex
    this.replacement = replacement
  }

  apply(raw: string): string {
    return raw.replace(this.regex, this.replacement)
  }
}
