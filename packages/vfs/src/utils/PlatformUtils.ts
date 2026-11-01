'use strict';
export function isWindows() {
    if (typeof process === 'undefined' || !process) {
        return false;
    }
    return process.platform === 'win32' ||
        process.env.OSTYPE === 'cygwin' ||
        process.env.OSTYPE === 'msys';
}
