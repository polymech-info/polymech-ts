/*!
 * parse-glob <https://github.com/jonschlinkert/parse-glob>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */
/**
 * The structure returned by parseGlob.
 */
export interface ParsedGlob {
    orig: string;
    is: {
        glob: boolean;
        negated: boolean;
        extglob: boolean;
        braces: boolean;
        brackets: boolean;
        globstar: boolean;
        dotfile: boolean;
        dotdir: boolean;
    };
    glob: string;
    base: string;
    path: {
        dirname: string;
        basename: string;
        filename: string;
        extname: string;
        ext: string;
    };
}
/**
 * Expose `cache`
 */
export declare const cache: Record<string, ParsedGlob>;
/**
 * Parse a glob pattern into tokens.
 *
 * When no paths or '**' are in the glob, a different
 * strategy is used for parsing the filename, since
 * file names can contain braces and other tricky patterns:
 *
 *  - `*.{a,b}`
 *  - `(**|*.js)`
 */
export declare function parseGlob(glob: string): ParsedGlob;
