import { useState, useCallback } from 'react';
import { INode } from '@/modules/storage/types';
import { getMimeCategory } from '@/modules/storage/helpers';

export interface UseFilePreviewProps {
    allowLightbox?: boolean;
    allowFileViewer?: boolean;
}

export function useFilePreview({ allowLightbox = true, allowFileViewer = true }: UseFilePreviewProps) {
    const [lightboxNode, setLightboxNode] = useState<INode | null>(null);
    const [textLightboxNode, setTextLightboxNode] = useState<INode | null>(null);
    const [iframeLightboxNode, setIframeLightboxNode] = useState<INode | null>(null);

    const openPreview = useCallback((node: INode) => {
        const cat = getMimeCategory(node);

        if ((cat === 'image' || cat === 'video' || node.name.toLowerCase().endsWith('.pdf') || node.name.toLowerCase().endsWith('.glb')) && allowLightbox) {
            setLightboxNode(node);
        } else if (allowFileViewer) {
            if (node.name.toLowerCase().endsWith('.html') || node.name.toLowerCase().endsWith('.htm')) {
                setIframeLightboxNode(node);
            } else {
                // assume text fallback
                setTextLightboxNode(node);
            }
        }
    }, [allowLightbox, allowFileViewer]);

    const closeAllPreviews = useCallback(() => {
        setLightboxNode(null);
        setTextLightboxNode(null);
        setIframeLightboxNode(null);
    }, []);

    return {
        lightboxNode,
        setLightboxNode,
        textLightboxNode,
        setTextLightboxNode,
        iframeLightboxNode,
        setIframeLightboxNode,
        openPreview,
        closeAllPreviews
    };
}
