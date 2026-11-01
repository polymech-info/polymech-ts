import React from 'react';
import { Info } from 'lucide-react';
import ResponsiveImage from '@/components/ResponsiveImage';
import type { INode } from './types';
import { getMimeCategory, formatSize, formatDate } from './helpers';
import { T, translate } from '@/i18n';

// ── Props ────────────────────────────────────────────────────────

interface FileDetailPanelProps {
    file: INode | null;
    fileUrl: string;
}

// ── Component ────────────────────────────────────────────────────

const FileDetailPanel: React.FC<FileDetailPanelProps> = ({ file, fileUrl }) => {
    if (!file) {
        return (
            <div className="fb-detail-pane" style={{
                width: 200, borderLeft: '1px solid var(--border, #334155)',
                padding: 10, fontSize: 13, flexShrink: 0,
                background: 'var(--muted, #1e293b)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, opacity: 0.5 }}>
                    <Info size={14} />
                    <span style={{ fontWeight: 600 }}><T>Details</T></span>
                </div>
                <div style={{ color: 'var(--muted-foreground, #94a3b8)', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                    <T>No file selected</T>
                </div>
            </div>
        );
    }
    const cat = getMimeCategory(file);
    return (
        <div className="fb-detail-pane" style={{
            width: 200, borderLeft: '1px solid var(--border, #334155)',
            padding: 10, fontSize: 13, overflowY: 'auto', flexShrink: 0,
            background: 'var(--muted, #1e293b)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Info size={14} />
                <span style={{ fontWeight: 600 }}><T>Details</T></span>
            </div>

            {cat === 'image' && (
                <ResponsiveImage src={fileUrl} alt={file.name}
                    responsiveSizes={[200, 400]} imgClassName="" style={{ width: '100%', borderRadius: 4, marginBottom: 8, objectFit: 'contain' }} />
            )}
            {cat === 'video' && (
                <video key={file.path} src={fileUrl} controls muted preload="metadata"
                    style={{ width: '100%', borderRadius: 4, marginBottom: 8 }} />
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {([
                        [translate('Name'), file.name],
                        [translate('Path'), file.path],
                        [translate('Size'), formatSize(file.size)],
                        [translate('Modified'), formatDate(file.mtime)],
                        [translate('MIME'), file.mime || '—'],
                        [translate('Type'), getMimeCategory(file)],
                    ] as [string, string][]).map(([label, val]) => (
                        <tr key={label}>
                            <td style={{ padding: '3px 4px 3px 0', color: 'var(--muted-foreground, #94a3b8)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
                            <td style={{ padding: '3px 0', wordBreak: 'break-all' }}>{val}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileDetailPanel;
