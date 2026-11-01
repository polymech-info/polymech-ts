/*!
 * parse-glob <https://github.com/jonschlinkert/parse-glob>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */
import { hasMagic } from 'glob';
import { globBase } from './glob-base.js';
/**
 * Expose `cache`
 */
export const cache = {};
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
export function parseGlob(glob) {
    if (cache.hasOwnProperty(glob)) {
        return cache[glob];
    }
    const tok = {};
    tok.orig = glob;
    tok.is = {
        glob: false,
        negated: false,
        extglob: false,
        braces: false,
        brackets: false,
        globstar: false,
        dotfile: false,
        dotdir: false,
    };
    // Temporarily escape dots and slashes within braces/brackets
    glob = escapeSpecial(glob);
    const parsed = globBase(glob);
    tok.is.glob = parsed.isGlob;
    tok.glob = parsed.glob;
    tok.base = parsed.base;
    const segs = /([^/]*)$/.exec(glob);
    tok.path = {
        dirname: '',
        basename: segs ? segs[1] : '',
        filename: '',
        extname: '',
        ext: '',
    };
    tok.path.dirname = glob.split(tok.path.basename).join('') || '';
    const basenameParts = tok.path.basename.split('.') || [];
    tok.path.filename = basenameParts[0] || '';
    tok.path.extname = basenameParts.slice(1).join('.') || '';
    // If the dirname is a glob and we have no basename, adjust
    if (hasMagic(tok.path.dirname) && !tok.path.basename) {
        if (!/\/$/.test(tok.glob)) {
            tok.path.basename = tok.glob;
        }
        tok.path.dirname = tok.base;
    }
    // If glob doesn't contain '/', handle everything as basename
    if (!glob.includes('/') && !tok.is.globstar) {
        tok.path.dirname = '';
        tok.path.basename = tok.orig;
    }
    const dotIndex = tok.path.basename.indexOf('.');
    if (dotIndex !== -1) {
        tok.path.filename = tok.path.basename.slice(0, dotIndex);
        tok.path.extname = tok.path.basename.slice(dotIndex);
    }
    if (tok.path.extname.startsWith('.')) {
        const exts = tok.path.extname.split('.');
        tok.path.ext = exts[exts.length - 1];
    }
    // Unescape
    tok.glob = unescapeSpecial(tok.glob);
    tok.path.dirname = unescapeSpecial(tok.path.dirname);
    tok.path.basename = unescapeSpecial(tok.path.basename);
    tok.path.filename = unescapeSpecial(tok.path.filename);
    tok.path.extname = unescapeSpecial(tok.path.extname);
    // Booleans
    const maybeGlob = !!glob && tok.is.glob;
    tok.is.negated = !!glob && glob.charAt(0) === '!';
    //tok.is.extglob = !!glob && extglob(glob);
    tok.is.braces = has(maybeGlob, glob, '{');
    tok.is.brackets = has(maybeGlob, glob, '[:');
    tok.is.globstar = has(maybeGlob, glob, '**');
    //tok.is.dotfile = dotfile(tok.path.basename) || dotfile(tok.path.filename);
    tok.is.dotdir = isDotDir(tok.path.dirname);
    cache[glob] = tok;
    return tok;
}
/**
 * Returns true if the pattern has the given `ch`aracter(s).
 */
function has(is, glob, ch) {
    return is && glob.includes(ch);
}
/**
 * Returns true if the glob matches dot-directories.
 */
function isDotDir(base) {
    if (base.includes('/.')) {
        return true;
    }
    if (base.charAt(0) === '.' && base.charAt(1) !== '/') {
        return true;
    }
    return false;
}
/**
 * Escape special characters (dots and slashes) in braces/brackets/parens.
 */
function escapeSpecial(str) {
    const re = /\{([^{}]*?)\}|\(([^()]*?)\)|\[([^\[\]]*?)\]/g;
    return str.replace(re, (outer, braces, parens, brackets) => {
        const inner = braces || parens || brackets;
        if (!inner)
            return outer;
        return outer.split(inner).join(escapeDotsAndSlashes(inner));
    });
}
function escapeDotsAndSlashes(str) {
    return str
        .split('/')
        .join('__SLASH__')
        .split('.')
        .join('__DOT__');
}
/**
 * Unescape special placeholders back to dots and slashes.
 */
function unescapeSpecial(str) {
    return str
        .split('__SLASH__')
        .join('/')
        .split('__DOT__')
        .join('.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi1wYXJzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcy9nbG9iLXBhcnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztHQUtHO0FBRUgsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLE1BQU0sQ0FBQTtBQUMvQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUE4QjFDOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUErQixFQUFFLENBQUM7QUFFcEQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLFNBQVMsQ0FBQyxJQUFZO0lBQ3BDLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQy9CLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxNQUFNLEdBQUcsR0FBRyxFQUFnQixDQUFDO0lBQzdCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLEdBQUcsQ0FBQyxFQUFFLEdBQUc7UUFDUCxJQUFJLEVBQUUsS0FBSztRQUNYLE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLEtBQUs7UUFDZCxNQUFNLEVBQUUsS0FBSztRQUNiLFFBQVEsRUFBRSxLQUFLO1FBQ2YsUUFBUSxFQUFFLEtBQUs7UUFDZixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRSxLQUFLO0tBQ2QsQ0FBQztJQUVGLDZEQUE2RDtJQUM3RCxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTNCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QixHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzVCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztJQUN2QixHQUFHLENBQUMsSUFBSSxH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LENBQUMsQ0FBQztJQUNyQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyRCxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVyRCxXQUFXO0lBQ1gsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztJQUN4QyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO0lBQ2xELDJDQUEyQztJQUMzQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3QyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3Qyw0RUFBNEU7SUFDNUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFM0MsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNsQixPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsR0FBRyxDQUFDLEVBQVcsRUFBRSxJQUFZLEVBQUUsRUFBVTtJQUNoRCxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsUUFBUSxDQUFDLElBQVk7SUFDNUIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDeEIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ3JELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxhQUFhLENBQUMsR0FBVztJQUNoQyxNQUFNLEVBQUUsR0FBRyw4Q0FBOEMsQ0FBQztJQUMxRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUU7UUFDekQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLE1BQU0sSUFBSSxRQUFRLENBQUM7UUFDM0MsSUFBSSxDQUFDLEtBQUs7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUN6QixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxHQUFXO0lBQ3ZDLE9BQU8sR0FBRztTQUNQLEtBQUssQ0FBQyxHQUFHLENBQUM7U0FDVixJQUFJLENBQUMsV0FBVyxDQUFDO1NBQ2pCLEtBQUssQ0FBQyxHQUFHLENBQUM7U0FDVixJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxlQUFlLENBQUMsR0FBVztJQUNsQyxPQUFPLEdBQUc7U0FDUCxLQUFLLENBQUMsV0FBVyxDQUFDO1NBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUM7U0FDVCxLQUFLLENBQUMsU0FBUyxDQUFDO1NBQ2hCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUMifQ==