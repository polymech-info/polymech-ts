"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utf8 = exports.hex = exports.base64 = exports.ascii = exports.replace = exports.replaceAll = exports.multipleReplace = exports.findOcurrences = exports.escapeRegExp = exports.createUUID = exports.escapeXml = exports.escapeRegExpEx = exports.getJson = exports.capitalize = exports.LOW_SURROGATE_MAX = exports.LOW_SURROGATE_MIN = exports.HIGH_SURROGATE_MAX = exports.HIGH_SURROGATE_MIN = exports.disableFlag = exports.hasFlagHex = exports.hasFlag = exports.DefaultDelimiter = void 0;
const primitives_1 = require("@plastichub/core/primitives");
const escapeRegExpPattern = /[[\]{}()|\/\\^$.*+?]/g;
const escapeXmlPattern = /[&<]/g;
const escapeXmlForPattern = /[&<>'"]/g;
const escapeXmlMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
};
exports.DefaultDelimiter = {
    begin: '{',
    end: '}'
};
const hasFlag = (field, enumValue) => {
    //noinspection JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage
    // tslint:disable-next-line:no-bitwise
    return ((1 << enumValue) & field) ? true : false;
};
exports.hasFlag = hasFlag;
const hasFlagHex = (field, enumValue) => {
    //noinspection JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage
    // tslint:disable-next-line:no-bitwise
    return enumValue & field ? true : false;
};
exports.hasFlagHex = hasFlagHex;
const disableFlag = (enumValue, field) => {
    enumValue &= ~(1 << field);
    return enumValue;
};
exports.disableFlag = disableFlag;
/**
 * The minimum location of high surrogates
 */
exports.HIGH_SURROGATE_MIN = 0xD800;
/**
 * The maximum location of high surrogates
 */
exports.HIGH_SURROGATE_MAX = 0xDBFF;
/**
 * The minimum location of low surrogates
 */
exports.LOW_SURROGATE_MIN = 0xDC00;
/**
 * The maximum location of low surrogates
 */
exports.LOW_SURROGATE_MAX = 0xDFFF;
const BASE64_KEYSTR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const capitalize = (word) => {
    return word.substring(0, 1).toUpperCase() + word.substring(1);
};
exports.capitalize = capitalize;
const getJson = (inData, validOnly, ommit) => {
    try {
        return (0, primitives_1.isString)(inData) ? JSON.parse(inData) : validOnly === true ? null : inData;
    }
    catch (e) {
        ommit !== false && console.error('error parsing json data ' + inData + ' error = ' + e);
    }
    return null;
};
exports.getJson = getJson;
/**
 * Escapes a string so that it can safely be passed to the RegExp constructor.
 * @param text The string to be escaped
 * @return The escaped string
 */
function escapeRegExpEx(text) {
    return !text ? text : text.replace(escapeRegExpPattern, '\\$&');
}
exports.escapeRegExpEx = escapeRegExpEx;
/**
 * Sanitizes a string to protect against tag injection.
 * @param xml The string to be escaped
 * @param forAttribute Whether to also escape ', ", and > in addition to < and &
 * @return The escaped string
 */
function escapeXml(xml, forAttribute = true) {
    if (!xml) {
        return xml;
    }
    const pattern = forAttribute ? escapeXmlForPattern : escapeXmlPattern;
    return xml.replace(pattern, function (character) {
        return escapeXmlMap[character];
    });
}
exports.escapeXml = escapeXml;
function createUUID() {
    const S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
}
exports.createUUID = createUUID;
function escapeRegExp(str) {
    const special = ['[', ']', '(', ')', '{', '}', '*', '+', '.', '|', '||'];
    for (let n = 0; n < special.length; n++) {
        str = str.replace(special[n], '\\' + special[n]);
    }
    return str;
}
exports.escapeRegExp = escapeRegExp;
;
function findOcurrences(expression, delimiters) {
    // tslint:disable-next-line:no-object-literal-type-assertion
    const d = {
        begin: escapeRegExp(delimiters.begin),
        end: escapeRegExp(delimiters.end)
    };
    return expression.match(new RegExp(d.begin + '([^' + d.end + ']*)' + d.end, 'g'));
}
exports.findOcurrences = findOcurrences;
;
function multipleReplace(str, hash) {
    // to array
    const a = [];
    // tslint:disable-next-line:forin
    for (let key in hash) {
        a[a.length] = key;
    }
    return str.replace(new RegExp(a.join('\\b|\\b'), 'g'), function (m) {
        return hash[m] || hash['\\' + m];
    });
}
exports.multipleReplace = multipleReplace;
;
function replaceAll(find, replace, str) {
    return str ? str.split(find).join(replace) : '';
}
exports.replaceAll = replaceAll;
;
function replace(str, needle, what, delimiters) {
    if (!str) {
        return '';
    }
    if (what && (0, primitives_1.isObject)(what) || (0, primitives_1.isArray)(what)) {
        what = what;
        if (!delimiters) {
            // fast case
            return multipleReplace(str, what);
        }
        const occurrence = findOcurrences(str, delimiters);
        if (!occurrence) {
            return str;
        }
        else {
            for (let i = 0, j = occurrence.length; i < j; i++) {
                const el = occurrence[i];
                // strip off delimiters
                let _variableName = replaceAll(delimiters.begin, '', el);
                _variableName = replaceAll(delimiters.end, '', _variableName);
                str = replaceAll(el, (what[_variableName]), str);
            }
        }
        return str;
    }
    // fast case
    return replaceAll(needle, what, str);
}
exports.replace = replace;
;
function decodeUtf8EncodedCodePoint(codePoint, validationRange = [0, Infinity], checkSurrogate) {
    if (codePoint < validationRange[0] || codePoint > validationRange[1]) {
        throw Error('Invalid continuation byte');
    }
    if (checkSurrogate && codePoint >= exports.HIGH_SURROGATE_MIN && codePoint <= exports.LOW_SURROGATE_MAX) {
        throw Error('Surrogate is not a scalar value');
    }
    let encoded = '';
    if (codePoint > 0xFFFF) {
        codePoint -= 0x010000;
        encoded += String.fromCharCode(codePoint >>> 0x10 & 0x03FF | exports.HIGH_SURROGATE_MIN);
        codePoint = exports.LOW_SURROGATE_MIN | codePoint & 0x03FF;
    }
    encoded += String.fromCharCode(codePoint);
    return encoded;
}
function validateUtf8EncodedCodePoint(codePoint) {
    if ((codePoint & 0xC0) !== 0x80) {
        throw Error('Invalid continuation byte');
    }
}
/**
 * Provides facilities for encoding a string into an ASCII-encoded byte buffer and
 * decoding an ASCII-encoded byte buffer into a string.
 */
exports.ascii = {
    /**
     * Encodes a string into an ASCII-encoded byte buffer.
     *
     * @param data The text string to encode
     */
    encode(data) {
        if (data == null) {
            return [];
        }
        const buffer = [];
        for (let i = 0, length = data.length; i < length; i++) {
            buffer[i] = data.charCodeAt(i);
        }
        return buffer;
    },
    /**
     * Decodes an ASCII-encoded byte buffer into a string.
     *
     * @param data The byte buffer to decode
     */
    decode(data) {
        if (data == null) {
            return '';
        }
        let decoded = '';
        for (let i = 0, length = data.length; i < length; i++) {
            decoded += String.fromCharCode(data[i]);
        }
        return decoded;
    }
};
/**
 * Provides facilities for encoding a string into a Base64-encoded byte buffer and
 * decoding a Base64-encoded byte buffer into a string.
 */
exports.base64 = {
    /**
     * Encodes a Base64-encoded string into a Base64 byte buffer.
     *
     * @param data The Base64-encoded string to encode
     */
    encode(data) {
        if (data == null) {
            return [];
        }
        const buffer = [];
        let i = 0;
        let length = data.length;
        while (data[--length] === '=') { }
        while (i < length) {
            let encoded = BASE64_KEYSTR.indexOf(data[i++]) << 18;
            if (i <= length) {
                encoded |= BASE64_KEYSTR.indexOf(data[i++]) << 12;
            }
            if (i <= length) {
                encoded |= BASE64_KEYSTR.indexOf(data[i++]) << 6;
            }
            if (i <= length) {
                encoded |= BASE64_KEYSTR.indexOf(data[i++]);
            }
            buffer.push((encoded >>> 16) & 0xff);
            buffer.push((encoded >>> 8) & 0xff);
            buffer.push(encoded & 0xff);
        }
        while (buffer[buffer.length - 1] === 0) {
            buffer.pop();
        }
        return buffer;
    },
    /**
     * Decodes a Base64-encoded byte buffer into a Base64-encoded string.
     *
     * @param data The byte buffer to decode
     */
    decode(data) {
        if (data == null) {
            return '';
        }
        let decoded = '';
        let i = 0;
        for (let length = data.length - (data.length % 3); i < length;) {
            let encoded = data[i++] << 16 | data[i++] << 8 | data[i++];
            decoded += BASE64_KEYSTR.charAt((encoded >>> 18) & 0x3F);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 12) & 0x3F);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 6) & 0x3F);
            decoded += BASE64_KEYSTR.charAt(encoded & 0x3F);
        }
        if (data.length % 3 === 1) {
            let encoded = data[i++] << 16;
            decoded += BASE64_KEYSTR.charAt((encoded >>> 18) & 0x3f);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 12) & 0x3f);
            decoded += '==';
        }
        else if (data.length % 3 === 2) {
            let encoded = data[i++] << 16 | data[i++] << 8;
            decoded += BASE64_KEYSTR.charAt((encoded >>> 18) & 0x3f);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 12) & 0x3f);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 6) & 0x3f);
            decoded += '=';
        }
        return decoded;
    }
};
/**
 * Provides facilities for encoding a string into a hex-encoded byte buffer and
 * decoding a hex-encoded byte buffer into a string.
 */
exports.hex = {
    /**
     * Encodes a string into a hex-encoded byte buffer.
     *
     * @param data The hex-encoded string to encode
     */
    encode(data) {
        if (data == null) {
            return [];
        }
        const buffer = [];
        for (let i = 0, length = data.length; i < length; i += 2) {
            let encodedChar = parseInt(data.substr(i, 2), 16);
            buffer.push(encodedChar);
        }
        return buffer;
    },
    /**
     * Decodes a hex-encoded byte buffer into a hex-encoded string.
     *
     * @param data The byte buffer to decode
     */
    decode(data) {
        if (data == null) {
            return '';
        }
        let decoded = '';
        for (let i = 0, length = data.length; i < length; i++) {
            decoded += data[i].toString(16).toUpperCase();
        }
        return decoded;
    }
};
/**
 * Provides facilities for encoding a string into a UTF-8-encoded byte buffer and
 * decoding a UTF-8-encoded byte buffer into a string.
 * Inspired by the work of: https://github.com/mathiasbynens/utf8.js
 */
exports.utf8 = {
    /**
     * Encodes a string into a UTF-8-encoded byte buffer.
     *
     * @param data The text string to encode
     */
    encode(data) {
        if (data == null) {
            return [];
        }
        const buffer = [];
        for (let i = 0, length = data.length; i < length; i++) {
            let encodedChar = data.charCodeAt(i);
            /**
             * Surrogates
             * http://en.wikipedia.org/wiki/Universal_Character_Set_characters
             */
            if (encodedChar >= exports.HIGH_SURROGATE_MIN && encodedChar <= exports.HIGH_SURROGATE_MAX) {
                let lowSurrogate = data.charCodeAt(i + 1);
                if (lowSurrogate >= exports.LOW_SURROGATE_MIN && lowSurrogate <= exports.LOW_SURROGATE_MAX) {
                    encodedChar = 0x010000 + (encodedChar - exports.HIGH_SURROGATE_MIN) * 0x0400 + (lowSurrogate - exports.LOW_SURROGATE_MIN);
                    i++;
                }
            }
            if (encodedChar < 0x80) {
                buffer.push(encodedChar);
            }
            else {
                if (encodedChar < 0x800) {
                    buffer.push(((encodedChar >> 0x06) & 0x1F) | 0xC0);
                }
                else if (encodedChar < 0x010000) {
                    if (encodedChar >= exports.HIGH_SURROGATE_MIN && encodedChar <= exports.LOW_SURROGATE_MAX) {
                        throw Error('Surrogate is not a scalar value');
                    }
                    buffer.push(((encodedChar >> 0x0C) & 0x0F) | 0xE0);
                    buffer.push(((encodedChar >> 0x06) & 0x3F) | 0x80);
                }
                else if (encodedChar < 0x200000) {
                    buffer.push(((encodedChar >> 0x12) & 0x07) | 0xF0);
                    buffer.push(((encodedChar >> 0x0C) & 0x3F) | 0x80);
                    buffer.push(((encodedChar >> 0x06) & 0x3F) | 0x80);
                }
                buffer.push((encodedChar & 0x3F) | 0x80);
            }
        }
        return buffer;
    },
    /**
     * Decodes a UTF-8-encoded byte buffer into a string.
     *
     * @param data The byte buffer to decode
     */
    decode(data) {
        if (data == null) {
            return '';
        }
        let decoded = '';
        for (let i = 0, length = data.length; i < length; i++) {
            let byte1 = data[i] & 0xFF;
            if ((byte1 & 0x80) === 0) {
                decoded += decodeUtf8EncodedCodePoint(byte1);
            }
            else if ((byte1 & 0xE0) === 0xC0) {
                let byte2 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte2);
                byte2 = byte2 & 0x3F;
                let encodedByte = ((byte1 & 0x1F) << 0x06) | byte2;
                decoded += decodeUtf8EncodedCodePoint(encodedByte, [0x80, Infinity]);
            }
            else if ((byte1 & 0xF0) === 0xE0) {
                let byte2 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte2);
                byte2 = byte2 & 0x3F;
                let byte3 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte3);
                byte3 = byte3 & 0x3F;
                let encodedByte = ((byte1 & 0x1F) << 0x0C) | (byte2 << 0x06) | byte3;
                decoded += decodeUtf8EncodedCodePoint(encodedByte, [0x0800, Infinity], true);
            }
            else if ((byte1 & 0xF8) === 0xF0) {
                let byte2 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte2);
                byte2 = byte2 & 0x3F;
                let byte3 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte3);
                byte3 = byte3 & 0x3F;
                let byte4 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte4);
                byte4 = byte4 & 0x3F;
                let encodedByte = ((byte1 & 0x1F) << 0x0C) | (byte2 << 0x0C) | (byte3 << 0x06) | byte4;
                decoded += decodeUtf8EncodedCodePoint(encodedByte, [0x010000, 0x10FFFF]);
            }
            else {
                validateUtf8EncodedCodePoint(byte1);
            }
        }
        return decoded;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RyaW5nVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL1N0cmluZ1V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDREQUF5RTtBQUV6RSxNQUFNLG1CQUFtQixHQUFHLHVCQUF1QixDQUFDO0FBQ3BELE1BQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDO0FBQ2pDLE1BQU0sbUJBQW1CLEdBQUcsVUFBVSxDQUFDO0FBQ3ZDLE1BQU0sWUFBWSxHQUFpQjtJQUMvQixHQUFHLEVBQUUsT0FBTztJQUNaLEdBQUcsRUFBRSxNQUFNO0lBQ1gsR0FBRyxFQUFFLE1BQU07SUFDWCxHQUFHLEVBQUUsUUFBUTtJQUNiLElBQUksRUFBRSxPQUFPO0NBQ2hCLENBQUM7QUFDVyxRQUFBLGdCQUFnQixHQUFHO0lBQzVCLEtBQUssRUFBRSxHQUFHO0lBRVYsR0FBRyxFQUFFLEdBQUc7Q0FDWCxDQUFDO0FBQ0ssTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7SUFDeEMsc01BQXNNO0lBQ3RNLHNDQUFzQztJQUN0QyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3JELENBQUMsQ0FBQztBQUpXLFFBQUEsT0FBTyxXQUlsQjtBQUNLLE1BQU0sVUFBVSxHQUFHLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFO0lBQzNDLHNNQUFzTTtJQUN0TSxzQ0FBc0M7SUFDdEMsT0FBTyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUM1QyxDQUFDLENBQUM7QUFKVyxRQUFBLFVBQVUsY0FJckI7QUFDSyxNQUFNLFdBQVcsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTtJQUM1QyxTQUFTLElB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