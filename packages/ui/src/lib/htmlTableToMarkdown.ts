/**
 * Recursively extract markdown-like text from a DOM node.
 * Converts `<a>` → `[text](href)`, `<strong>/<b>` → `**text**`,
 * `<em>/<i>` → `*text*`, and everything else to plain text.
 */
function cellToMarkdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        // LibreOffice stores links as entity-encoded HTML text, e.g.
        // &lt;a href="..."&gt;text&lt;/a&gt;  →  decoded as literal <a> string
        return text.replace(
            /<a\s+href=["']([^"']+)["']\s*>(.*?)<\/a>/gi,
            (_m, href, label) => `[${label.trim()}](${href})`
        );
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    // Recurse into children first
    const inner = Array.from(el.childNodes).map(cellToMarkdown).join('');

    switch (tag) {
        case 'A': {
            const href = el.getAttribute('href');
            const text = inner.trim();
            return href ? `[${text}](${href})` : text;
        }
        case 'STRONG':
        case 'B':
            return `**${inner}**`;
        case 'EM':
        case 'I':
            return `*${inner}*`;
        case 'BR':
            return ' ';
        default:
            return inner;
    }
}

/**
 * Convert HTML containing `<table>` elements into a Markdown table string.
 *
 * Returns `null` when no `<table>` is found so the caller can fall through to
 * the default paste behaviour.
 *
 * Works entirely in the browser via DOMParser — no external dependencies.
 */
export function htmlTableToMarkdown(html: string): string | null {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tables = doc.querySelectorAll('table');
    if (tables.length === 0) return null;

    const parts: string[] = [];

    tables.forEach((table) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return;

        let matrix: string[][] = rows.map((row) =>
            Array.from(row.querySelectorAll('th, td')).map((cell) => {
                return cellToMarkdown(cell)
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/\|/g, '\\|');
            }),
        );

        // Drop leading all-empty rows (LibreOffice often has blank header rows)
        // Strip markdown bold/italic markers to catch cells like "** **"
        const isEmptyCell = (c: string) => c.replace(/\*+/g, '').trim() === '';
        while (matrix.length > 1 && matrix[0].every(isEmptyCell)) {
            matrix.shift();
        }

        // Normalise column count to the widest row
        const colCount = Math.max(...matrix.map((r) => r.length));
        for (const row of matrix) {
            while (row.length < colCount) row.push('');
        }

        const lines: string[] = [];

        // Header row
        const header = matrix[0];
        lines.push('| ' + header.join(' | ') + ' |');

        // Separator
        lines.push('| ' + header.map(() => '---').join(' | ') + ' |');

        // Body rows
        for (let i = 1; i < matrix.length; i++) {
            lines.push('| ' + matrix[i].join(' | ') + ' |');
        }

        parts.push(lines.join('\n'));
    });

    return parts.length > 0 ? parts.join('\n\n') : null;
}
