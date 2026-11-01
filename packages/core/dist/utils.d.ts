export declare function StingEnum<T extends string>(o: Array<T>): {
    [K in T]: K;
};
export declare const DefaultDelimiter: {
    begin: string;
    end: string;
};
export declare const hasFlag: (field: any, enumValue: any) => boolean;
export declare const hasFlagHex: (field: any, enumValue: any) => boolean;
export declare const disableFlag: (enumValue: any, field: any) => any;
/**
 * The minimum location of high surrogates
 */
export declare const HIGH_SURROGATE_MIN = 55296;
/**
 * The maximum location of high surrogates
 */
export declare const HIGH_SURROGATE_MAX = 56319;
/**
 * The minimum location of low surrogates
 */
export declare const LOW_SURROGATE_MIN = 56320;
/**
 * The maximum location of low surrogates
 */
export declare const LOW_SURROGATE_MAX = 57343;
export declare const capitalize: (word: any) => any;
export declare const getJson: (inData: any, validOnly: any, ommit: any) => any;
/**
 * Escapes a string so that it can safely be passed to the RegExp constructor.
 * @param text The string to be escaped
 * @return The escaped string
 */
export declare function escapeRegExpEx(text: string): string;
/**
 * Sanitizes a string to protect against tag injection.
 * @param xml The string to be escaped
 * @param forAttribute Whether to also escape ', ", and > in addition to < and &
 * @return The escaped string
 */
export declare function escapeXml(xml: string, forAttribute?: boolean): string;
export declare function createUUID(): string;
export declare function escapeRegExp(str: string): string;
export declare function replaceAll(find: string, replace: string, str: string): string;
export interface IDelimiter {
    begin: string;
    end: string;
}
export declare const substitute: (template: any, map: any) => any;
export type ByteBuffer = Uint16Array | Uint8Array | Buffer | number[];
export interface Codec {
    encode(data: string): number[];
    decode(data: ByteBuffer): string;
}
/**
 * Provides facilities for encoding a string into an ASCII-encoded byte buffer and
 * decoding an ASCII-encoded byte buffer into a string.
 */
export declare const ascii: Codec;
/**
 * Provides facilities for encoding a string into a Base64-encoded byte buffer and
 * decoding a Base64-encoded byte buffer into a string.
 */
export declare const base64: Codec;
/**
 * Provides facilities for encoding a string into a hex-encoded byte buffer and
 * decoding a hex-encoded byte buffer into a string.
 */
export declare const hex: Codec;
/**
 * Provides facilities for encoding a string into a UTF-8-encoded byte buffer and
 * decoding a UTF-8-encoded byte buffer into a string.
 * Inspired by the work of: https://github.com/mathiasbynens/utf8.js
 */
export declare const utf8: Codec;
