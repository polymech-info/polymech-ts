import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileBrowserPanel } from '@/modules/storage/FileBrowserPanel';
import type { INode, FileBrowserWidgetExtendedProps } from './types';

const FileBrowserWidget: React.FC<FileBrowserWidgetExtendedProps> = (props) => {
    const { onSelect, onSelectNode, onSelectNodes, variables, searchQuery: initialSearch, path: initialPath, onPathChange: externalOnPathChange, minHeight: minHeightProp, ...panelProps } = props;

    const location = useLocation();
    const navigate = useNavigate();

    const { resolvedPath, extractedInitialFile } = React.useMemo(() => {
        let p = initialPath || '/';
        let f: string | undefined = undefined;

        // Backward compatibility for widgets saved with the old ?file= hack
        if (p.includes('?file=')) {
            const parts = p.split('?file=');
            p = parts[0] || '/';
            f = decodeURIComponent(parts[1]);
        }
        return { resolvedPath: p, extractedInitialFile: f };
    }, [initialPath]);

    const [currentPath, setCurrentPath] = useState(resolvedPath);
    const [searchQuery, setSearchQuery] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('search') || initialSearch || '';
    });

    useEffect(() => {
        setCurrentPath(resolvedPath);
    }, [resolvedPath]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search');
        if (urlSearch !== null) {
            setSearchQuery(urlSearch);
        } else {
            setSearchQuery(initialSearch || '');
        }
    }, [initialSearch, location.search]);

    const handlePathChange = useCallback((newPath: string) => {
        setCurrentPath(newPath);
        if (externalOnPathChange) {
            externalOnPathChange(newPath);
        }
    }, [externalOnPathChange]);

    const handleSearchQueryChange = useCallback((newQuery: string) => {
        setSearchQuery(newQuery);
        const params = new URLSearchParams(location.search);
        if (newQuery) {
            params.set('search', newQuery);
        } else {
            params.delete('search');
        }
        navigate(`${location.pathname}?${params.toString()}`, { replace: true, state: location.state });
    }, [location.pathname, location.search, location.state, navigate]);

    const lastSelectionRef = useRef<string>('');

    // Map internal selection to simple single-path selection for CMS compatibility
    const handleSelect = useCallback((selection: INode[] | INode | null) => {
        let firstNode: INode | null = null;
        let allNodes: INode[] = [];
        
        if (Array.isArray(selection)) {
            allNodes = selection;
            firstNode = selection.length > 0 ? selection[0] : null;
        } else if (selection) {
            allNodes = [selection];
            firstNode = selection;
        }

        const selectionKey = allNodes.map(n => n.path).join(',');
        if (selectionKey === lastSelectionRef.current) return;
        lastSelectionRef.current = selectionKey;

        if (onSelect) {
            onSelect(firstNode ? firstNode.path : null);
        }
        if (onSelectNode) {
            onSelectNode(firstNode);
        }
        if (props.onSelectNodes) {
            props.onSelectNodes(allNodes);
        }
    }, [onSelect, onSelectNode, props.onSelectNodes]);

    return (
        <div style={{ height: minHeightProp || '600px', width: '100%', minHeight: minHeightProp || '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <FileBrowserPanel
                {...panelProps}
                path={currentPath}
                initialFile={props.initialFile || extractedInitialFile}
                splitSizeHorizontal={props.splitSizeHorizontal}
                splitSizeVertical={props.splitSizeVertical}
                onLayoutChange={(sizes, direction) => {
                    // Update the widget config if we have access to a config setter
                    if (props.onSettingsChange) {
                        props.onSettingsChange({
                            [direction === 'horizontal' ? 'splitSizeHorizontal' : 'splitSizeVertical']: sizes
                        });
                    }
                }}
                onPathChange={handlePathChange}
                searchQuery={searchQuery}
                onSearchQueryChange={handleSearchQueryChange}
                onSelect={handleSelect}
            />
        </div>
    );
};

export { FileBrowserWidget };
export default FileBrowserWidget;
