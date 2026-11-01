/**
 * Converts all escapes in the text str to characters, and can interpret numbers as escapes too.
 * @param str {string} the text to be converted.
 * @param numbers {string} enum [none, hex, dec, utf8, utf16], what to treat numbers as.
 * @returns {string|*}
 * @memberOf module:xide/utils/StringUtils
 */
export declare const convertAllEscapes: (str: string, numbers: string) => string | any;
/**
 * Converts a string containing CSS escapes to a string of characters, up to 6 digit escapes to characters & throw
 * away any following whitespace.
 * @param str {string} str: string, the input
 * @param convertbackslash {boolean} true if you want \x etc to become x or \a to be treated as 0xA
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
export declare const convertCSS2Char: (str: string, convertbackslash: boolean) => string;
/**
 * Converts a string containing JavaScript or Java escapes to a string of characters
 * @param str {string} str: string, the input
 * @param shortEscapes {boolean} if true the function will convert \b etc to characters
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
export declare const convertjEsc2Char: (str: string, shortEscapes: boolean) => any;
/**
 *
 * @param n
 * @returns {string}
 */
export declare const to_hex: (n: any) => string;
/**
 * Unescape hex sequences like 'x0d' to chars
 * @param str {string}
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
export declare const replaceHex: (str: string) => string;
/**
 * Convert a string into hex values
 * @memberOf module:xide/utils/StringUtils
 * @param string {string}
 * @returns {string}
 */
export declare const stringToHex: (string: any) => string;
/**
 * Returns buffer compatible string
 * @param string
 * @example
 * utils.stringToHex("a b") returns "61 20 62"
 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
export declare const stringToBufferStr: (string: any) => string;
/**
 * Return an integer array (as Buffer) for a string
 * @param string
 * @returns {Array}
 */
export declare const stringToBuffer: (string: any) => any[];
/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {String} The hex version of the buffer string
 */
export declare const bufferToHexString: (bufferString: any) => string;
/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {integer} The integer array
 */
export declare const bufferFromDecString: (bufferString: any) => any;
/**
 * Return a buffer like formatted string "0a 12"
 * @param string
 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
export declare const stringFromDecString: (string: any) => string;
/**
 *
 * @param string
 * @returns {string}
 */
export declare const stringToHex2: (string: any) => string;
/**
 *
 * @param string {string}
 * @returns {string}
 */
export declare const hexToString: (string: string) => string;
/**
 *
 * @param buffer
 * @returns {string}
 */
export declare const prettyHex: (buffer: any) => string;
/**
 *
 * @param str
 * @param prefix
 * @returns {string}
 */
export declare const hexEncode: (str: any, prefix: any) => string;
