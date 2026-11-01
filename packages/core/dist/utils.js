export function StingEnum(o) {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}
import { isString } from './primitives.js';
const escapeRegExpPattern = /[[\]{}()|/\\^$.*+?]/g;
const escapeXmlPattern = /[&<]/g;
const escapeXmlForPattern = /[&<>'"]/g;
const escapeXmlMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
};
export const DefaultDelimiter = {
    begin: '<%',
    end: '%>'
};
export const hasFlag = (field, enumValue) => {
    //noinspection JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage
    return ((1 << enumValue) & field) ? true : false;
};
export const hasFlagHex = (field, enumValue) => {
    //noinspection JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage,JSBitwiseOperatorUsage
    return enumValue & field ? true : false;
};
export const disableFlag = (enumValue, field) => {
    enumValue &= ~(1 << field);
    return enumValue;
};
/**
 * The minimum location of high surrogates
 */
export const HIGH_SURROGATE_MIN = 0xD800;
/**
 * The maximum location of high surrogates
 */
export const HIGH_SURROGATE_MAX = 0xDBFF;
/**
 * The minimum location of low surrogates
 */
export const LOW_SURROGATE_MIN = 0xDC00;
/**
 * The maximum location of low surrogates
 */
export const LOW_SURROGATE_MAX = 0xDFFF;
const BASE64_KEYSTR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
export const capitalize = (word) => {
    return word.substring(0, 1).toUpperCase() + word.substring(1);
};
export const getJson = (inData, validOnly, ommit) => {
    try {
        return isString(inData) ? JSON.parse(inData) : validOnly === true ? null : inData;
    }
    catch (e) {
        ommit !== false && console.error('error parsing json data ' + inData + ' error = ' + e);
    }
    return null;
};
/**
 * Escapes a string so that it can safely be passed to the RegExp constructor.
 * @param text The string to be escaped
 * @return The escaped string
 */
export function escapeRegExpEx(text) {
    return !text ? text : text.replace(escapeRegExpPattern, '\\$&');
}
/**
 * Sanitizes a string to protect against tag injection.
 * @param xml The string to be escaped
 * @param forAttribute Whether to also escape ', ", and > in addition to < and &
 * @return The escaped string
 */
export function escapeXml(xml, forAttribute = true) {
    if (!xml) {
        return xml;
    }
    const pattern = forAttribute ? escapeXmlForPattern : escapeXmlPattern;
    return xml.replace(pattern, function (character) {
        return escapeXmlMap[character];
    });
}
export function createUUID() {
    const S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
}
export function escapeRegExp(str) {
    const special = ['[', ']', '(', ')', '{', '}', '*', '+', '.', '|', '||'];
    for (let n = 0; n < special.length; n++) {
        str = str.replace(special[n], '\\' + special[n]);
    }
    return str;
}
;
export function replaceAll(find, replace, str) {
    return str ? str.split(find).join(replace) : '';
}
;
export const substitute = (template, map) => {
    const transform = (k) => k || '';
    return template.replace(/\$\{([^\s:}]+)(?::([^\s:}]+))?\}/g, (match, key, format) => transform(map[key]).toString());
};
function decodeUtf8EncodedCodePoint(codePoint, validationRange = [0, Infinity], checkSurrogate) {
    if (codePoint < validationRange[0] || codePoint > validationRange[1]) {
        throw Error('Invalid continuation byte');
    }
    if (checkSurrogate && codePoint >= HIGH_SURROGATE_MIN && codePoint <= LOW_SURROGATE_MAX) {
        throw Error('Surrogate is not a scalar value');
    }
    let encoded = '';
    if (codePoint > 0xFFFF) {
        codePoint -= 0x010000;
        encoded += String.fromCharCode(codePoint >>> 0x10 & 0x03FF | HIGH_SURROGATE_MIN);
        codePoint = LOW_SURROGATE_MIN | codePoint & 0x03FF;
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
export const ascii = {
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
export const base64 = {
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
            const encoded = data[i++] << 16 | data[i++] << 8 | data[i++];
            decoded += BASE64_KEYSTR.charAt((encoded >>> 18) & 0x3F);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 12) & 0x3F);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 6) & 0x3F);
            decoded += BASE64_KEYSTR.charAt(encoded & 0x3F);
        }
        if (data.length % 3 === 1) {
            const encoded = data[i++] << 16;
            decoded += BASE64_KEYSTR.charAt((encoded >>> 18) & 0x3f);
            decoded += BASE64_KEYSTR.charAt((encoded >>> 12) & 0x3f);
            decoded += '==';
        }
        else if (data.length % 3 === 2) {
            const encoded = data[i++] << 16 | data[i++] << 8;
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
export const hex = {
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
            const encodedChar = parseInt(data.substr(i, 2), 16);
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
export const utf8 = {
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
            if (encodedChar >= HIGH_SURROGATE_MIN && encodedChar <= HIGH_SURROGATE_MAX) {
                const lowSurrogate = data.charCodeAt(i + 1);
                if (lowSurrogate >= LOW_SURROGATE_MIN && lowSurrogate <= LOW_SURROGATE_MAX) {
                    encodedChar = 0x010000 + (encodedChar - HIGH_SURROGATE_MIN) * 0x0400 + (lowSurrogate - LOW_SURROGATE_MIN);
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
                    if (encodedChar >= HIGH_SURROGATE_MIN && encodedChar <= LOW_SURROGATE_MAX) {
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
            const byte1 = data[i] & 0xFF;
            if ((byte1 & 0x80) === 0) {
                decoded += decodeUtf8EncodedCodePoint(byte1);
            }
            else if ((byte1 & 0xE0) === 0xC0) {
                let byte2 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte2);
                byte2 = byte2 & 0x3F;
                const encodedByte = ((byte1 & 0x1F) << 0x06) | byte2;
                decoded += decodeUtf8EncodedCodePoint(encodedByte, [0x80, Infinity]);
            }
            else if ((byte1 & 0xF0) === 0xE0) {
                let byte2 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte2);
                byte2 = byte2 & 0x3F;
                let byte3 = data[++i] & 0xFF;
                validateUtf8EncodedCodePoint(byte3);
                byte3 = byte3 & 0x3F;
                const encodedByte = ((byte1 & 0x1F) << 0x0C) | (byte2 << 0x06) | byte3;
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
                const encodedByte = ((byte1 & 0x1F) << 0x0C) | (byte2 << 0x0C) | (byte3 << 0x06) | byte4;
                decoded += decodeUtf8EncodedCodePoint(encodedByte, [0x010000, 0x10FFFF]);
            }
            else {
                validateUtf8EncodedCodePoint(byte1);
            }
        }
        return decoded;
    }
};
//# sourceMappingURL=utils.js.map