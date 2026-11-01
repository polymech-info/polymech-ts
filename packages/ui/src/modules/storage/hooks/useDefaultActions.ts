import React, { useMemo, useCallback } from 'react';
import type { INode } from '@/modules/storage/types';
import { getMimeCategory, vfsUrl } from '@/modules/storage/helpers';

export interface UseDefaultActionsProps {
    mount: string;
    mountProp: string;
    pathProp: string;
    accessToken?: string;

    // Selection
    selected: INode[];
    sorted: INode[];
    canGoUp: boolean;
    setFocusIdx: (idx: number) => void;
    setSelected: React.Dispatch<React.SetStateAction<INode[]>>;

    // Preview
    lightboxNode: INode | null;
    setLightboxNode: (n: INode | null) => void;
    textLightboxNode: INode | null;
    setTextLightboxNode: (n: INode | null) => void;
    iframeLightboxNode: INode | null;
    setIframeLightboxNode: (n: INode | null) => void;
    openPreview: (node: INode) => void;

    // Navigation
    updatePath: (path: string) => void;
    setPendingFileSelect: (v: string | null) => void;

    // Refs
    containerRef: React.RefObject<HTMLDivElement | null>;

    // Helpers from parent
    getNode: (idx: number) => INode | null;
    goUp: () => void;
}

/**
 * Resolve a relative link `href` against a `basePath` within the VFS.
 * Returns `{ dirPath, filename }` — `filename` is empty if the link points to a directory.
 */
export function resolveRelativeVfsLink(href: string, basePath: string): { dirPath: string; filename: string } | null {
    try {
        let bp = basePath;
        if (!bp.startsWith('/')) bp = '/' + bp;
        if (bp !== '/' && !bp.endsWith('/')) bp += '/';

        const resolved = new URL(href, `http://dummy.local${bp}`);
        let newPath = decodeURIComponent(resolved.pathname);

        const parts = newPath.split('/');
        const lastPart = parts[parts.length - 1];
        let filename = '';

        if (lastPart && lastPart.includes('.') && !newPath.endsWith('/')) {
            filename = lastPart;
            parts.pop();
            newPath = parts.join('/') || '/';
        }

        if (newPath !== '/' && newPath.endsWith('/')) {
            newPath = newPath.slice(0, -1);
        }

        return { dirPath: newPath, filename };
    } catch {
        return null;
    }
}

export function useDefaultActions({
    mount,
    mountProp,
    pathProp,
    accessToken,
    selected,
    sorted,
    canGoUp,
    setFocusIdx,
    setSelected,
    lightboxNode,
    setLightboxNode,
    textLightboxNode,
    setTextLightboxNode,
    iframeLightboxNode,
    setIframeLightboxNode,
    openPreview,
    updatePath,
    setPendingFileSelect,
    containerRef,
    getNode,
    goUp,
}: UseDefaultActionsProps) {

    const selectedFile = selected.length === 1 && getMimeCategory(selected[0]) !== 'dir' ? selected[0] : null;

    // ── File URL builder ─────────────────────────────────────────
    const getFileUrl = useCallback((node: INode) => {
        const tokenParam = accessToken ? `token=${encodeURIComponent(accessToken)}` : '';
        const base = vfsUrl('get', mountProp, node.path);
        let url = tokenParam ? `${base}?${tokenParam}` : base;
        if (node.mtime) {
            url += (url.includes('?') ? '&' : '?') + `t=${node.mtime}`;
        }
        return url;
    }, [accessToken, mountProp]);

    // ── View in new tab ──────────────────────────────────────────
    const handleView = useCallback(() => {
        if (selected.length === 1) window.open(getFileUrl(selected[0]), '_blank');
    }, [selected, getFileUrl]);

    // ── Download handler ─────────────────────────────────────────
    const handleDownload = useCallback(() => {
        if (selected.length === 0) return;
        if (selected.length === 1) {
            const first = selected[0];
            const cat = getMimeCategory(first);
            if (cat === 'dir') {
                const clean = first.path.replace(/^\/+/, '');
                let url = vfsUrl('compress', mount, clean);
                if (accessToken) url += `?token=${encodeURIComponent(accessToken)}`;
                window.location.href = url;
                return;
            }
            if (selectedFile) {
                const clean = selectedFile.path.replace(/^\/+/, '');
                let url = vfsUrl('get', mount, clean);
                if (accessToken) url += `?token=${encodeURIComponent(accessToken)}`;
                if (selectedFile.mtime) url += (url.includes('?') ? '&' : '?') + `t=${selectedFile.mtime}`;
                url += (url.includes('?') ? '&' : '?') + 'download=1';
                window.location.href = url;
            }
            return;
        }

        // Multiple selection: batch zip
        const cleanPath = pathProp.replace(/^\/+/, '');
        let url = vfsUrl('compress', mount, cleanPath);
        if (accessToken) {
            url += `?token=${encodeURIComponent(accessToken)}`;
        }
        url += '&files=' + encodeURIComponent(selected.map(n => n.name).join(','));
        window.location.href = url;
    }, [selected, selectedFile, mount, mountProp, pathProp, accessToken]);

    // ── Download directory as zip ────────────────────────────────
    const handleDownloadDir = useCallback(() => {
        const cleanPath = pathProp.replace(/^\/+/, '');
        let url = vfsUrl('compress', mount, cleanPath);
        if (accessToken) {
            url += `?token=${encodeURIComponent(accessToken)}`;
        }
        window.location.href = url;
    }, [mount, pathProp, accessToken]);

    // ── Lightbox navigation ──────────────────────────────────────
    const mediaNodes = useMemo(
        () => sorted.filter(n => { const c = getMimeCategory(n); return c === 'image' || c === 'video'; }),
        [sorted]
    );
    const lightboxIdx = lightboxNode ? mediaNodes.findIndex(n => n.path === lightboxNode.path) : -1;

    const lightboxPrev = useCallback(() => {
        if (lightboxIdx > 0) setLightboxNode(mediaNodes[lightboxIdx - 1]);
    }, [lightboxIdx, mediaNodes, setLightboxNode]);

    const lightboxNext = useCallback(() => {
        if (lightboxIdx < mediaNodes.length - 1) setLightboxNode(mediaNodes[lightboxIdx + 1]);
    }, [lightboxIdx, mediaNodes, setLightboxNode]);

    // ── Close lightboxes (restore focus + selection) ─────────────
    const restoreFocusAfterLightbox = useCallback((node: INode | null, closer: (n: null) => void) => {
        if (node) {
            const idx = sorted.indexOf(node);
            if (idx >= 0) {
                setFocusIdx(canGoUp ? idx + 1 : idx);
                setSelected([node]);
            }
        }
        closer(null);
        setTimeout(() => containerRef.current?.focus(), 0);
    }, [sorted, canGoUp, setFocusIdx, setSelected, containerRef]);

    const closeLightbox = useCallback(
        () => restoreFocusAfterLightbox(lightboxNode, setLightboxNode),
        [restoreFocusAfterLightbox, lightboxNode, setLightboxNode]
    );

    const closeTextLightbox = useCallback(
        () => restoreFocusAfterLightbox(textLightboxNode, setTextLightboxNode),
        [restoreFocusAfterLightbox, textLightboxNode, setTextLightboxNode]
    );

    const closeIframeLightbox = useCallback(
        () => restoreFocusAfterLightbox(iframeLightboxNode, setIframeLightboxNode),
        [restoreFocusAfterLightbox, iframeLightboxNode, setIframeLightboxNode]
    );

    // ── Double-click handler ─────────────────────────────────────
    const handleDoubleClick = useCallback((idx: number) => {
        const node = getNode(idx);
        if (!node) { goUp(); return; }
        if (getMimeCategory(node) === 'dir') {
            updatePath(node.path || node.name);
        } else {
            openPreview(node);
        }
    }, [getNode, goUp, updatePath, openPreview]);

    // ── Unified link-click handler (for readme/file-viewer panes) ─
    const handleLinkClick = useCallback((href: string, e: React.MouseEvent, basePath: string) => {
        const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('data:') || href.startsWith('#');
        if (isExternal) return;

        e.preventDefault();
        const result = resolveRelativeVfsLink(href, basePath);
        if (!result) {
            console.error("Failed to resolve relative link:", href);
            return;
        }

        if (result.filename) {
            setPendingFileSelect(result.filename);
        }
        updatePath(result.dirPath);
    }, [updatePath, setPendingFileSelect]);

    return {
        selectedFile,
        getFileUrl,
        handleView,
        handleDownload,
        handleDownloadDir,
        mediaNodes,
        lightboxIdx,
        lightboxPrev,
        lightboxNext,
        closeLightbox,
        closeTextLightbox,
        closeIframeLightbox,
        handleDoubleClick,
        handleLinkClick
    };
}
