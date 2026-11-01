import React, { lazy, Suspense } from 'react';
import type { INode } from '@/modules/storage/types';
import { getExt, isTextViewable, getMimeCategory } from '@/modules/storage/helpers';
import ImageLightbox from '@/components/ImageLightbox';
import LightboxIframe from '@/modules/storage/views/LightboxIframe';
import LightboxText from '@/modules/storage/views/LightboxText';
import { Loader2 } from 'lucide-react';
import { T } from '@/i18n';

const PdfLightbox = lazy(() => import('@/modules/storage/views/PdfLightbox'));
const SpreadsheetLightbox = lazy(() => import('@/modules/storage/views/SpreadsheetLightbox'));
const ThreeDViewer = lazy(() => import('@/modules/storage/views/ThreeDViewer'));

export interface SharedViewerProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    inline?: boolean;
    fileName?: string;
    selected: INode;
    onLinkClick?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function renderFileViewer(props: SharedViewerProps) {
    const { selected, url, fileName, inline, isOpen, onClose, onLinkClick } = props;
    const cat = getMimeCategory(selected);

    // Mime categorization isn't strong enough on its own, so we augment with extension
    const ext = getExt(selected.name);

    if ((cat === 'image' || cat === 'video' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm', 'ogg', 'mov'].includes(ext)) && ext !== 'dxf' && ext !== 'svg') {
        return (
            <ImageLightbox
                inline={inline}
                isOpen={isOpen}
                onClose={onClose}
                imageUrl={url}
                imageTitle={fileName}
                showPrompt={false}
                showPublish={false}
            />
        );
    }

    if (ext === 'html' || ext === 'htm') {
        return (
            <LightboxIframe
                inline={inline}
                isOpen={isOpen}
                onClose={onClose}
                url={url}
                fileName={fileName}
            />
        );
    }

    if (ext === 'pdf') {
        return (
            <Suspense fallback={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.6 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: 14 }}><T>Loading PDF viewer...</T></span>
                </div>
            }>
                <PdfLightbox
                    inline={inline}
                    isOpen={isOpen}
                    onClose={onClose}
                    url={url}
                    fileName={fileName}
                />
            </Suspense>
        );
    }

    if (['csv', 'xls', 'xlsx'].includes(ext)) {
        return (
            <Suspense fallback={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.6 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: 14 }}><T>Loading Spreadsheet viewer...</T></span>
                </div>
            }>
                <SpreadsheetLightbox
                    inline={inline}
                    isOpen={isOpen}
                    onClose={onClose}
                    url={url}
                    fileName={fileName}
                />
            </Suspense>
        );
    }

    if (['stl', 'obj', 'step', 'stp', 'dxf'].includes(ext)) {
        const maxSize = ext === 'stl' ? 8 * 1024 * 1024 : 3 * 1024 * 1024;
        if (typeof selected.size === 'number' && selected.size > maxSize) {
            return (
                <div className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground opacity-70">
                    <span className="mb-2"><T>File too large to preview in 3D</T></span>
                    <span className="text-xs">({(selected.size / (1024 * 1024)).toFixed(2)} MB / Max {(maxSize / (1024 * 1024)).toFixed(0)}.00 MB)</span>
                </div>
            );
        }

        return (
            <Suspense fallback={
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, opacity: 0.6 }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span style={{ fontSize: 14 }}><T>Loading 3D Engine...</T></span>
                </div>
            }>
                <ThreeDViewer
                    inline={inline}
                    isOpen={isOpen}
                    onClose={onClose}
                    url={url}
                    fileName={fileName}
                />
            </Suspense>
        );
    }

    if (isTextViewable(selected)) {
        return (
            <LightboxText
                inline={inline}
                isOpen={isOpen}
                onClose={onClose}
                url={url}
                fileName={fileName}
                onLinkClick={onLinkClick}
            />
        );
    }

    // Binary file or unsupported file limit reached
    if (typeof selected.size === 'number' && selected.size > 2 * 1024 * 1024) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground opacity-70">
                <span className="mb-2"><T>File too large to preview</T></span>
                <span className="text-xs">({(selected.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
        );
    }

    return <div className="p-6 flex items-center justify-center h-full text-muted-foreground opacity-70"><T>Unsupported file format</T></div>;
}
