import React, { useState, useRef, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for pdf.js utilizing local dependency path or CDN
// We use the modern ESM worker approach suggested by react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export interface PdfLightboxProps {
    isOpen: boolean;
    url: string;
    onClose: () => void;
    fileName?: string;
    inline?: boolean;
}

const PdfLightbox: React.FC<PdfLightboxProps> = ({
    isOpen,
    url,
    onClose,
    fileName,
    inline = false
}) => {
    const [numPages, setNumPages] = useState<number>();
    const [scale, setScale] = useState<number>(1.0);
    const [containerWidth, setContainerWidth] = useState<number>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Keep some padding for the scrollbar and spacing
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    if (!isOpen) return null;

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    const content = (
        <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%', background: 'var(--background)',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)', background: 'var(--muted)', zIndex: 10
            }}>
                <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName || 'Document'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.7 }}>
                        <span>{numPages ? `${numPages} page${numPages !== 1 ? 's' : ''}` : '-'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, fontSize: 12 }}>
                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>-</button>
                        <span style={{ minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>+</button>
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                style={{
                    flex: 1, overflow: 'auto', background: 'var(--muted)',
                    display: 'flex', justifyContent: 'center', padding: '20px 0'
                }}>
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                            <Loader2 size={16} className="animate-spin" /> Loading PDF...
                        </div>
                    }
                    error={
                        <div style={{ color: '#ef4444', padding: 20 }}>Failed to load PDF.</div>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        {numPages && Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                scale={scale}
                                width={containerWidth}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="shadow-lg mb-4"
                            />
                        ))}
                    </div>
                </Document>
            </div>
        </div>
    );

    if (inline) return content;

    return null; // Fullscreen overlay not implemented for this context yet, can be wrapped with portal if needed
};

export default PdfLightbox;
