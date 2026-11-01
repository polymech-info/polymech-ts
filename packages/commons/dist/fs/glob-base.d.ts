/*!
 * glob-base <https://github.com/jonschlinkert/glob-base>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */
interface GlobBaseResult {
    base: string;
    isGlob: boolean;
    glob: string;
}
export declare const globBase: (pattern: string) => GlobBaseResult;
export {};
