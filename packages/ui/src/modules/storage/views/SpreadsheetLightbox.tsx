import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export interface SpreadsheetLightboxProps {
    isOpen: boolean;
    url: string;
    onClose: () => void;
    fileName?: string;
    inline?: boolean;
}

const SpreadsheetLightbox: React.FC<SpreadsheetLightboxProps> = ({
    isOpen,
    url,
    onClose,
    fileName,
    inline = false
}) => {
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !url) return;

        let active = true;

        async function loadSheet() {
            setLoading(true);
            setError(null);

            try {
                // Dynamically import xlsx so it's not in the main bundle!
                const XLSX = await import('xlsx');

                // Fetch the array buffer
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();

                // Parse workbook
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                let isTruncated = false;
                let originalRows = 0;

                // Optimization: Enforce a hard limit on rows to prevent massive HTML tables from freezing the browser
                if (worksheet['!ref']) {
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    originalRows = range.e.r - range.s.r + 1;

                    const MAX_ROWS = 500;
                    if (originalRows > MAX_ROWS) {
                        isTruncated = true;
                        // Truncate the range representation
                        range.e.r = range.s.r + MAX_ROWS - 1;
                        worksheet['!ref'] = XLSX.utils.encode_range(range);
                    }
                }

                // Convert direct to HTML Table String
                const tableHtml = XLSX.utils.sheet_to_html(worksheet);

                if (active) {
                    setHtml(tableHtml);
                    setLoading(false);
                    // Optionally set state for truncated UI warnings here, but for this refactor we can just inject into html directly
                    if (isTruncated) {
                        setHtml(tableHtml + `<div class="p-4 text-center text-sm text-yellow-600 bg-yellow-500/10 border-t border-yellow-500/20">Preview truncated to the first 500 rows to ensure browser performance. <br />Download the file to see all ${originalRows.toLocaleString()} rows.</div>`);
                    }
                }
            } catch (err: any) {
                console.error("Sheet rendering error:", err);
                if (active) {
                    setError(err.message || 'Failed to parse spreadsheet');
                    setLoading(false);
                }
            }
        }

        loadSheet();

        return () => { active = false; };
    }, [url, isOpen]);

    if (!isOpen) return null;

    const content = (
        <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%', background: 'var(--background)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)', background: 'var(--muted)', zIndex: 10,
                flexShrink: 0
            }}>
                <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName || 'Spreadsheet'}
                </span>
            </div>

            <div style={{
                flex: 1, overflow: 'auto', background: 'var(--muted)',
                padding: '20px'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">Parsing spreadsheet...</span>
                    </div>
                ) : error ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                        {error}
                    </div>
                ) : (
                    <div
                        className="bg-background rounded shadow overflow-hidden border border-border"
                        style={{ display: 'inline-block', minWidth: '100%' }}
                    >
                        {/* We use an inner wrapper to target the generic 'table', 'tr', 'td' elements generated by sheet_to_html */}
                        <div
                            className="fb-sheetjs-wrapper"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    </div>
                )}
            </div>

            {/* We apply local styles for the SheetJS table output */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .fb-sheetjs-wrapper table {
                    border-collapse: collapse;
                    width: 100%;
                    font-size: 13px;
                }
                .fb-sheetjs-wrapper th, .fb-sheetjs-wrapper td {
                    border: 1px solid var(--border);
                    padding: 6px 12px;
                    white-space: nowrap;
                }
                .fb-sheetjs-wrapper tr:first-child {
                    background: var(--muted);
                    font-weight: bold;
                }
            `}} />
        </div>
    );

    if (inline) return content;

    return null;
};

export default SpreadsheetLightbox;
