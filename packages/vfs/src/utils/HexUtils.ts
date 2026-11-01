const utils: any = {}, types: any = {}, json: any = {};
import * as _ from 'lodash';
"use strict";
/**
 * Converts a single hex number to a character. note that no checking is performed to ensure that this is just a hex
 * number, eg. no spaces etc.
 * @param hex {string} the hex codepoint to be converted.
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function hex2char(hex) {
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
}

/**
 * Converts a single string representing a decimal number to a character. Note that no checking is performed to
 * ensure that this is just a hex number, eg. no spaces etc.
 * @param n {string} dec: string, the dec codepoint to be converted
 * @returns {string}
 */
function dec2char(n) {
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
}

function dec2hex(textString) {
	return (textString + 0).toString(16).toUpperCase();
}

let hexequiv = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

function dec2hex2(textString) {
	return hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
}

function dec2hex4(textString) {
	return hexequiv[(textString >> 12) & 0xF] + hexequiv[(textString >> 8) & 0xF]
		+ hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
}

/**
 *
 * @param textString {string}
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertChar2CP(textString) {
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
}

/**
 * Converts a string containing &#x...; escapes to a string of characters.
 * @param str {string}
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function removeWhitespacesFromHexSequence(str) {
	// convert up to 6 digit escapes to characters
	str = str.replace(/0x([A-Fa-f0-9]{1,4})(\s)?/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	return str;
}

utils.dec2hex4 = dec2hex4;
utils.dec2hex = dec2hex;
utils.dec2char = dec2char;
utils.dec2hex2 = dec2hex2;
// ========================== Converting to characters ==============================================
/**
 * Converts all escapes in the text str to characters, and can interpret numbers as escapes too.
 * @param str {string} the text to be converted.
 * @param numbers {string} enum [none, hex, dec, utf8, utf16], what to treat numbers as.
 * @returns {string|*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertAllEscapes(str, numbers) {
	let sle = false;
	str = convertUnicode2Char(str);
	str = removeWhitespacesFromHexSequence(str);

	str = convertZeroX2Char(str);
	str = convertHexNCR2Char(str);
	str = convertDecNCR2Char(str);
	if (sle) {
		str = convertjEsc2Char(str, true);
	}
	else {
		str = convertjEsc2Char(str, false);
		str = convertCSS2Char(str, false);
	}
	str = convertpEnc2Char(str);
	str = convertEntities2Char(str);
	str = convertNumbers2Char(str, numbers);

	return str;
}
/**
 * Converts a string containing U+... escapes to a string of characters.
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertUnicode2Char(str) {
	// first convert the 6 digit escapes to characters
	str = str.replace(/[Uu]\+10([A-Fa-f0-9]{4})/g,
		function (matchstr, parens) {
			return hex2char('10' + parens);
		}
	);
	// next convert up to 5 digit escapes to characters
	str = str.replace(/[Uu]\+([A-Fa-f0-9]{1,5})/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	return str;
}

/**
 * Converts a string containing &#x...; escapes to a string of characters
 * @param str
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertHexNCR2Char(str) {
	// convert up to 6 digit escapes to characters
	str = str.replace(/&#x([A-Fa-f0-9]{1,6});/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	return str;
}

/**
 * Converts a string containing &#...; escapes to a string of characters
 * @param str
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertDecNCR2Char(str) {

	// convert up to 6 digit escapes to characters
	str = str.replace(/&#([0-9]{1,7});/g,
		function (matchstr, parens) {
			return dec2char(parens);
		}
	);
	return str;
}

/**
 * Converts a string containing 0x... escapes to a string of characters, up to 6 digit escapes to characters.
 * @param str
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertZeroX2Char(str) {
	//
	str = str.replace(/0x([A-Fa-f0-9]{1,6})/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	return str;
}

/**
 * Converts a string containing CSS escapes to a string of characters, up to 6 digit escapes to characters & throw
 * away any following whitespace.
 * @param str {string} str: string, the input
 * @param convertbackslash {boolean} true if you want \x etc to become x or \a to be treated as 0xA
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertCSS2Char(str, convertbackslash) {
	if (convertbackslash) {
		str = str.replace(/\\([A-Fa-f0-9]{1,6})(\s)?/g,
			function (matchstr, parens) {
				return hex2char(parens);
			}
		);
		str = str.replace(/\\/g, '');
	}
	else {
		str = str.replace(/\\([A-Fa-f0-9]{2,6})(\s)?/g,
			function (matchstr, parens) {
				return hex2char(parens);
			}
		);
	}
	return str;
}

/**
 * Converts a string containing JavaScript or Java escapes to a string of characters
 * @param str {string} str: string, the input
 * @param shortEscapes {boolean} if true the function will convert \b etc to characters
 * @returns {*}
 * @memberOf module:xide/utils/StringUtils
 */
function convertjEsc2Char(str, shortEscapes) {
	// convert ES6 escapes to characters
	str = str.replace(/\\u\{([A-Fa-f0-9]{1,})\}/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	// convert \U and 6 digit escapes to characters
	str = str.replace(/\\U([A-Fa-f0-9]{8})/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
	// convert \u and 6 digit escapes to characters
	str = str.replace(/\\u([A-Fa-f0-9]{4})/g,
		function (matchstr, parens) {
			return hex2char(parens);
		}
	);
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
}

/**
 * Converts a string containing precent encoded escapes to a string of characters
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertpEnc2Char(str) {
	// find runs of hex numbers separated by % and send them for conversion
	str = str.replace(/((%[A-Fa-f0-9]{2})+)/g,
		function (matchstr, parens) {
			// return convertpEsc2Char(parens.replace(/%/g,' '));
			return convertpEsc2Char(parens);
		}
	);
	return str;
}

/**
 * converts a string containing HTML/XML character entities to a string of characters
 * @param str {string} the input
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
function convertEntities2Char(str) {
	let entities = {};
	str = str.replace(/&([A-Za-z0-9]+);/g,
		function (matchstr, parens) {
			if (parens in entities) {
				return entities[parens];
			}
			else {
				return matchstr;
			}
		}
	);
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
		str = str.replace(/(\b[A-Fa-f0-9]{2,6}\b)/g,
			function (matchstr, parens) {
				return hex2char(parens);
			}
		);
	}
	else if (type === 'dec') {
		str = str.replace(/(\b[0-9]+\b)/g,
			function (matchstr, parens) {
				return dec2char(parens);
			}
		);
	}
	else if (type === 'utf8') {
		str = str.replace(/(( [A-Fa-f0-9]{2})+)/g,
			function (matchstr, parens) {
				return convertUTF82Char(parens);
			}
		);
	}
	else if (type === 'utf16') {
		str = str.replace(/(( [A-Fa-f0-9]{1,6})+)/g,
			function (matchstr, parens) {
				return convertUTF162Char(parens);
			}
		);
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
	let outputString = "";
	let counter = 0;
	let n = 0;

	// remove leading and trailing spaces
	str = str.replace(/^\s+/, '');
	str = str.replace(/\s+$/, '');
	if (str.length === 0) {
		return "";
	}
	str = str.replace(/\s+/g, ' ');

	let listArray = str.split(' ');
	for (let i = 0; i < listArray.length; i++) {
		let b = parseInt(listArray[i], 16);  // alert('b:'+dec2hex(b));
		switch (counter) {
			case 0:
				if (0 <= b && b <= 0x7F) {  // 0xxxxxxx
					outputString += dec2char(b);
				}
				else if (0xC0 <= b && b <= 0xDF) {  // 110xxxxx
					counter = 1;
					n = b & 0x1F;
				}
				else if (0xE0 <= b && b <= 0xEF) {  // 1110xxxx
					counter = 2;
					n = b & 0xF;
				}
				else if (0xF0 <= b && b <= 0xF7) {  // 11110xxx
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
	let outputString = "";
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
				else if (0xC0 <= b && b <= 0xDF) {  // 110xxxxx
					counter = 1;
					n = b & 0x1F;
				}
				else if (0xE0 <= b && b <= 0xEF) {  // 1110xxxx
					counter = 2;
					n = b & 0xF;
				}
				else if (0xF0 <= b && b <= 0xF7) {  // 11110xxx
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

utils.convertUTF82Char = convertUTF82Char;
utils.convertUTF162Char = convertUTF162Char;
utils.convertUnicode2Char = convertUnicode2Char;

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
		str = str.replace(/\u2066/g, '&#x2066;');  // lri
		str = str.replace(/\u2067/g, '&#x2067;');  // rli
		str = str.replace(/\u2068/g, '&#x2068;');  // fsi
		str = str.replace(/\u2069/g, '&#x2069;');  // pdi

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
	let outputString = "";
	textString = textString.replace(/^\s+/, '');
	if (textString.length === 0) {
		return "";
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
	let outputString = "";
	let CPstring = convertChar2CP(str);
	if (str.length === 0) {
		return "";
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
		} // alpha
		else if (n >= 0x61 && n <= 0x7A) {
			outputString += String.fromCharCode(n);
		} // alpha
		else if (n >= 0x30 && n <= 0x39) {
			outputString += String.fromCharCode(n);
		} // digits
		else if (n === 0x2D || n === 0x2E || n === 0x5F || n === 0x7E) {
			outputString += String.fromCharCode(n);
		} // - . _ ~
		else if (n <= 0x7F) {
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
	let result = "";
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
					} else {
						outputString += '\t';
					}
					break;
				case 10:
					if (parameters.match(/noCR/)) {
						outputString += '\\n';
					} else {
						outputString += '\n';
					}
					break;
				case 13:
					if (parameters.match(/noCR/)) {
						outputString += '\\r';
					} else {
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
					} else {
						outputString += '"';
					}
					break;
				case 39:
					if (parameters.match(/noCR/)) {
						outputString += "\\\'";
					} else {
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
	let cp = "";
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
	let cp = "";
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


utils.convertCharStr2pEsc = convertCharStr2pEsc;

utils.convertAllEscapes = convertAllEscapes;

let digit_array = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');
/**
 *
 * @param n
 * @returns {string}
 */
utils.to_hex = function (n) {
	let hex_result = '';
	let the_start = true;
	for (let i = 32; i > 0; ) {
		i -= 4;
		let one_digit = (n >> i) & 0xf;
		if (!the_start || one_digit !== 0) {
			the_start = false;
			hex_result += digit_array[one_digit];
		}
	}
	return '0x' + (hex_result === '' ? '0' : hex_result);
};


/**
 * Unescape hex sequences like 'x0d' to chars
 * @param str {string}
 * @returns {string}
 * @memberOf module:xide/utils/StringUtils
 */
utils.replaceHex = function (str) {
	if (_.isString(str)) {
		return str.replace(/x([0-9A-Fa-f]{2})/gmi, function () {
			return String.fromCharCode(parseInt(arguments[1], 16));
		});
	}
	return str;
};

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
utils.stringToHex = function (string) {
	let str = '',
		i = 0,
		tmp_len = string.length,
		c;

	for (; i < tmp_len; i += 1) {
		c = string.charCodeAt(i);
		str += zero(d2h(c), 2) + ' ';
	}
	return str;
};

/**
 * Returns buffer compatible string
 * @param string
 * @example

 utils.stringToHex("a b") returns "61 20 62"

 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
utils.stringToBufferStr = function (string) {
	let i = 0,
		tmp_len = string.length,
		c;

	let arr = [];
	for (; i < tmp_len; i += 1) {
		c = string.charCodeAt(i);
		arr.push(c);
	}
	return arr.join(',');
};

/**
 * Return an integer array (as Buffer) for a string
 * @param string
 * @returns {Array}
 */
utils.stringToBuffer = function (string) {
	let i = 0,
		tmp_len = string.length,
		c;
	let arr = [];
	for (; i < tmp_len; i += 1) {
		c = string.charCodeAt(i);
		arr.push(c);
	}
	return arr;
};

/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {String} The hex version of the buffer string
 */
utils.bufferToHexString = function (bufferString) {
	let bytesArray = bufferString.indexOf(',') !== -1 ? bufferString.split(',') : [bufferString];
	let tmp = [];
	for (let i = 0; i < bytesArray.length; i++) {
		let dec = bytesArray[i];
		tmp.push(utils.dec2hex2(dec));
	}
	return tmp.join(" ");
};

/**
 *
 * @param bufferString {String} The serialized buffer formatted as 00,02 (decimal values)
 * @memberOf module:xide/utils/StringUtils
 * @returns {integer} The integer array
 */
utils.bufferFromDecString = function (bufferString) {
	let bytesArray = bufferString.indexOf(',') !== -1 ? bufferString.split(',') : [bufferString];
	for (let i = 0; i < bytesArray.length; i++) {
		bytesArray[i] = parseInt(bytesArray[i], 10);
	}
	return bytesArray;
};


/**
 * Return a buffer like formatted string "0a 12"
 * @param string
 * @memberOf module:xide/utils/StringUtils
 * @returns {string}
 */
utils.stringFromDecString = function (string) {
	let buffer = utils.bufferFromDecString(string);
	let result = "";
	for (let i = 0; i < buffer.length; i++) {
		result += String.fromCharCode(buffer[i], 16);
	}
	return result;
};

/**
 *
 * @param string
 * @returns {string}
 */
utils.stringToHex2 = function (string) {
	let str = '',
		i = 0,
		tmp_len = string.length,
		c;

	for (; i < tmp_len; i += 1) {
		c = string.charCodeAt(i);
		str += zero(d2h(c), 2) + ' ';
	}
	return str;
};

/**
 *
 * @param string {string}
 * @returns {string}
 */
function hexToString(string) {
	let arr = string.split(' '),
		str = '',
		i = 0,
		arr_len = arr.length,
		c;

	for (; i < arr_len; i += 1) {
		c = String.fromCharCode(h2d(arr[i]));
		str += c;
	}
	return str;
}

utils.hexToString = hexToString;

/**
 *
 * @param buffer
 * @returns {string}
 */
utils.prettyHex = function (buffer) {
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

/**
 *
 * @param str
 * @param prefix
 * @returns {string}
 */
utils.hexEncode = function (str, prefix) {
	let hex, i;
	let result = "";
	for (i = 0; i < str.length; i++) {
		hex = str.charCodeAt(i).toString(16);
		result += ((prefix !== null ? prefix : "000") + hex).slice(-4);
	}
	return result;
};

/**
 *
 * @param str
 * @param prefix
 * @param suffix
 * @param sign
 * @returns {string}
 */
utils.markHex = function (str, prefix, suffix, sign) {
	/*
	prefix = prefix || "";
	suffix = suffix || "";
	let myString = "" + str;
	let pattern = /[^\x20-\x7E]/gim;
	let match = pattern.exec(myString);
	let matches = myString.match(pattern);
	let newString = "" + myString;
	myString.replace(pattern, function (a, b) {
		let _raw = utils.hexEncode(a, '$');
		if (_raw.length === 2) {
			_raw = _raw.replace("$", "$0");
		}
		_raw = _raw.toUpperCase();
		myString = myString.replace(a, prefix + _raw + suffix);
	});
	return myString;*/
};
