export declare const md2html: (content: any) => any;
/**
 * @typedef MarkdownTableOptions
 * @property {string|null|Array.<string|null|undefined>} [align]
 * @property {boolean} [padding=true]
 * @property {boolean} [delimiterStart=true]
 * @property {boolean} [delimiterStart=true]
 * @property {boolean} [delimiterEnd=true]
 * @property {boolean} [alignDelimiters=true]
 * @property {(value: string) => number} [stringLength]
 */
/**
 * Create a table from a matrix of strings.
 *
 * from : https://github.com/wooorm/markdown-table/blob/main/index.js
 *
 *
 *
 * @param {Array.<Array.<string|null|undefined>>} table
 * @param {MarkdownTableOptions} [options]
 * @returns {string}
 */
export declare const markdownTable: (table: any, options?: any) => string;
