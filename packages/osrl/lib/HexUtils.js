"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexEncode = exports.prettyHex = exports.hexToString = exports.stringToHex2 = exports.stringFromDecString = exports.bufferFromDecString = exports.bufferToHexString = exports.stringToBuffer = exports.stringToBufferStr = exports.stringToHex = exports.replaceHex = exports.to_hex = exports.convertjEsc2Char = exports.convertCSS2Char = exports.convertAllEscapes = void 0;
const utils = {};
const types = {};
const json = {};
const _ = require("lodash");
/**
 * Converts a single hex number to a character. note that no checking is performed to ensure that this is just a hex
 * number, eg. no spaces etc.
 * @param hex {string} the hex codepoint to be converted.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
const hex2char = (hex) => {
    let result = '';
    let n = parseInt(hex, 16);
    if (n <= 0xFFFF) {
        result += String.fromCharCode(n);
    }
    else if (n <= 0x10FFFF) {
        n -= 0x10000;
        result += String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF));
    }
    else {
        result += 'hex2Char error: Code point out of range: ' + dec2hex(n);
    }
    return result;
};
/**
 * Converts a single string representing a decimal number to a character. Note that no checking is performed to
 * ensure that this is just a hex number, eg. no spaces etc.
 * @param n {string} dec: string, the dec codepoint to be converted
 * @returns {string}
 */
const dec2char = (n) => {
    let result = '';
    if (n <= 0xFFFF) {
        result += String.fromCharCode(n);
    }
    else if (n <= 0x10FFFF) {
        n -= 0x10000;
        result += String.fromCharCode(0xD800 | (n >> 10)) + String.fromCharCode(0xDC00 | (n & 0x3FF));
    }
    else {
        result += 'dec2char error: Code point out of range: ' + dec2hex(n);
    }
    return result;
};
const dec2hex = (textString) => (textString + 0).toString(16).toUpperCase();
let hexequiv = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const dec2hex2 = (textString) => hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
const dec2hex4 = (textString) => {
    return hexequiv[(textString >> 12) & 0xF] + hexequiv[(textString >> 8) & 0xF]
        + hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
};
const convertChar2CP = (textString) => {
    let haut = 0;
    let n = 0;
    let CPstring = '';
    for (let i = 0; i < textString.length; i++) {
        let b = textString.charCodeAt(i);
        if (b < 0 || b > 0xFFFF) {
            CPstring += 'Error in convertChar2CP: byte out of range ' + dec2hex(b) + '!';
        }
        if (haut !== 0) {
            if (0xDC00 <= b && b <= 0xDFFF) {
                CPstring += dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00)) + ' ';
                haut = 0;
                continue;
            }
            else {
                CPstring += 'Error in convertChar2CP: surrogate out of range ' + dec2hex(haut) + '!';
                haut = 0;
            }
        }
        if (0xD800 <= b && b <= 0xDBFF) {
            haut = b;
        }
        else {
            CPstring += dec2hex(b) + ' ';
        }
    }
    return CPstring.substring(0, CPstring.length - 1);
};
/**
 * Converts a string containing &#x...; escapes to a string of characters.
 */
const removeWhitespacesFromHexSequence = (str) => {
    // convert up to 6 digit escapes to characters
    str = str.replace(/0x([A-Fa-f0-9]{1,4})(\s)?/g, 
    // tslint:disable-next-line:space-before-function-paren
    (matchstr, parens) => hex2char(parens));
    return str;
};
// ========================== Converting to characters ==============================================
/**
 * Converts all escapes in the text str to characters, and can interpret numbers as escapes too.
 * @param str {string} the text to be converted.
 * @param numbers {string} enum [none, hex, dec, utf8, utf16], what to treat numbers as.
 * @returns {string|*}
 * @memberOf module:xide/utils/StringUtils
 */
const convertAllEscapes = (str, numbers) => {
    let sle = false;
    str = convertUnicode2Char(str);
    str = removeWhitespacesFromHexSequence(str);
    str = convertZeroX2Char(str);
    str = convertHexNCR2Char(str);
    str = convertDecNCR2Char(str);
    if (sle) {
        str = (0, exports.convertjEsc2Char)(str, true);
    }
    else {
        str = (0, exports.convertjEsc2Char)(str, false);
        str = (0, exports.convertCSS2Char)(str, false);
    }
    str = convertpEnc2Char(str);
    str = convertEntities2Char(str);
    str = convertNumbers2Char(str, numbers);
    return str;
};
exports.convertAllEscapes = convertAllEscapes;
/**
 * Converts a string containing U+... escapes to a string of characters.
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
const convertUnicode2Char = (str) => {
    // first convert the 6 digit escapes to characters
    str = str.replace(/[Uu]\+10([A-Fa-f0-9]{4})/g, (matchstr, parens) => hex2char('10' + parens));
    // next convert up to 5 digit escapes to characters
    str = str.replace(/[Uu]\+([A-Fa-f0-9]{1,5})/g, (matchstr, parens) => hex2char(parens));
    return str;
};
/**
 * Converts a string containing &#x...; escapes to a string of characters
 * @param str
 * @returns {*}
 */
const convertHexNCR2Char = (str) => {
    // convert up to 6 digit escapes to characters
    str = str.replace(/&#x([A-Fa-f0-9]{1,6});/g, (matchstr, parens) => hex2char(parens));
    return str;
};
/**
 * Converts a string containing &#...; escapes to a string of characters
 * @param str
 * @returns {*}
 */
const convertDecNCR2Char = (str) => {
    // convert up to 6 digit escapes to characters
    str = str.replace(/&#([0-9]{1,7});/g, (matchstr, parens) => dec2char(parens));
    return str;
};
/**
 * Converts a string containing 0x... escapes to a string of characters, up to 6 digit escapes to characters.
 * @param str
 * @returns {*}
 */
const convertZeroX2Char = (str) => {
    str = str.replace(/0x([A-Fa-f0-9]{1,6})/g, (matchstr, parens) => hex2char(parens));
    return str;
};
/**
 * Converts a string containing CSS escapes to a string of characters, up to 6 digit escapes to characters & throw
 * away any following whitespace.
 * @param str {string} str: string, the input
 * @param convertbackslash {boolean} true if you want \x etc to become x or \a to be treated as 0xA
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
const convertCSS2Char = (str, convertbackslash) => {
    if (convertbackslash) {
        str = str.replace(/\\([A-Fa-f0-9]{1,6})(\s)?/g, (matchstr, parens) => hex2char(parens));
        str = str.replace(/\\/g, '');
    }
    else {
        str = str.replace(/\\([A-Fa-f0-9]{2,6})(\s)?/g, (matchstr, parens) => hex2char(parens));
    }
    return str;
};
exports.convertCSS2Char = convertCSS2Char;
/**
 * Converts a string containing JavaScript or Java escapes to a string of characters
 * @param str {string} str: string, the input
 * @param shortEscapes {boolean} if true the function will convert \b etc to characters
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
const convertjEsc2Char = (str, shortEscapes) => {
    // convert ES6 escapes to characters
    str = str.replace(/\\u\{([A-Fa-f0-9]{1,})\}/g, (matchstr, parens) => hex2char(parens));
    // convert \U and 6 digit escapes to characters
    str = str.replace(/\\U([A-Fa-f0-9]{8})/g, (matchstr, parens) => hex2char(parens));
    // convert \u and 6 digit escapes to characters
    str = str.replace(/\\u([A-Fa-f0-9]{4})/g, (matchstr, parens) => hex2char(parens));
    // convert \b etc to characters, if flag set
    if (shortEscapes) {
        str = str.replace(/\\b/g, '\b');
        str = str.replace(/\\t/g, '\t');
        str = str.replace(/\\n/g, '\n');
        str = str.replace(/\\v/g, '\v');
        str = str.replace(/\\f/g, '\f');
        str = str.replace(/\\r/g, '\r');
        str = str.replace(/\\\'/g, '\'');
        str = str.replace(/\\\"/g, '\"');
        str = str.replace(/\\\\/g, '\\');
    }
    return str;
};
exports.convertjEsc2Char = convertjEsc2Char;
/**
 * Converts a string containing precent encoded escapes to a string of characters
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
const convertpEnc2Char = (str) => {
    // find runs of hex numbers separated by % and send them for conversion
    str = str.replace(/((%[A-Fa-f0-9]{2})+)/g, (matchstr, parens) => convertpEsc2Char(parens));
    return str;
};
/**
 * converts a string containing HTML/XML character entities to a string of characters
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertEntities2Char(str) {
    let entities = {};
    str = str.replace(/&([A-Za-z0-9]+);/g, function (matchstr, parens) {
        if (parens in entities) {
            return entities[parens];
        }
        else {
            return matchstr;
        }
    });
    return str;
}
/**
 * Converts a string containing HTML/XML character entities to a string of characters
 * @param str {string} the input
 * @param type {string} none, hex, dec, utf8, utf16. what to treat numbers as
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertNumbers2Char(str, type) {
    if (type === 'hex') {
        str = str.replace(/(\b[A-Fa-f0-9]{2,6}\b)/g, (matchstr, parens) => hex2char(parens));
    }
    else if (type === 'dec') {
        str = str.replace(/(\b[0-9]+\b)/g, function (matchstr, parens) {
            return dec2char(parens);
        });
    }
    else if (type === 'utf8') {
        str = str.replace(/(( [A-Fa-f0-9]{2})+)/g, function (matchstr, parens) {
            return convertUTF82Char(parens);
        });
    }
    else if (type === 'utf16') {
        str = str.replace(/(( [A-Fa-f0-9]{1,6})+)/g, function (matchstr, parens) {
            return convertUTF162Char(parens);
        });
    }
    return str;
}
/**
 * Converts to characters a sequence of space-separated hex numbers representing bytes in utf8.
 * @param str {string} the input
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertUTF82Char(str) {
    let outputString = '';
    let counter = 0;
    let n = 0;
    // remove leading and trailing spaces
    str = str.replace(/^\s+/, '');
    str = str.replace(/\s+$/, '');
    if (str.length === 0) {
        return '';
    }
    str = str.replace(/\s+/g, ' ');
    let listArray = str.split(' ');
    for (let i = 0; i < listArray.length; i++) {
        let b = parseInt(listArray[i], 16); // alert('b:'+dec2hex(b));
        switch (counter) {
            case 0:
                if (0 <= b && b <= 0x7F) { // 0xxxxxxx
                    outputString += dec2char(b);
                }
                else if (0xC0 <= b && b <= 0xDF) { // 110xxxxx
                    counter = 1;
                    n = b & 0x1F;
                }
                else if (0xE0 <= b && b <= 0xEF) { // 1110xxxx
                    counter = 2;
                    n = b & 0xF;
                }
                else if (0xF0 <= b && b <= 0xF7) { // 11110xxx
                    counter = 3;
                    n = b & 0x7;
                }
                else {
                    outputString += 'convertUTF82Char: error1 ' + dec2hex(b) + '! ';
                }
                break;
            case 1:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertUTF82Char: error2 ' + dec2hex(b) + '! ';
                }
                counter--;
                outputString += dec2char((n << 6) | (b - 0x80));
                n = 0;
                break;
            case 2:
            case 3:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertUTF82Char: error3 ' + dec2hex(b) + '! ';
                }
                n = (n << 6) | (b - 0x80);
                counter--;
                break;
        }
    }
    return outputString.replace(/ $/, '');
}
/**
 * Converts a string of UTF-16 code units to characters
 * @param str {string} the input, the equence of UTF16 code units, separated by spaces.
 * @returns {string|null}
 * @memberOf module:xide/utils/StringUtils
 */
function convertUTF162Char(str) {
    let highsurrogate = 0;
    let outputString = '';
    // remove leading and multiple spaces
    str = str.replace(/^\s+/, '');
    str = str.replace(/\s+$/, '');
    if (str.length === 0) {
        return null;
    }
    str = str.replace(/\s+/g, ' ');
    let listArray = str.split(' ');
    for (let i = 0; i < listArray.length; i++) {
        let b = parseInt(listArray[i], 16);
        if (b < 0 || b > 0xFFFF) {
            outputString += '!Error in convertUTF162Char: unexpected value, b=' + dec2hex(b) + '!';
        }
        if (highsurrogate !== 0) {
            if (0xDC00 <= b && b <= 0xDFFF) {
                outputString += dec2char(0x10000 + ((highsurrogate - 0xD800) << 10) + (b - 0xDC00));
                highsurrogate = 0;
                continue;
            }
            else {
                outputString += 'Error in convertUTF162Char: low surrogate expected, b=' + dec2hex(b) + '!';
                highsurrogate = 0;
            }
        }
        if (0xD800 <= b && b <= 0xDBFF) { // start of supplementary character
            highsurrogate = b;
        }
        else {
            outputString += dec2char(b);
        }
    }
    return outputString;
}
/**
 * Converts to characters a sequence of %-separated hex numbers representing bytes in utf8.
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertpEsc2Char(str) {
    let outputString = '';
    let counter = 0;
    let n = 0;
    let listArray = str.split('%');
    for (let i = 1; i < listArray.length; i++) {
        let b = parseInt(listArray[i], 16);
        switch (counter) {
            case 0:
                if (0 <= b && b <= 0x7F) { // 0xxxxxxx
                    outputString += dec2char(b);
                }
                else if (0xC0 <= b && b <= 0xDF) { // 110xxxxx
                    counter = 1;
                    n = b & 0x1F;
                }
                else if (0xE0 <= b && b <= 0xEF) { // 1110xxxx
                    counter = 2;
                    n = b & 0xF;
                }
                else if (0xF0 <= b && b <= 0xF7) { // 11110xxx
                    counter = 3;
                    n = b & 0x7;
                }
                else {
                    outputString += 'convertpEsc2Char: error ' + dec2hex(b) + '! ';
                }
                break;
            case 1:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertpEsc2Char: error ' + dec2hex(b) + '! ';
                }
                counter--;
                outputString += dec2char((n << 6) | (b - 0x80));
                n = 0;
                break;
            case 2:
            case 3:
                if (b < 0x80 || b > 0xBF) {
                    outputString += 'convertpEsc2Char: error ' + dec2hex(b) + '! ';
                }
                n = (n << 6) | (b - 0x80);
                counter--;
                break;
        }
    }
    return outputString;
}
/**
 * Converts XML or HTML text to characters by removing all character entities and ncrs.
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertXML2Char(str) {
    // remove various escaped forms
    str = convertHexNCR2Char(str);
    str = convertDecNCR2Char(str);
    str = convertEntities2Char(str);
    return str;
}
// ============================== Convert to escapes ===============================================
/**
 * replaces xml/html syntax-sensitive characters in a string with entities
 * also replaces invisible and ambiguous characters with escapes (list to be extended).
 * @param str
 * @param parameters {boolean] if true, invisible characters are converted to NCRs
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2XML(str, parameters) {
    // bidimarkup: boolean, if true, bidi rle/lre/pdf/rli/lri/fsi/pdi characters are converted to markup
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    // replace invisible and ambiguous characters
    if (parameters.match(/convertinvisibles/)) {
        str = str.replace(/\u2066/g, '&#x2066;'); // lri
        str = str.replace(/\u2067/g, '&#x2067;'); // rli
        str = str.replace(/\u2068/g, '&#x2068;'); // fsi
        str = str.replace(/\u2069/g, '&#x2069;'); // pdi
        str = str.replace(/\u202A/g, '&#x202A;'); // lre
        str = str.replace(/\u202B/g, '&#x202B;'); // rle
        str = str.replace(/\u202D/g, '&#x202D;'); // lro
        str = str.replace(/\u202E/g, '&#x202E;'); // rlo
        str = str.replace(/\u202C/g, '&#x202C;'); // pdf
        str = str.replace(/\u200E/g, '&#x200E;'); // lrm
        str = str.replace(/\u200F/g, '&#x200F;'); // rlm
        str = str.replace(/\u2000/g, '&#x2000;'); // en quad
        str = str.replace(/\u2001/g, '&#x2001;'); // em quad
        str = str.replace(/\u2002/g, '&#x2002;'); // en space
        str = str.replace(/\u2003/g, '&#x2003;'); // em space
        str = str.replace(/\u2004/g, '&#x2004;'); // 3 per em space
        str = str.replace(/\u2005/g, '&#x2005;'); // 4 per em space
        str = str.replace(/\u2006/g, '&#x2006;'); // 6 per em space
        str = str.replace(/\u2007/g, '&#x2007;'); // figure space
        str = str.replace(/\u2008/g, '&#x2008;'); // punctuation space
        str = str.replace(/\u2009/g, '&#x2009;'); // thin space
        str = str.replace(/\u200A/g, '&#x200A;'); // hair space
        str = str.replace(/\u200B/g, '&#x200B;'); // zwsp
        str = str.replace(/\u205F/g, '&#x205F;'); // mmsp
        // str = str.replace(/\uA0/g, '&#xA0;') // nbsp
        str = str.replace(/\u3000/g, '&#x3000;'); // ideographic sp
        str = str.replace(/\u202F/g, '&#x202F;'); // nnbsp
        str = str.replace(/\u180B/g, '&#x180B;'); // mfvs1
        str = str.replace(/\u180C/g, '&#x180C;'); // mfvs2
        str = str.replace(/\u180D/g, '&#x180D;'); // mfvs3
        str = str.replace(/\u200C/g, '&#x200C;'); // zwnj
        str = str.replace(/\u200D/g, '&#x200D;'); // zwj
        str = str.replace(/\u2028/g, '&#x2028;'); // line sep
        str = str.replace(/\u206A/g, '&#x206A;'); // iss
        str = str.replace(/\u206B/g, '&#x206B;'); // ass
        str = str.replace(/\u206C/g, '&#x206C;'); // iafs
        str = str.replace(/\u206D/g, '&#x206D;'); // aafs
        str = str.replace(/\u206E/g, '&#x206E;'); // nads
        str = str.replace(/\u206F/g, '&#x206F;'); // nods
    }
    // convert lre/rle/pdf/rli/lri/fsi/pdi to markup
    if (parameters.match(/bidimarkup/)) {
        str = str.replace(/\u2066/g, '&lt;span dir=&quot;ltr&quot;&gt;'); // lri
        str = str.replace(/\u2067/g, '&lt;span dir=&quot;rtl&quot;&gt;'); // rli
        str = str.replace(/\u2068/g, '&lt;span dir=&quot;auto&quot;&gt;'); // fsi
        str = str.replace(/\u2069/g, '&lt;/span&gt;'); // pdi
        str = str.replace(/\u202A/g, '&lt;span dir=&quot;ltr&quot;&gt;'); //
        str = str.replace(/\u202B/g, '&lt;span dir=&quot;rtl&quot;&gt;');
        str = str.replace(/\u202C/g, '&lt;/span&gt;');
        str = str.replace(/&#x202A;/g, '&lt;span dir=&quot;ltr&quot;&gt;');
        str = str.replace(/&#x202B;/g, '&lt;span dir=&quot;rtl&quot;&gt;');
        // str = str.replace(/\u202D/g, '&lt;bdo dir=&quot;ltr&quot;&gt;')
        // str = str.replace(/\u202E/g, '&lt;bdo dir=&quot;rtl&quot;&gt;')
        str = str.replace(/&#x202C;/g, '&lt;/span&gt;');
    }
    return str;
}
/**
 * Converts a string of characters to code points or code point based escapes.
 * @param str {string} the input
 * @param parameters {string} enum [ascii, latin1], a set of characters to not convert.
 * @param pad {boolean} if true, hex numbers lower than 1000 are padded with zeros.
 * @param before {string} any characters to include before a code point (eg. &#x for NCRs).
 * @param after {string} any characters to include after (eg. ; for NCRs).
 * @param base {string] enum [hex, dec], hex or decimal output.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2SelectiveCPs(str, parameters, pad, before, after, base) {
    let haut = 0;
    let n = 0;
    let cp;
    let CPstring = '';
    for (let i = 0; i < str.length; i++) {
        let b = str.charCodeAt(i);
        if (b < 0 || b > 0xFFFF) {
            CPstring += 'Error in convertCharStr2SelectiveCPs: byte out of range ' + dec2hex(b) + '!';
        }
        if (haut !== 0) {
            if (0xDC00 <= b && b <= 0xDFFF) {
                if (base === 'hex') {
                    CPstring += before + dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00)) + after;
                }
                else {
                    cp = 0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00);
                    CPstring += before + cp + after;
                }
                haut = 0;
                continue;
            }
            else {
                CPstring += 'Error in convertCharStr2SelectiveCPs: surrogate out of range ' + dec2hex(haut) + '!';
                haut = 0;
            }
        }
        if (0xD800 <= b && b <= 0xDBFF) {
            haut = b;
        }
        else {
            if (parameters.match(/ascii/) && b <= 127) { //  && b != 0x3E && b != 0x3C &&  b != 0x26) {
                CPstring += str.charAt(i);
            }
            else if (b <= 255 && parameters.match(/latin1/)) { // && b != 0x3E && b != 0x3C &&  b != 0x26) {
                CPstring += str.charAt(i);
            }
            else {
                if (base === 'hex') {
                    cp = dec2hex(b);
                    if (pad) {
                        while (cp.length < 4) {
                            cp = '0' + cp;
                        }
                    }
                }
                else {
                    cp = b;
                }
                CPstring += before + cp + after;
            }
        }
    }
    return CPstring;
}
/**
 *
 * @param textString
 * @returns {string}
 */
function convertCharStr2HexNCR(textString) {
    let outputString = '';
    textString = textString.replace(/^\s+/, '');
    if (textString.length === 0) {
        return '';
    }
    textString = textString.replace(/\s+/g, ' ');
    let listArray = textString.split(' ');
    for (let i = 0; i < listArray.length; i++) {
        let n = parseInt(listArray[i], 16);
        outputString += '&#x' + dec2hex(n) + ';';
    }
    return (outputString);
}
/**
 *
 * @param str {string] sequence of Unicode characters
 * @returns {string}
 */
function convertCharStr2pEsc(str) {
    let outputString = '';
    let CPstring = convertChar2CP(str);
    if (str.length === 0) {
        return '';
    }
    // process each codepoint
    let listArray = CPstring.split(' ');
    for (let i = 0; i < listArray.length; i++) {
        let n = parseInt(listArray[i], 16);
        // if (i > 0) { outputString += ' ';}
        if (n === 0x20) {
            outputString += '%20';
        }
        else if (n >= 0x41 && n <= 0x5A) {
            outputString += String.fromCharCode(n);
        }
        else if (n >= 0x61 && n <= 0x7A) {
            // alpha
            outputString += String.fromCharCode(n);
        }
        else if (n >= 0x30 && n <= 0x39) {
            outputString += String.fromCharCode(n);
        }
        else if (n === 0x2D || n === 0x2E || n === 0x5F || n === 0x7E) {
            outputString += String.fromCharCode(n);
        }
        else if (n <= 0x7F) {
            // - . _ ~
            outputString += '%' + dec2hex2(n);
        }
        else if (n <= 0x7FF) {
            outputString += '%' + dec2hex2(0xC0 | ((n >> 6) & 0x1F)) + '%' + dec2hex2(0x80 | (n & 0x3F));
        }
        else if (n <= 0xFFFF) {
            outputString += '%' + dec2hex2(0xE0 | ((n >> 12) & 0x0F)) + '%' + dec2hex2(0x80 | ((n >> 6) & 0x3F)) + '%' + dec2hex2(0x80 | (n & 0x3F));
        }
        else if (n <= 0x10FFFF) {
            outputString += '%' + dec2hex2(0xF0 | ((n >> 18) & 0x07)) + '%' + dec2hex2(0x80 | ((n >> 12) & 0x3F)) + '%' + dec2hex2(0x80 | ((n >> 6) & 0x3F)) + '%' + dec2hex2(0x80 | (n & 0x3F));
        }
        else {
            outputString += '!Error ' + dec2hex(n) + '!';
        }
    }
    return (outputString);
}
/**
 * Converts a string of characters to UTF-8 byte codes, separated by spaces.
 * @param str {string} sequence of Unicode characters.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2UTF8(str) {
    let highsurrogate = 0;
    let suppCP; // decimal code point value for a supp char
    let n = 0;
    let outputString = '';
    for (let i = 0; i < str.length; i++) {
        let cc = str.charCodeAt(i);
        if (cc < 0 || cc > 0xFFFF) {
            outputString += '!Error in convertCharStr2UTF8: unexpected charCodeAt result, cc=' + cc + '!';
        }
        if (highsurrogate !== 0) {
            if (0xDC00 <= cc && cc <= 0xDFFF) {
                suppCP = 0x10000 + ((highsurrogate - 0xD800) << 10) + (cc - 0xDC00);
                outputString += ' ' + dec2hex2(0xF0 | ((suppCP >> 18) & 0x07)) + ' ' + dec2hex2(0x80 | ((suppCP >> 12) & 0x3F)) + ' ' + dec2hex2(0x80 | ((suppCP >> 6) & 0x3F)) + ' ' + dec2hex2(0x80 | (suppCP & 0x3F));
                highsurrogate = 0;
                continue;
            }
            else {
                outputString += 'Error in convertCharStr2UTF8: low surrogate expected, cc=' + cc + '!';
                highsurrogate = 0;
            }
        }
        if (0xD800 <= cc && cc <= 0xDBFF) { // high surrogate
            highsurrogate = cc;
        }
        else {
            if (cc <= 0x7F) {
                outputString += ' ' + dec2hex2(cc);
            }
            else if (cc <= 0x7FF) {
                outputString += ' ' + dec2hex2(0xC0 | ((cc >> 6) & 0x1F)) + ' ' + dec2hex2(0x80 | (cc & 0x3F));
            }
            else if (cc <= 0xFFFF) {
                outputString += ' ' + dec2hex2(0xE0 | ((cc >> 12) & 0x0F)) + ' ' + dec2hex2(0x80 | ((cc >> 6) & 0x3F)) + ' ' + dec2hex2(0x80 | (cc & 0x3F));
            }
        }
    }
    return outputString.substring(1);
}
/**
 * Converts a string of characters to UTF-16 code units, separated by spaces.
 * @param str {string} sequence of Unicode characters.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2UTF16(str) {
    let highsurrogate = 0;
    let suppCP;
    let n = 0;
    let outputString = '';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        let cc = str.charCodeAt(i);
        if (cc < 0 || cc > 0xFFFF) {
            outputString += '!Error in convertCharStr2UTF16: unexpected charCodeAt result, cc=' + cc + '!';
        }
        if (highsurrogate !== 0) {
            if (0xDC00 <= cc && cc <= 0xDFFF) {
                suppCP = 0x10000 + ((highsurrogate - 0xD800) << 10) + (cc - 0xDC00);
                suppCP -= 0x10000;
                outputString += dec2hex4(0xD800 | (suppCP >> 10)) + ' ' + dec2hex4(0xDC00 | (suppCP & 0x3FF)) + ' ';
                highsurrogate = 0;
                continue;
            }
            else {
                outputString += 'Error in convertCharStr2UTF16: low surrogate expected, cc=' + cc + '!';
                highsurrogate = 0;
            }
        }
        if (0xD800 <= cc && cc <= 0xDBFF) { // start of supplementary character
            highsurrogate = cc;
        }
        else {
            result = dec2hex(cc);
            while (result.length < 4) {
                result = '0' + result;
            }
            outputString += result + ' ';
        }
    }
    return outputString.substring(0, outputString.length - 1);
}
/**
 * Converts a string of characters to JavaScript escapes.
 * @param str {string} sequence of Unicode characters.
 * @param parameters {string} a semicolon separated string showing ids for checkboxes that are turned on.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2jEsc(str, parameters) {
    let highsurrogate = 0;
    let suppCP;
    let pad;
    let n = 0;
    let pars = parameters.split(';');
    let outputString = '';
    for (let i = 0; i < str.length; i++) {
        let cc = str.charCodeAt(i);
        if (cc < 0 || cc > 0xFFFF) {
            outputString += '!Error in convertCharStr2UTF16: unexpected charCodeAt result, cc=' + cc + '!';
        }
        if (highsurrogate !== 0) { // this is a supp char, and cc contains the low surrogate
            if (0xDC00 <= cc && cc <= 0xDFFF) {
                suppCP = 0x10000 + ((highsurrogate - 0xD800) << 10) + (cc - 0xDC00);
                if (parameters.match(/cstyleSC/)) {
                    pad = suppCP.toString(16);
                    while (pad.length < 8) {
                        pad = '0' + pad;
                    }
                    outputString += '\\U' + pad;
                }
                else if (parameters.match(/es6styleSC/)) {
                    pad = suppCP.toString(16);
                    outputString += '\\u{' + pad + '}';
                }
                else {
                    suppCP -= 0x10000;
                    outputString += '\\u' + dec2hex4(0xD800 | (suppCP >> 10)) + '\\u' + dec2hex4(0xDC00 | (suppCP & 0x3FF));
                }
                highsurrogate = 0;
                continue;
            }
            else {
                outputString += 'Error in convertCharStr2UTF16: low surrogate expected, cc=' + cc + '!';
                highsurrogate = 0;
            }
        }
        if (0xD800 <= cc && cc <= 0xDBFF) { // start of supplementary character
            highsurrogate = cc;
        }
        else { // this is a BMP character
            // outputString += dec2hex(cc) + ' ';
            switch (cc) {
                case 0:
                    outputString += '\\0';
                    break;
                case 8:
                    outputString += '\\b';
                    break;
                case 9:
                    if (parameters.match(/noCR/)) {
                        outputString += '\\t';
                    }
                    else {
                        outputString += '\t';
                    }
                    break;
                case 10:
                    if (parameters.match(/noCR/)) {
                        outputString += '\\n';
                    }
                    else {
                        outputString += '\n';
                    }
                    break;
                case 13:
                    if (parameters.match(/noCR/)) {
                        outputString += '\\r';
                    }
                    else {
                        outputString += '\r';
                    }
                    break;
                case 11:
                    outputString += '\\v';
                    break;
                case 12:
                    outputString += '\\f';
                    break;
                case 34:
                    if (parameters.match(/noCR/)) {
                        outputString += '\\\"';
                    }
                    else {
                        outputString += '"';
                    }
                    break;
                case 39:
                    if (parameters.match(/noCR/)) {
                        outputString += '\\\\';
                    }
                    else {
                        outputString += '\'';
                    }
                    break;
                case 92:
                    outputString += '\\\\';
                    break;
                default:
                    if (cc > 0x1f && cc < 0x7F) {
                        outputString += String.fromCharCode(cc);
                    }
                    else {
                        pad = cc.toString(16).toUpperCase();
                        while (pad.length < 4) {
                            pad = '0' + pad;
                        }
                        outputString += '\\u' + pad;
                    }
            }
        }
    }
    return outputString;
}
/**
 * Converts a string of characters to CSS escapes.
 * @param str {string} sequence of Unicode characters.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2CSS(str) {
    //
    //
    let highsurrogate = 0;
    let suppCP;
    let pad;
    let outputString = '';
    for (let i = 0; i < str.length; i++) {
        let cc = str.charCodeAt(i);
        if (cc < 0 || cc > 0xFFFF) {
            outputString += '!Error in convertCharStr2CSS: unexpected charCodeAt result, cc=' + cc + '!';
        }
        if (highsurrogate !== 0) { // this is a supp char, and cc contains the low surrogate
            if (0xDC00 <= cc && cc <= 0xDFFF) {
                suppCP = 0x10000 + ((highsurrogate - 0xD800) << 10) + (cc - 0xDC00);
                pad = suppCP.toString(16).toUpperCase();
                if (suppCP < 0x10000) {
                    while (pad.length < 4) {
                        pad = '0' + pad;
                    }
                }
                else {
                    while (pad.length < 6) {
                        pad = '0' + pad;
                    }
                }
                outputString += '\\' + pad + ' ';
                highsurrogate = 0;
                continue;
            }
            else {
                outputString += 'Error in convertCharStr2CSS: low surrogate expected, cc=' + cc + '!';
                highsurrogate = 0;
            }
        }
        if (0xD800 <= cc && cc <= 0xDBFF) { // start of supplementary character
            highsurrogate = cc;
        }
        else { // this is a BMP character
            if (cc === 0x5C) {
                outputString += '\\\\';
            }
            else if (cc > 0x1f && cc < 0x7F) {
                outputString += String.fromCharCode(cc);
            }
            else if (cc === 0x9 || cc === 0xA || cc === 0xD) {
                outputString += String.fromCharCode(cc);
            }
            else /* if (cc > 0x7E) */ {
                pad = cc.toString(16).toUpperCase();
                while (pad.length < 4) {
                    pad = '0' + pad;
                }
                outputString += '\\' + pad + ' ';
            }
        }
    }
    return outputString;
}
/**
 * Converts a string of characters to code points, separated by space.
 * @param textString {string} the input
 * @param parameters {string} enum [ascii, latin1], a set of characters to not convert.
 * @param pad {boolean} if true, hex numbers lower than 1000 are padded with zeros.
 * @param type {string} enum[hex, dec, unicode, zerox], whether output should be in hex or dec or unicode U+ form.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2CP(textString, parameters, pad, type) {
    let haut = 0;
    let n = 0;
    let CPstring = '';
    let afterEscape = false;
    let cp = '';
    for (let i = 0; i < textString.length; i++) {
        let b = textString.charCodeAt(i);
        if (b < 0 || b > 0xFFFF) {
            CPstring += 'Error in convertChar2CP: byte out of range ' + dec2hex(b) + '!';
        }
        if (haut !== 0) {
            if (0xDC00 <= b && b <= 0xDFFF) {
                if (afterEscape) {
                    CPstring += ' ';
                }
                if (type === 'hex') {
                    CPstring += dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00));
                }
                else if (type === 'unicode') {
                    CPstring += 'U+' + dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00));
                }
                else if (type === 'zerox') {
                    CPstring += '0x' + dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00));
                }
                else {
                    CPstring += 0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00);
                }
                haut = 0;
                continue;
            }
            else {
                CPstring += 'Error in convertChar2CP: surrogate out of range ' + dec2hex(haut) + '!';
                haut = 0;
            }
        }
        if (0xD800 <= b && b <= 0xDBFF) {
            haut = b;
        }
        else {
            if (b <= 127 && parameters.match(/ascii/)) {
                CPstring += textString.charAt(i);
                afterEscape = false;
            }
            else if (b <= 255 && parameters.match(/latin1/)) {
                CPstring += textString.charAt(i);
                afterEscape = false;
            }
            else {
                if (afterEscape) {
                    CPstring += ' ';
                }
                if (type === 'hex') {
                    cp = dec2hex(b);
                    if (pad) {
                        while (cp.length < 4) {
                            cp = '0' + cp;
                        }
                    }
                }
                else if (type === 'unicode') {
                    cp = dec2hex(b);
                    if (pad) {
                        while (cp.length < 4) {
                            cp = '0' + cp;
                        }
                    }
                    CPstring += 'U+';
                }
                else if (type === 'zerox') {
                    cp = dec2hex(b);
                    if (pad) {
                        while (cp.length < 4) {
                            cp = '0' + cp;
                        }
                    }
                    CPstring += '0x';
                }
                else {
                    cp = b;
                }
                CPstring += cp;
                afterEscape = true;
            }
        }
    }
    return CPstring;
}
/**
 * Converts a string of characters to U+... notation, separated by space.
 * @param textString {string} the input
 * @param preserve {string} enum [ascii, latin1], a set of characters to not convert.
 * @param pad {boolean} if true, hex numbers lower than 1000 are padded with zeros.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCharStr2Unicode(textString, preserve, pad) {
    // pad:
    let haut = 0;
    let n = 0;
    let CPstring = '';
    let cp = '';
    pad = false;
    for (let i = 0; i < textString.length; i++) {
        let b = textString.charCodeAt(i);
        if (b < 0 || b > 0xFFFF) {
            CPstring += 'Error in convertChar2CP: byte out of range ' + dec2hex(b) + '!';
        }
        if (haut !== 0) {
            if (0xDC00 <= b && b <= 0xDFFF) {
                CPstring += 'U+' + dec2hex(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00)) + ' ';
                haut = 0;
                continue;
            }
            else {
                CPstring += 'Error in convertChar2CP: surrogate out of range ' + dec2hex(haut) + '!';
                haut = 0;
            }
        }
        if (0xD800 <= b && b <= 0xDBFF) {
            haut = b;
        }
        else {
            if (b <= 127 && preserve === 'ascii') {
                CPstring += textString.charAt(i) + ' ';
            }
            else if (b <= 255 && preserve === 'latin1') {
                CPstring += textString.charAt(i) + ' ';
            }
            else {
                cp = dec2hex(b);
                if (pad) {
                    while (cp.length < 4) {
                        cp = '0' + cp;
                    }
                }
                CPstring += 'U+' + cp + ' ';
            }
        }
    }
    return CPstring.substring(0, CPstring.length - 1);
}
let digit_array = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');
/**
 *
 * @param n
 * @returns {string}
 */
const to_hex = function (n) {
    let hex_result = '';
    let the_start = true;
    for (let i = 32; i > 0;) {
        i -= 4;
        let one_digit = (n >> i) & 0xf;
        if (!the_start || one_digit !== 0) {
            the_start = false;
            hex_result += digit_array[one_digit];
        }
    }
    return '0x' + (hex_result === '' ? '0' : hex_result);
};
exports.to_hex = to_hex;
/**
 * Unescape hex sequences like 'x0d' to chars
 * @param str {string}
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
const replaceHex = (str) => {
    if (_.isString(str)) {
        return str.replace(/x([0-9A-Fa-f]{2})/gmi, function () {
            return String.fromCharCode(parseInt(arguments[1], 16));
        });
    }
    return str;
};
exports.replaceHex = replaceHex;
let zero = function (n, max) {
    n = n.toString(16).toUpperCase();
    while (n.length < max) {
        n = '0' + n;
    }
    return n;
};
function d2h(d) {
    return d.toString(16);
}
function h2d(h) {
    return parseInt(h, 16);
}
/**
 * Convert a string into hex values
 * @memberOf module:xide/utils/StringUtils
 * @param string {string}
 * @returns {string}
 */
const stringToHex = (string) => {
    let str = '';
    let i = 0;
    let tmp_len = string.length;
    let c;
    for (; i < tmp_len; i += 1) {
        c = string.charCodeAt(i);
        str += zero(d2h(c), 2) + ' ';
    }
    return str;
};
exports.stringToHex = stringToHex;
/**
 * Returns buffer compatible string
 * @param string
 * @example
 * utils.stringToHex("a b") returns "61 20 62"
 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
const stringToBufferStr = (string) => {
    let i = 0;
    let tmp_len = string.length;
    let c;
    let arr = [];
    for (; i < tmp_len; i += 1) {
        c = string.charCodeAt(i);
        arr.push(c);
    }
    return arr.join(',');
};
exports.stringToBufferStr = stringToBufferStr;
/**
 * Return an integer array (as Buffer) for a string
 * @param string
 * @returns {Array}
 */
const stringToBuffer = (string) => {
    let i = 0;
    let tmp_len = string.length;
    let c;
    let arr = [];
    for (; i < tmp_len; i += 1) {
        c = string.charCodeAt(i);
        arr.push(c);
    }
    return arr;
};
exports.stringToBuffer = stringToBuffer;
/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {String} The hex version of the buffer string
 */
const bufferToHexString = (bufferString) => {
    let bytesArray = bufferString.indexOf(',') !== -1 ? bufferString.split(',') : [bufferString];
    let tmp = [];
    for (let i = 0; i < bytesArray.length; i++) {
        let dec = bytesArray[i];
        tmp.push(dec2hex2(dec));
    }
    return tmp.join(' ');
};
exports.bufferToHexString = bufferToHexString;
/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {integer} The integer array
 */
const bufferFromDecString = (bufferString) => {
    let bytesArray = bufferString.indexOf(',') !== -1 ? bufferString.split(',') : [bufferString];
    for (let i = 0; i < bytesArray.length; i++) {
        bytesArray[i] = parseInt(bytesArray[i], 10);
    }
    return bytesArray;
};
exports.bufferFromDecString = bufferFromDecString;
/**
 * Return a buffer like formatted string "0a 12"
 * @param string
 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
const stringFromDecString = (string) => {
    let buffer = (0, exports.bufferFromDecString)(string);
    let result = '';
    for (let i = 0; i < buffer.length; i++) {
        result += String.fromCharCode(buffer[i], 16);
    }
    return result;
};
exports.stringFromDecString = stringFromDecString;
/**
 *
 * @param string
 * @returns {string}
 */
const stringToHex2 = (string) => {
    let str = '';
    let i = 0;
    let tmp_len = string.length;
    let c;
    for (; i < tmp_len; i += 1) {
        c = string.charCodeAt(i);
        str += zero(d2h(c), 2) + ' ';
    }
    return str;
};
exports.stringToHex2 = stringToHex2;
/**
 *
 * @param string {string}
 * @returns {string}
 */
const hexToString = (string) => {
    let arr = string.split(' ');
    let str = '';
    let i = 0;
    let arr_len = arr.length;
    let c;
    for (; i < arr_len; i += 1) {
        c = String.fromCharCode(h2d(arr[i]));
        str += c;
    }
    return str;
};
exports.hexToString = hexToString;
/**
 *
 * @param buffer
 * @returns {string}
 */
const prettyHex = function (buffer) {
    let rows = Math.ceil(buffer.length / 16);
    let last = buffer.length % 16 || 16;
    let offsetLength = buffer.length.toString(16).length;
    if (offsetLength < 6) {
        offsetLength = 6;
    }
    let str = 'Offset';
    while (str.length < offsetLength) {
        str += ' ';
    }
    str = '\u001b[36m' + str + '  ';
    let i;
    for (i = 0; i < 16; i++) {
        str += ' ' + zero(i, 2);
    }
    str += '\u001b[0m\n';
    if (buffer.length) {
        str += '\n';
    }
    let b = 0;
    let lastBytes;
    let lastSpaces;
    let v;
    for (i = 0; i < rows; i++) {
        str += '\u001b[36m' + zero(b, offsetLength) + '\u001b[0m  ';
        lastBytes = i === rows - 1 ? last : 16;
        lastSpaces = 16 - lastBytes;
        let j;
        for (j = 0; j < lastBytes; j++) {
            str += ' ' + zero(buffer[b], 2);
            b++;
        }
        for (j = 0; j < lastSpaces; j++) {
            str += '   ';
        }
        b -= lastBytes;
        str += '   ';
        for (j = 0; j < lastBytes; j++) {
            v = buffer[b];
            str += (v > 31 && v < 127) || v > 159 ? String.fromCharCode(v) : '.';
            b++;
        }
        str += '\n';
    }
    return str;
};
exports.prettyHex = prettyHex;
/**
 *
 * @param str
 * @param prefix
 * @returns {string}
 */
const hexEncode = (str, prefix) => {
    let hex;
    let i;
    let result = '';
    for (i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ((prefix !== null ? prefix : '000') + hex).slice(-4);
    }
    return result;
};
exports.hexEncode = hexEncode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGV4VXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL0hleFV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQztBQUN0QixNQUFNLEtBQUssR0FBUSxFQUFFLENBQUE7QUFDckIsTUFBTSxJQUFJLEdBQVEsRUFBRSxDQUFDO0FBRXJCLDRCQUE0QjtBQUM1Qjs7Ozs7O0dBTUc7QUFDSCxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO0lBQ3JDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFCLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRTtRQUNiLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3BDO1NBQU0sSUFBSSxDQUFDLElBQUksUUFBUSxFQUFFO1FBQ3RCLENBQUMsSUFBSSxPQUFPLENBQUM7UUFDYixNQUFNLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2pHO1NBQU07UUFDSCxNQUFNLElBQUksMkNBQTJDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3RFO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQyxDQUFBO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFO0lBQzNCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUU7UUFDYixNQUFNLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNwQztTQUFNLElBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRTtRQUN0QixDQUFDLElBQUksT0FBTyxDQUFDO1FBQ2IsTUFBTSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUNqRztTQUFNO1FBQ0gsTUFBTSxJQUFJLDJDQUEyQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0RTtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQTtBQUVELE1BQU0sT0FBTyxHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7QUFFNUUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUVoRyxNQUFNLFFBQVEsR0FBRyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFFaEcsTUFBTSxRQUFRLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRTtJQUM1QixPQUFPLFFBQVEsQ0FBQyxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1VBQ3ZFLFFBQVEsQ0FBQyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ3pFLENBQUMsQ0FBQTtBQUVELE1BQU0sY0FBYyxHQUFHLENBQUMsVUFBa0IsRUFBRSxFQUFFO0lBQzFDLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN4QyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFO1lBQ3JCLFFBQVEsSUFBSSw2Q0FBNkMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQ2hGO1FBQ0QsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ1osSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUU7Z0JBQzVCLFFBQVEsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQzVFLElBQUksR0FBRyxDQUFDLENBQUM7Z0JBQ1QsU0FBUzthQUNaO2lCQUFNO2dCQUNILFFBQVEsSUFBSSxrREFBa0QsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNyRixJQUFJLEdBQUcsQ0FBQyxDQUFDO2FBQ1o7U0FDSjtRQUNELElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFO1lBQzVCLElBQUksR0FBRyxDQUFDLENBQUM7U0FDWjthQUFNO1lBQ0gsUUFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDaEM7S0FDSjtJQUNELE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDLENBQUE7QUFFRDs7R0FFRztBQUNILE1BQU0sZ0NBQWdDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtJQUM3Qyw4Q0FBOEM7SUFDOUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsNEJBQTRCO0lBQzFDLHVEQUF1RDtJQUN2RCxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FDekMsQ0FBQztJQUNGLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFBO0FBRUQscUdBQXFHO0FBQ3JHOzs7Ozs7R0FNRztBQUNJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFXLEVBQUUsT0FBZSxFQUFnQixFQUFFO0lBQzVFLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNoQixHQUFHLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0IsR0FBRyxHQUFHLGdDQUFnQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTVDLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3QixHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLElBQUksR0FBRyxFQUFFO1FBQ0wsR0FBRyxHQUFHLElBQUEsd0JBQWdCLEVBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JDO1NBQU07UUFDSCxHQUFHLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsR0FBRyxHQUFHLElBQUEsdUJBQWUsRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDckM7SUFDRCxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUIsR0FBRyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFeEMsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUE7QUFuQlksUUFBQSxpQkFBaUIscUJBbUI3QjtBQUNEOzs7OztHQUtHO0FBQ0gsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO0lBQ2hELGtEQUFrRDtJQUNsRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFDekMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUNoRCxDQUFDO0lBQ0YsbURBQW1EO0lBQ25ELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLDJCQUEyQixFQUN6QyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FDekMsQ0FBQztJQUNGLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFBO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUFHLEVBQVUsRUFBRTtJQUN2Qyw4Q0FBOEM7SUFDOUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQ3ZDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxDQUFDO0lBQ0YsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUE7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEdBQUcsRUFBVSxFQUFFO0lBQ3ZDLDhDQUE4QztJQUM5QyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFDaEMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQ3pDLENBQUM7SUFDRixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQTtBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLGlCQUFpQixHQUFHLENBQUMsR0FBVyxFQUFVLEVBQUU7SUFDOUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQ3JDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxDQUFDO0lBQ0YsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUE7QUFFRDs7Ozs7OztHQU9HO0FBQ0ksTUFBTSxlQUFlLEdBQUcsQ0FBQyxHQUFXLEVBQUUsZ0JBQXlCLEVBQVUsRUFBRTtJQUM5RSxJQUFJLGdCQUFnQixFQUFFO1FBQ2xCLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLDRCQUE0QixFQUMxQyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FDekMsQ0FBQztRQUNGLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNoQztTQUFNO1FBQ0gsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLEVBQzFDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxDQUFDO0tBQ0w7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQTtBQVpZLFFBQUEsZUFBZSxtQkFZM0I7QUFFRDs7Ozs7O0dBTUc7QUFDSSxNQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBVyxFQUFFLFlBQXFCLEVBQU8sRUFBRTtJQUN4RSxvQ0FBb0M7SUFDcEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQ3pDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxDQUFDO0lBQ0YsK0NBQStDO0lBQy9DLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUNwQyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FDekMsQ0FBQztJQUNGLCtDQUErQztJQUMvQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsRUFDcEMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQ3pDLENBQUM7SUFDRiw0Q0FBNEM7SUFDNUMsSUFBSSxZQUFZLEVBQUU7UUFDZCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNwQztJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFBO0FBMUJZLFFBQUEsZ0JBQWdCLG9CQTBCNUI7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFXLEVBQVUsRUFBRTtJQUM3Qyx1RUFBdUU7SUFDdkUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQ3JDLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQ2pELENBQUM7SUFDRixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQTtBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FBQyxHQUFHO0lBQzdCLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFDakMsVUFBVSxRQUFRLEVBQUUsTUFBTTtRQUN0QixJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUU7WUFDcEIsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDM0I7YUFBTTtZQUNILE9BQU8sUUFBUSxDQUFDO1NBQ25CO0lBQ0wsQ0FBQyxDQUNKLENBQUM7SUFDRixPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxJQUFJO0lBQ2xDLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtRQUNoQixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsRUFDdkMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQ3pDLENBQUM7S0FDTDtTQUFNLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtRQUN2QixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQzdCLFVBQVUsUUFBUSxFQUFFLE1BQU07WUFDdEIsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUNKLENBQUM7S0FDTDtTQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTtRQUN4QixHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFDckMsVUFBVSxRQUFRLEVBQUUsTUFBTTtZQUN0QixPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FDSixDQUFDO0tBQ0w7U0FBTSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7UUFDekIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQ3ZDLFVBQVUsUUFBUSxFQUFFLE1BQU07WUFDdEIsT0FBTyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxDQUFDLENBQ0osQ0FBQztLQUNMO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLGdCQUFnQixDQUFDLEdBQUc7SUFDekIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFVixxQ0FBcUM7SUFDckMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlCLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2xCLE9BQU8sRUFBRSxDQUFDO0tBQ2I7SUFDRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFL0IsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN2QyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUUsMEJBQTBCO1FBQy9ELFFBQVEsT0FBTyxFQUFFO1lBQ2IsS0FBSyxDQUFDO2dCQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUcsV0FBVztvQkFDbkMsWUFBWSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDL0I7cUJBQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRyxXQUFXO29CQUM3QyxPQUFPLEdBQUcsQ0FBQyxDQUFDO29CQUNaLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO2lCQUNoQjtxQkFBTSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFHLFdBQVc7b0JBQzdDLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ1osQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7aUJBQ2Y7cUJBQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRyxXQUFXO29CQUM3QyxPQUFPLEdBQUcsQ0FBQyxDQUFDO29CQUNaLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO2lCQUNmO3FCQUFNO29CQUNILFlBQVksSUFBSSwyQkFBMkIsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO2lCQUNuRTtnQkFDRCxNQUFNO1lBQ1YsS0FBSyxDQUFDO2dCQUNGLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFO29CQUN0QixZQUFZLElBQUksMkJBQTJCLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztpQkFDbkU7Z0JBQ0QsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsWUFBWSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNOLE1BQU07WUFDVixLQUFLLENBQUMsQ0FBQztZQUNQLEtBQUssQ0FBQztnQkFDRixJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRTtvQkFDdEIsWUFBWSxJQUFJLDJCQUEyQixHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7aUJBQ25FO2dCQUNELENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDMUIsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsTUFBTTtTQUNiO0tBQ0o7SUFDRCxPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsaUJBQWlCLENBQUMsR0FBRztJQUMxQixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBRXRCLHFDQUFxQztJQUNyQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzlCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDbEIsT0FBTyxJQUFJLENBQUM7S0FDZjtJQUNELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUUvQixJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLEVBQUU7WUFDckIsWUFBWSxJQUFJLG1EQUFtRCxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDMUY7UUFDRCxJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUU7WUFDckIsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUU7Z0JBQzVCLFlBQVksSUFBSSxRQUFRLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDcEYsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFDbEIsU0FBUzthQUNaO2lCQUFNO2dCQUNILFlBQVksSUFBSSx3REFBd0QsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUM1RixhQUFhLEdBQUcsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0o7UUFDRCxJQUFJLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRSxFQUFFLG1DQUFtQztZQUNqRSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1NBQ3JCO2FBQU07WUFDSCxZQUFZLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQy9CO0tBQ0o7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN4QixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLGdCQUFnQixDQUFDLEdBQUc7SUFDekIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFVixJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsUUFBUSxPQUFPLEVBQUU7WUFDYixLQUFLLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsRUFBRSxXQUFXO29CQUNsQyxZQUFZLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUMvQjtxQkFBTSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFHLFdBQVc7b0JBQzdDLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ1osQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7aUJBQ2hCO3FCQUFNLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUcsV0FBVztvQkFDN0MsT0FBTyxHQUFHLENBQUMsQ0FBQztvQkFDWixDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztpQkFDZjtxQkFBTSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFHLFdBQVc7b0JBQzdDLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ1osQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7aUJBQ2Y7cUJBQU07b0JBQ0gsWUFBWSxJQUFJLDBCQUEwQixHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7aUJBQ2xFO2dCQUNELE1BQU07WUFDVixLQUFLLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUU7b0JBQ3RCLFlBQVksSUFBSSwwQkFBMEIsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO2lCQUNsRTtnQkFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixZQUFZLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ04sTUFBTTtZQUNWLEtBQUssQ0FBQyxDQUFDO1lBQ1AsS0FBSyxDQUFDO2dCQUNGLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFO29CQUN0QixZQUFZLElBQUksMEJBQTBCLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztpQkFDbEU7Z0JBQ0QsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUMxQixPQUFPLEVBQUUsQ0FBQztnQkFDVixNQUFNO1NBQ2I7S0FDSjtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3hCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsZUFBZSxDQUFDLEdBQUc7SUFDeEIsK0JBQStCO0lBQy9CLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixHQUFHLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsR0FBRyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQztBQUVELG9HQUFvRztBQUVwRzs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsVUFBVTtJQUN2QyxvR0FBb0c7SUFDcEcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRWhDLDZDQUE2QztJQUM3QyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsRUFBRTtRQUN2QyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBRSxNQUFNO1FBQ2pELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFFLE1BQU07UUFDakQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUUsTUFBTTtRQUNqRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBRSxNQUFNO1FBRWpELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDaEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNoRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ2hELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDaEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUNoRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ2hELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFFaEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVTtRQUNwRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVO1FBQ3BELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVc7UUFDckQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVztRQUNyRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7UUFDM0QsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCO1FBQzNELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLGlCQUFpQjtRQUMzRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlO1FBQ3pELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjtRQUM5RCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxhQUFhO1FBQ3ZELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLGFBQWE7UUFDdkQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTztRQUNqRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ2pELCtDQUErQztRQUMvQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7UUFDM0QsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUVsRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxRQUFRO1FBQ2xELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFDbEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUVsRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ2pELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDaEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVztRQUNyRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ2hELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDaEQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTztRQUNqRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPO1FBQ2pELEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU87UUFDakQsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTztLQUNwRDtJQUVELGdEQUFnRDtJQUNoRCxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUU7UUFDaEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBQ3hFLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUN4RSxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsbUNBQW1DLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDekUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUVyRCxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFDcEUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7UUFDakUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQzlDLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ25FLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ25FLGtFQUFrRTtRQUNsRSxrRUFBa0U7UUFDbEUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0tBQ25EO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJO0lBQzFFLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksRUFBRSxDQUFDO0lBQ1AsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLEVBQUU7WUFDckIsUUFBUSxJQUFJLDBEQUEwRCxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDN0Y7UUFDRCxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDWixJQUFJLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRTtnQkFDNUIsSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFO29CQUNoQixRQUFRLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztpQkFDMUY7cUJBQU07b0JBQ0gsRUFBRSxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO29CQUN0RCxRQUFRLElBQUksTUFBTSxHQUFHLEVBQUUsR0FBRyxLQUFLLENBQUM7aUJBQ25DO2dCQUNELElBQUksR0FBRyxDQUFDLENBQUM7Z0JBQ1QsU0FBUzthQUNaO2lCQUFNO2dCQUNILFFBQVEsSUFBSSwrREFBK0QsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNsRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2FBQ1o7U0FDSjtRQUNELElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFO1lBQzVCLElBQUksR0FBRyxDQUFDLENBQUM7U0FDWjthQUFNO1lBQ0gsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsRUFBRSw4Q0FBOEM7Z0JBQ3ZGLFFBQVEsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdCO2lCQUFNLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsNkNBQTZDO2dCQUM5RixRQUFRLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM3QjtpQkFBTTtnQkFDSCxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7b0JBQ2hCLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hCLElBQUksR0FBRyxFQUFFO3dCQUNMLE9BQU8sRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7NEJBQ2xCLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO3lCQUNqQjtxQkFDSjtpQkFDSjtxQkFBTTtvQkFDSCxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNWO2dCQUNELFFBQVEsSUFBSSxNQUFNLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQzthQUNuQztTQUNKO0tBQ0o7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNwQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMscUJBQXFCLENBQUMsVUFBVTtJQUNyQyxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDdEIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDekIsT0FBTyxFQUFFLENBQUM7S0FDYjtJQUNELFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM3QyxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDbkMsWUFBWSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0tBQzVDO0lBQ0QsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxtQkFBbUIsQ0FBQyxHQUFHO0lBQzVCLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLFFBQVEsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDbkMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNsQixPQUFPLEVBQUUsQ0FBQztLQUNiO0lBQ0QseUJBQXlCO0lBQ3pCLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdkMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ1osWUFBWSxJQUFJLEtBQUssQ0FBQztTQUN6QjthQUFNLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQy9CLFlBQVksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzFDO2FBQU0sSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDL0IsUUFBUTtZQUNSLFlBQVksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzFDO2FBQU0sSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDL0IsWUFBWSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDN0QsWUFBWSxJQUFJLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDMUM7YUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDbEIsVUFBVTtZQUNWLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JDO2FBQU0sSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO1lBQ25CLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNoRzthQUFNLElBQUksQ0FBQyxJQUFJLE1BQU0sRUFBRTtZQUNwQixZQUFZLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzVJO2FBQU0sSUFBSSxDQUFDLElBQUksUUFBUSxFQUFFO1lBQ3RCLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3hMO2FBQU07WUFDSCxZQUFZLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDaEQ7S0FDSjtJQUNELE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMxQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLG1CQUFtQixDQUFDLEdBQUc7SUFDNUIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksTUFBTSxDQUFDLENBQUMsMkNBQTJDO0lBQ3ZELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztJQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNqQyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsTUFBTSxFQUFFO1lBQ3ZCLFlBQVksSUFBSSxrRUFBa0UsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDO1NBQ2pHO1FBQ0QsSUFBSSxhQUFhLEtBQUssQ0FBQyxFQUFFO1lBQ3JCLElBQUksTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksTUFBTSxFQUFFO2dCQUM5QixNQUFNLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6TSxhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQixTQUFTO2FBQ1o7aUJBQU07Z0JBQ0gsWUFBWSxJQUFJLDJEQUEyRCxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7Z0JBQ3ZGLGFBQWEsR0FBRyxDQUFDLENBQUM7YUFDckI7U0FDSjtRQUNELElBQUksTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksTUFBTSxFQUFFLEVBQUUsaUJBQWlCO1lBQ2pELGFBQWEsR0FBRyxFQUFFLENBQUM7U0FDdEI7YUFBTTtZQUNILElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDWixZQUFZLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUN0QztpQkFBTSxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUU7Z0JBQ3BCLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNsRztpQkFBTSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQ3JCLFlBQVksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDL0k7U0FDSjtLQUNKO0lBQ0QsT0FBTyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsb0JBQW9CLENBQUMsR0FBRztJQUM3QixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxNQUFNLENBQUM7SUFDWCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7SUFDdEIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLEVBQUU7WUFDdkIsWUFBWSxJQUFJLG1FQUFtRSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7U0FDbEc7UUFDRCxJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUU7WUFDckIsSUFBSSxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxJQUFJLE9BQU8sQ0FBQztnQkFDbEIsWUFBWSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztnQkFDcEcsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFDbEIsU0FBUzthQUNaO2lCQUFNO2dCQUNILFlBQVksSUFBSSw0REFBNEQsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDO2dCQUN4RixhQUFhLEdBQUcsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0o7UUFDRCxJQUFJLE1BQU0sSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLE1BQU0sRUFBRSxFQUFFLG1DQUFtQztZQUNuRSxhQUFhLEdBQUcsRUFBRSxDQUFDO1NBQ3RCO2FBQU07WUFDSCxNQUFNLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3JCLE9BQU8sTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDO2FBQ3pCO1lBQ0QsWUFBWSxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUM7U0FDaEM7S0FDSjtJQUNELE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsVUFBVTtJQUN4QyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxNQUFNLENBQUM7SUFDWCxJQUFJLEdBQUcsQ0FBQztJQUNSLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLEVBQUU7WUFDdkIsWUFBWSxJQUFJLG1FQUFtRSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7U0FDbEc7UUFDRCxJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUUsRUFBRSx5REFBeUQ7WUFDaEYsSUFBSSxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUM5QixHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDMUIsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDbkIsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7cUJBQ25CO29CQUNELFlBQVksSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDO2lCQUMvQjtxQkFBTSxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUU7b0JBQ3ZDLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMxQixZQUFZLElBQUksTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7aUJBQ3RDO3FCQUFNO29CQUNILE1BQU0sSUFBSSxPQUFPLENBQUM7b0JBQ2xCLFlBQVksSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQzNHO2dCQUNELGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLFNBQVM7YUFDWjtpQkFBTTtnQkFDSCxZQUFZLElBQUksNERBQTRELEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQztnQkFDeEYsYUFBYSxHQUFHLENBQUMsQ0FBQzthQUNyQjtTQUNKO1FBQ0QsSUFBSSxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUUsRUFBRSxtQ0FBbUM7WUFDbkUsYUFBYSxHQUFHLEVBQUUsQ0FBQztTQUN0QjthQUFNLEVBQUUsMEJBQTBCO1lBQy9CLHFDQUFxQztZQUNyQyxRQUFRLEVBQUUsRUFBRTtnQkFDUixLQUFLLENBQUM7b0JBQ0YsWUFBWSxJQUFJLEtBQUssQ0FBQztvQkFDdEIsTUFBTTtnQkFDVixLQUFLLENBQUM7b0JBQ0YsWUFBWSxJQUFJLEtBQUssQ0FBQztvQkFDdEIsTUFBTTtnQkFDVixLQUFLLENBQUM7b0JBQ0YsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMxQixZQUFZLElBQUksS0FBSyxDQUFDO3FCQUN6Qjt5QkFBTTt3QkFDSCxZQUFZLElBQUksSUFBSSxDQUFDO3FCQUN4QjtvQkFDRCxNQUFNO2dCQUNWLEtBQUssRUFBRTtvQkFDSCxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzFCLFlBQVksSUFBSSxLQUFLLENBQUM7cUJBQ3pCO3lCQUFNO3dCQUNILFlBQVksSUFBSSxJQUFJLENBQUM7cUJBQ3hCO29CQUNELE1BQU07Z0JBQ1YsS0FBSyxFQUFFO29CQUNILElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDMUIsWUFBWSxJQUFJLEtBQUssQ0FBQztxQkFDekI7eUJBQU07d0JBQ0gsWUFBWSxJQUFJLElBQUksQ0FBQztxQkFDeEI7b0JBQ0QsTUFBTTtnQkFDVixLQUFLLEVBQUU7b0JBQ0gsWUFBWSxJQUFJLEtBQUssQ0FBQztvQkFDdEIsTUFBTTtnQkFDVixLQUFLLEVBQUU7b0JBQ0gsWUFBWSxJQUFJLEtBQUssQ0FBQztvQkFDdEIsTUFBTTtnQkFDVixLQUFLLEVBQUU7b0JBQ0gsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMxQixZQUFZLElBQUksTUFBTSxDQUFDO3FCQUMxQjt5QkFBTTt3QkFDSCxZQUFZLElBQUksR0FBRyxDQUFDO3FCQUN2QjtvQkFDRCxNQUFNO2dCQUNWLEtBQUssRUFBRTtvQkFDSCxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7d0JBQzFCLFlBQVksSUFBSSxNQUFNLENBQUM7cUJBQzFCO3lCQUFNO3dCQUNILFlBQVksSUFBSSxJQUFJLENBQUM7cUJBQ3hCO29CQUNELE1BQU07Z0JBQ1YsS0FBSyxFQUFFO29CQUNILFlBQVksSUFBSSxNQUFNLENBQUM7b0JBQ3ZCLE1BQU07Z0JBQ1Y7b0JBQ0ksSUFBSSxFQUFFLEdBQUcsSUFBSSxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUU7d0JBQ3hCLFlBQVksSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUMzQzt5QkFBTTt3QkFDSCxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDcEMsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDbkIsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7eUJBQ25CO3dCQUNELFlBQVksSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDO3FCQUMvQjthQUNSO1NBQ0o7S0FDSjtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3hCLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsa0JBQWtCLENBQUMsR0FBRztJQUMzQixFQUFFO0lBQ0YsRUFBRTtJQUNGLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLE1BQU0sQ0FBQztJQUNYLElBQUksR0FBRyxDQUFDO0lBQ1IsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLEVBQUU7WUFDdkIsWUFBWSxJQUFJLGlFQUFpRSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7U0FDaEc7UUFDRCxJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUUsRUFBRSx5REFBeUQ7WUFDaEYsSUFBSSxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUU7Z0JBQzlCLE1BQU0sR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQztnQkFDcEUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksTUFBTSxHQUFHLE9BQU8sRUFBRTtvQkFDbEIsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDbkIsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7cUJBQ25CO2lCQUNKO3FCQUFNO29CQUNILE9BQU8sR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7d0JBQ25CLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO3FCQUNuQjtpQkFDSjtnQkFDRCxZQUFZLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7Z0JBQ2pDLGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLFNBQVM7YUFDWjtpQkFBTTtnQkFDSCxZQUFZLElBQUksMERBQTBELEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQztnQkFDdEYsYUFBYSxHQUFHLENBQUMsQ0FBQzthQUNyQjtTQUNKO1FBQ0QsSUFBSSxNQUFNLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxNQUFNLEVBQUUsRUFBRSxtQ0FBbUM7WUFDbkUsYUFBYSxHQUFHLEVBQUUsQ0FBQztTQUN0QjthQUFNLEVBQUUsMEJBQTBCO1lBQy9CLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDYixZQUFZLElBQUksTUFBTSxDQUFDO2FBQzFCO2lCQUFNLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxFQUFFO2dCQUMvQixZQUFZLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUMzQztpQkFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxFQUFFO2dCQUMvQyxZQUFZLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUMzQztpQkFBTSxvQkFBb0IsQ0FBQztnQkFDeEIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ25CLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO2lCQUNuQjtnQkFDRCxZQUFZLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7YUFDcEM7U0FDSjtLQUNKO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDeEIsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJO0lBQ3hELElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDeEIsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ1osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sRUFBRTtZQUNyQixRQUFRLElBQUksNkNBQTZDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNoRjtRQUNELElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNaLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFO2dCQUM1QixJQUFJLFdBQVcsRUFBRTtvQkFDYixRQUFRLElBQUksR0FBRyxDQUFDO2lCQUNuQjtnQkFDRCxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUU7b0JBQ2hCLFFBQVEsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztpQkFDekU7cUJBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUMzQixRQUFRLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO2lCQUNoRjtxQkFBTSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7b0JBQ3pCLFFBQVEsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ2hGO3FCQUFNO29CQUNILFFBQVEsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztpQkFDaEU7Z0JBQ0QsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDVCxTQUFTO2FBQ1o7aUJBQU07Z0JBQ0gsUUFBUSxJQUFJLGtEQUFrRCxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQ3JGLElBQUksR0FBRyxDQUFDLENBQUM7YUFDWjtTQUNKO1FBQ0QsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUMsQ0FBQztTQUNaO2FBQU07WUFDSCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdkMsUUFBUSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLFdBQVcsR0FBRyxLQUFLLENBQUM7YUFDdkI7aUJBQU0sSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQy9DLFFBQVEsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxXQUFXLEdBQUcsS0FBSyxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNILElBQUksV0FBVyxFQUFFO29CQUNiLFFBQVEsSUFBSSxHQUFHLENBQUM7aUJBQ25CO2dCQUNELElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtvQkFDaEIsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxHQUFHLEVBQUU7d0JBQ0wsT0FBTyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDbEIsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7eUJBQ2pCO3FCQUNKO2lCQUNKO3FCQUFNLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRTtvQkFDM0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxHQUFHLEVBQUU7d0JBQ0wsT0FBTyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDbEIsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7eUJBQ2pCO3FCQUNKO29CQUNELFFBQVEsSUFBSSxJQUFJLENBQUM7aUJBQ3BCO3FCQUFNLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtvQkFDekIsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEIsSUFBSSxHQUFHLEVBQUU7d0JBQ0wsT0FBTyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDbEIsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7eUJBQ2pCO3FCQUNKO29CQUNELFFBQVEsSUFBSSxJQUFJLENBQUM7aUJBQ3BCO3FCQUFNO29CQUNILEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQ1Y7Z0JBQ0QsUUFBUSxJQUFJLEVBQUUsQ0FBQztnQkFDZixXQUFXLEdBQUcsSUFBSSxDQUFDO2FBQ3RCO1NBQ0o7S0FDSjtJQUNELE9BQU8sUUFBUSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLEdBQUc7SUFDckQsT0FBTztJQUNQLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQixJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDWixHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ1osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sRUFBRTtZQUNyQixRQUFRLElBQUksNkNBQTZDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNoRjtRQUNELElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNaLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFO2dCQUM1QixRQUFRLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztnQkFDbkYsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFDVCxTQUFTO2FBQ1o7aUJBQU07Z0JBQ0gsUUFBUSxJQUFJLGtEQUFrRCxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQ3JGLElBQUksR0FBRyxDQUFDLENBQUM7YUFDWjtTQUNKO1FBQ0QsSUFBSSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUU7WUFDNUIsSUFBSSxHQUFHLENBQUMsQ0FBQztTQUNaO2FBQU07WUFDSCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksUUFBUSxLQUFLLE9BQU8sRUFBRTtnQkFDbEMsUUFBUSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2FBQzFDO2lCQUFNLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxRQUFRLEtBQUssUUFBUSxFQUFFO2dCQUMxQyxRQUFRLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7YUFDMUM7aUJBQU07Z0JBQ0gsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEIsSUFBSSxHQUFHLEVBQUU7b0JBQ0wsT0FBTyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTt3QkFDbEIsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7cUJBQ2pCO2lCQUNKO2dCQUNELFFBQVEsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQzthQUMvQjtTQUNKO0tBQ0o7SUFDRCxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELElBQUksV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVHOzs7O0dBSUc7QUFDSSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7SUFDN0IsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztJQUNyQixLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1FBQ3JCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDUCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDL0IsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO1lBQy9CLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsVUFBVSxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN4QztLQUNKO0lBQ0QsT0FBTyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pELENBQUMsQ0FBQztBQVpXLFFBQUEsTUFBTSxVQVlqQjtBQUVGOzs7OztHQUtHO0FBQ0ksTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFXLEVBQVUsRUFBRTtJQUM5QyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDakIsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUFFO1lBQ3ZDLE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7S0FDTjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBUFcsUUFBQSxVQUFVLGNBT3JCO0FBRUYsSUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLEVBQUUsR0FBRztJQUN2QixDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNqQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO1FBQ25CLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0tBQ2Y7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUMsQ0FBQztBQUVGLFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDVixPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsQ0FBQztBQUVELFNBQVMsR0FBRyxDQUFDLENBQUM7SUFDVixPQUFPLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0ksTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRTtJQUNsQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzVCLElBQUksQ0FBQyxDQUFDO0lBRU4sT0FBTyxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDeEIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0tBQ2hDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUM7QUFYVyxRQUFBLFdBQVcsZUFXdEI7QUFFRjs7Ozs7OztHQU9HO0FBQ0ksTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQ3hDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLENBQUM7SUFFTixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixPQUFPLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4QixDQUFDLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2Y7SUFDRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0FBWFcsUUFBQSxpQkFBaUIscUJBVzVCO0FBRUY7Ozs7R0FJRztBQUNJLE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUU7SUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM1QixJQUFJLENBQUMsQ0FBQztJQUNOLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLE9BQU8sQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3hCLENBQUMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDZjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBVlcsUUFBQSxjQUFjLGtCQVV6QjtBQUVGOzs7OztHQUtHO0FBQ0ksTUFBTSxpQkFBaUIsR0FBRyxDQUFDLFlBQVksRUFBRSxFQUFFO0lBQzlDLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDN0YsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEMsSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDM0I7SUFDRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDO0FBUlcsUUFBQSxpQkFBaUIscUJBUTVCO0FBRUY7Ozs7O0dBS0c7QUFDSSxNQUFNLG1CQUFtQixHQUFHLENBQUMsWUFBWSxFQUFFLEVBQUU7SUFDaEQsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUM3RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN4QyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUMvQztJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3RCLENBQUMsQ0FBQztBQU5XLFFBQUEsbUJBQW1CLHVCQU05QjtBQUVGOzs7OztHQUtHO0FBQ0ksTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQzFDLElBQUksTUFBTSxHQUFHLElBQUEsMkJBQW1CLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDekMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNoRDtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQVBXLFFBQUEsbUJBQW1CLHVCQU85QjtBQUVGOzs7O0dBSUc7QUFDSSxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFO0lBQ25DLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDNUIsSUFBSSxDQUFDLENBQUM7SUFFTixPQUFPLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4QixDQUFDLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7S0FDaEM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQztBQVhXLFFBQUEsWUFBWSxnQkFXdkI7QUFFRjs7OztHQUlHO0FBQ0ksTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtJQUMxQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDekIsSUFBSSxDQUFDLENBQUM7SUFFTixPQUFPLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4QixDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ1o7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQTtBQVpZLFFBQUEsV0FBVyxlQVl2QjtBQUVEOzs7O0dBSUc7QUFDSSxNQUFNLFNBQVMsR0FBRyxVQUFVLE1BQU07SUFDckMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNwQyxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDckQsSUFBSSxZQUFZLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLFlBQVksR0FBRyxDQUFDLENBQUM7S0FDcEI7SUFDRCxJQUFJLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDbkIsT0FBTyxHQUFHLENBQUMsTUFBTSxHQUFHLFlBQVksRUFBRTtRQUM5QixHQUFHLElBQUksR0FBRyxDQUFDO0tBQ2Q7SUFFRCxHQUFHLEdBQUcsWUFBWSxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFFaEMsSUFBSSxDQUFDLENBQUM7SUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNyQixHQUFHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDM0I7SUFFRCxHQUFHLElBQUksYUFBYSxDQUFDO0lBQ3JCLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTtRQUNmLEdBQUcsSUFBSSxJQUFJLENBQUM7S0FDZjtJQUVELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLElBQUksU0FBUyxDQUFDO0lBQ2QsSUFBSSxVQUFVLENBQUM7SUFDZixJQUFJLENBQUMsQ0FBQztJQUVOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZCLEdBQUcsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsR0FBRyxhQUFhLENBQUM7UUFDNUQsU0FBUyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN2QyxVQUFVLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztRQUU1QixJQUFJLENBQUMsQ0FBQztRQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVCLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxDQUFDLEVBQUUsQ0FBQztTQUNQO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0IsR0FBRyxJQUFJLEtBQUssQ0FBQztTQUNoQjtRQUVELENBQUMsSUFBSSxTQUFTLENBQUM7UUFDZixHQUFHLElBQUksS0FBSyxDQUFDO1FBRWIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNkLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNyRSxDQUFDLEVBQUUsQ0FBQztTQUNQO1FBQ0QsR0FBRyxJQUFJLElBQUksQ0FBQztLQUNmO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDZixDQUFDLENBQUM7QUF2RFcsUUFBQSxTQUFTLGFBdURwQjtBQUVGOzs7OztHQUtHO0FBQ0ksTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7SUFDckMsSUFBSSxHQUFHLENBQUM7SUFDUixJQUFJLENBQUMsQ0FBQztJQUNOLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDN0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsRTtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUMsQ0FBQztBQVRXLFFBQUEsU0FBUyxhQVNwQiJ9