import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { INode, SortKey } from '@/modules/storage/types';
import { getMimeCategory, globToRegex, sortNodes, vfsUrl } from '@/modules/storage/helpers';
import { fetchVfsDirectory, fetchVfsSearch } from '@/modules/storage/client-vfs';

export interface UseVfsAdapterProps {
    mount: string;
    pathProp?: string;
    glob?: string;
    searchQuery?: string;
    showFolders?: boolean;
    accessToken?: string;
    index?: boolean;
    jail?: boolean;
    jailPath?: string;
    sortBy?: SortKey;
    sortAsc?: boolean;
    includeSize?: boolean;
    onPathChange?: (path: string) => void;
    onMountChange?: (mount: string) => void;
    onFetched?: (nodes: INode[], isSearchMode: boolean) => void;
}

export function useVfsAdapter({
    mount,
    pathProp,
    glob,
    searchQuery,
    showFolders = true,
    accessToken,
    index = true,
    jail = false,
    jailPath = '/',
    sortBy = 'name',
    sortAsc = true,
    includeSize = false,
    onPathChange,
    onMountChange,
    onFetched
}: UseVfsAdapterProps) {
    const currentGlob = glob || '*.*';
    const isControlled = pathProp !== undefined;
    const [internalPath, setInternalPath] = useState(pathProp || '/');
    const currentPath = isControlled ? pathProp : internalPath;

    const [nodes, setNodes] = useState<INode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSearchMode = !!searchQuery && searchQuery.trim().length >= 2;

    const tokenParam = accessToken ? `token=${encodeURIComponent(accessToken)}` : '';

    const onFetchedRef = useRef(onFetched);
    useEffect(() => {
        onFetchedRef.current = onFetched;
    }, [onFetched]);

    // Root-jail resolution wrapper
    const jailRoot = useMemo(() => {
        return (jailPath || '/').replace(/\/+$/, '') || '/';
    }, [jailPath]);

    const fetchDir = useCallback(async (dirPath: string) => {
        setLoading(true);
        setError(null);

        try {
            const clean = dirPath.replace(/^\/+/, '');
            if (isSearchMode) {
                const data = await fetchVfsSearch(mount, clean, searchQuery, { accessToken });
                const results = Array.isArray(data?.results) ? data.results : [];
                setNodes(results);
                if (onFetchedRef.current) onFetchedRef.current(results, true);
            } else {
                const data = await fetchVfsDirectory(mount, clean, { accessToken, includeSize });
                const results = Array.isArray(data) ? data : [];
                setNodes(results);
                if (onFetchedRef.current) onFetchedRef.current(results, false);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load directory');
            setNodes([]);
        } finally {
            setLoading(false);
        }
    }, [mount, accessToken, index, tokenParam, includeSize, isSearchMode, searchQuery]);

    const updatePath = useCallback((p: string) => {
        if (p === currentPath) {
            fetchDir(p);
            return;
        }
        if (!isControlled) setInternalPath(p);
        if (onPathChange) onPathChange(p);
        // Clear nodes immediately so UI doesn't render the new path with the old folder's contents
        // causing layout effects (like focus restoration) to fail against stale data.
        setNodes([]);
        setLoading(true);
    }, [isControlled, onPathChange, currentPath, fetchDir]);

    const updateMount = useCallback((m: string) => {
        if (onMountChange) onMountChange(m);
        // Only internal state changes if path not controlled:
        if (!isControlled) setInternalPath('/');
        if (onPathChange) onPathChange('/');
    }, [isControlled, onMountChange, onPathChange]);

    useEffect(() => { fetchDir(currentPath); }, [currentPath, fetchDir]);

    useEffect(() => {
        if (!isControlled && pathProp !== undefined) setInternalPath(pathProp);
    }, [pathProp, isControlled]);

    const canGoUp = useMemo(() => {
        if (currentPath === '/' || currentPath === '') return false;
        if (jail) {
            const normalized = currentPath.replace(/\/+$/, '') || '/';
            return normalized !== jailRoot && normalized !== jailRoot.replace(/\/+$/, '');
        }
        return true;
    }, [currentPath, jail, jailRoot]);

    const filteredNodes = useMemo(() => {
        if (!Array.isArray(nodes)) return [];
        const regex = globToRegex(currentGlob);
        return nodes.filter(n => {
            const isDir = n.type === 'dir' || n.mime === 'inode/directory';
            if (isDir) return showFolders;
            return regex.test(n.name);
        });
    }, [nodes, currentGlob, showFolders]);

    const sorted = useMemo(() => sortNodes(filteredNodes, sortBy, sortAsc), [filteredNodes, sortBy, sortAsc]);

    const goUp = useCallback(() => {
        if (!canGoUp) return;
        const parts = currentPath.replace(/^\/+/, '').split('/').filter(Boolean);
        parts.pop();
        updatePath(parts.length ? parts.join('/') : '/');
    }, [currentPath, canGoUp, updatePath]);

    const breadcrumbs = useMemo(() => {
        const parts = currentPath.replace(/^\/+/, '').split('/').filter(Boolean);
        const crumbs = [{ label: '/', path: '/' }];
        let acc = '';
        for (const p of parts) { acc += (acc ? '/' : '') + p; crumbs.push({ label: p, path: acc }); }
        if (jail) {
            const root = jailRoot === '/' ? '/' : jailRoot;
            const rootParts = root === '/' ? 0 : root.split('/').filter(Boolean).length;
            return crumbs.slice(rootParts);
        }
        return crumbs;
    }, [currentPath, mount, jail, jailRoot]);

    return {
        nodes,
        sorted,
        loading,
        error,
        currentPath,
        currentGlob,
        updatePath,
        updateMount,
        fetchDir,
        canGoUp,
        goUp,
        breadcrumbs,
        jailRoot,
        isSearchMode
    };
}
