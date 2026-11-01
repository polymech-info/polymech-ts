"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownTable = exports.md2html = void 0;
const showdown_1 = require("showdown");
const md2html = (content) => {
    let converter = new showdown_1.Converter({ tables: true });
    converter.setOption('literalMidWordUnderscores', 'true');
    return converter.makeHtml(content);
};
exports.md2html = md2html;
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
const markdownTable = (table, options = {}) => {
    const align = (options.align || []).concat();
    const stringLength = options.stringLength || defaultStringLength;
    /** @type {Array<number>} Character codes as symbols for alignment per column. */
    const alignments = [];
    /** @type {Array<Array<string>>} Cells per row. */
    const cellMatrix = [];
    /** @type {Array<Array<number>>} Sizes of each cell per row. */
    const sizeMatrix = [];
    /** @type {Array<number>} */
    const longestCellByColumn = [];
    let mostCellsPerRow = 0;
    let rowIndex = -1;
    // This is a superfluous loop if we don’t align delimiters, but otherwise we’d
    // do superfluous work when aligning, so optimize for aligning.
    while (++rowIndex < table.length) {
        /** @type {Array<string>} */
        const row = [];
        /** @type {Array<number>} */
        const sizes = [];
        let columnIndex = -1;
        if (table[rowIndex].length > mostCellsPerRow) {
            mostCellsPerRow = table[rowIndex].length;
        }
        while (++columnIndex < table[rowIndex].length) {
            const cell = serialize(table[rowIndex][columnIndex]);
            if (options.alignDelimiters !== false) {
                const size = stringLength(cell);
                sizes[columnIndex] = size;
                if (longestCellByColumn[columnIndex] === undefined ||
                    size > longestCellByColumn[columnIndex]) {
                    longestCellByColumn[columnIndex] = size;
                }
            }
            row.push(cell);
        }
        cellMatrix[rowIndex] = row;
        sizeMatrix[rowIndex] = sizes;
    }
    // Figure out which alignments to use.
    let columnIndex = -1;
    if (typeof align === 'object' && 'length' in align) {
        while (++columnIndex < mostCellsPerRow) {
            alignments[columnIndex] = toAlignment(align[columnIndex]);
        }
    }
    else {
        const code = toAlignment(align);
        while (++columnIndex < mostCellsPerRow) {
            alignments[columnIndex] = code;
        }
    }
    // Inject the alignment row.
    columnIndex = -1;
    /** @type {Array<string>} */
    const row = [];
    /** @type {Array<number>} */
    const sizes = [];
    while (++columnIndex < mostCellsPerRow) {
        const code = alignments[columnIndex];
        let before = '';
        let after = '';
        if (code === 99 /* `c` */) {
            before = ':';
            after = ':';
        }
        else if (code === 108 /* `l` */) {
            before = ':';
        }
        else if (code === 114 /* `r` */) {
            after = ':';
        }
        // There *must* be at least one hyphen-minus in each alignment cell.
        let size = options.alignDelimiters === false
            ? 1
            : Math.max(1, longestCellByColumn[columnIndex] - before.length - after.length);
        const cell = before + '-'.repeat(size) + after;
        if (options.alignDelimiters !== false) {
            size = before.length + size + after.length;
            if (size > longestCellByColumn[columnIndex]) {
                longestCellByColumn[columnIndex] = size;
            }
            sizes[columnIndex] = size;
        }
        row[columnIndex] = cell;
    }
    // Inject the alignment row.
    cellMatrix.splice(1, 0, row);
    sizeMatrix.splice(1, 0, sizes);
    rowIndex = -1;
    /** @type {Array<string>} */
    const lines = [];
    while (++rowIndex < cellMatrix.length) {
        const row = cellMatrix[rowIndex];
        const sizes = sizeMatrix[rowIndex];
        columnIndex = -1;
        /** @type {Array<string>} */
        const line = [];
        while (++columnIndex < mostCellsPerRow) {
            const cell = row[columnIndex] || '';
            let before = '';
            let after = '';
            if (options.alignDelimiters !== false) {
                const size = longestCellByColumn[columnIndex] - (sizes[columnIndex] || 0);
                const code = alignments[columnIndex];
                if (code === 114 /* `r` */) {
                    before = ' '.repeat(size);
                }
                else if (code === 99 /* `c` */) {
                    if (size % 2) {
                        before = ' '.repeat(size / 2 + 0.5);
                        after = ' '.repeat(size / 2 - 0.5);
                    }
                    else {
                        before = ' '.repeat(size / 2);
                        after = before;
                    }
                }
                else {
                    after = ' '.repeat(size);
                }
            }
            if (options.delimiterStart !== false && !columnIndex) {
                line.push('|');
            }
            if (options.padding !== false &&
                // Don’t add the opening space if we’re not aligning and the cell is
                // empty: there will be a closing space.
                !(options.alignDelimiters === false && cell === '') &&
                (options.delimiterStart !== false || columnIndex)) {
                line.push(' ');
            }
            if (options.alignDelimiters !== false) {
                line.push(before);
            }
            line.push(cell);
            if (options.alignDelimiters !== false) {
                line.push(after);
            }
            if (options.padding !== false) {
                line.push(' ');
            }
            if (options.delimiterEnd !== false ||
                columnIndex !== mostCellsPerRow - 1) {
                line.push('|');
            }
        }
        lines.push(options.delimiterEnd === false
            ? line.join('').replace(/ +$/, '')
            : line.join(''));
    }
    return lines.join('\n');
};
exports.markdownTable = markdownTable;
/**
 * @param {string|null|undefined} [value]
 * @returns {string}
 */
function serialize(value) {
    return value === null || value === undefined ? '' : String(value);
}
/**
 * @param {string} value
 * @returns {number}
 */
function defaultStringLength(value) {
    return value.length;
}
/**
 * @param {string|null|undefined} value
 * @returns {number}
 */
function toAlignment(value) {
    const code = typeof value === 'string' ? value.codePointAt(0) : 0;
    return code === 67 /* `C` */ || code === 99 /* `c` */
        ? 99 /* `c` */
        : code === 76 /* `L` */ || code === 108 /* `l` */
            ? 108 /* `l` */
            : code === 82 /* `R` */ || code === 114 /* `r` */
                ? 114 /* `r` */
                : 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Rvd24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL21hcmtkb3duLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHVDQUFvQztBQUU3QixNQUFNLE9BQU8sR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ2pDLElBQUksU0FBUyxHQUFHLElBQUksb0JBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELFNBQVMsQ0FBQyxTQUFTLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekQsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQTtBQUpZLFFBQUEsT0FBTyxXQUluQjtBQUVEOzs7Ozs7Ozs7R0FTRztBQUVIOzs7Ozs7Ozs7O0dBVUc7QUFDSSxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQUssRUFBRSxVQUFjLEVBQUUsRUFBRSxFQUFFO0lBRXZELE1BQU0sS0FBSyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUM1QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxJQUFJLG1CQUFtQixDQUFBO0lBQ2hFLGlGQUFpRjtJQUNqRixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUE7SUFDckIsa0RBQWtEO0lBQ2xELE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQTtJQUNyQiwrREFBK0Q7SUFDL0QsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFBO0lBQ3JCLDRCQUE0QjtJQUM1QixNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQTtJQUM5QixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUE7SUFDdkIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFFakIsOEVBQThFO0lBQzlFLCtEQUErRDtJQUMvRCxPQUFPLEVBQUUsUUFBUSxHQUFHLEtBQUssQ0FB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