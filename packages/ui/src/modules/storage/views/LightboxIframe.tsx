import React, { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface LightboxIframeProps {
    isOpen: boolean;
    onClose: () => void;
    /** URL to fetch text content from */
    url: string;
    /** File name for display */
    fileName: string;
    /** Render inline without modal overlay */
    inline?: boolean;
}

export default function LightboxIframe({ isOpen, onClose, url, fileName, inline = false }: LightboxIframeProps) {
    useEffect(() => {
        if (!isOpen || inline) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, inline, onClose]);

    if (!isOpen && !inline) return null;

    const innerContent = (
        <div
            className="bg-white dark:bg-slate-800/10 text-foreground"
            onClick={e => e.stopPropagation()}
            style={inline ? {
                display: 'flex', flexDirection: 'column',
                height: '100%', width: '100%',
                overflow: 'hidden'
            } : {
                borderRadius: 10,
                width: '90vw', maxWidth: 1200, height: '90vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid var(--border, #e2e8f0)',
                background: 'var(--muted, #f8fafc)', flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }} className="truncate">
                        {fileName}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--muted-foreground, #64748b)', background: 'var(--accent, #e1e7ef)', padding: '2px 6px', borderRadius: 4 }}>
                        HTML Iframe
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 6, background: 'var(--secondary, #f1f5f9)',
                            color: 'var(--foreground, #0f172a)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', border: '1px solid var(--border, #e2e8f0)',
                            textDecoration: 'none'
                        }}
                    >
                        <ExternalLink size={14} /> Open in Tab
                    </a>
                    <a
                        href={url}
                        download={fileName}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 6, background: 'var(--secondary, #f1f5f9)',
                            color: 'var(--foreground, #0f172a)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', border: '1px solid var(--border, #e2e8f0)',
                            textDecoration: 'none'
                        }}
                    >
                        <Download size={14} /> Download
                    </a>
                    {!inline && (
                        <button
                            onClick={onClose}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'var(--muted-foreground, #64748b)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#fff' }}>
                <iframe
                    src={url}
                    title={fileName}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                />
            </div>
        </div>
    );

    if (inline) {
        return innerContent;
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999, // Ensure it sits well above standard z-indexes
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20, background: 'rgba(0, 0, 0, 0.85)'
            }}
        >
            {innerContent}
        </div>
    );
}
