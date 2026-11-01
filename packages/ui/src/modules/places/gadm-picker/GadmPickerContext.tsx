import React, { createContext, useContext, useState, useRef } from 'react';
import type { GadmNode, GadmTreePickerApi, ExpandState } from './GadmTreePicker';

export interface GadmPickerState {
    roots: GadmNode[];
    setRoots: React.Dispatch<React.SetStateAction<GadmNode[]>>;
    expandMap: Record<string, ExpandState>;
    setExpandMap: React.Dispatch<React.SetStateAction<Record<string, ExpandState>>>;
    regionQuery: string;
    setRegionQuery: React.Dispatch<React.SetStateAction<string>>;
    hasAutoLocated: boolean;
    setHasAutoLocated: React.Dispatch<React.SetStateAction<boolean>>;
    treeApiRef: React.MutableRefObject<GadmTreePickerApi | null>;
    selectedNodes: GadmNode[];
    setSelectedNodes: React.Dispatch<React.SetStateAction<GadmNode[]>>;
}

const GadmPickerContext = createContext<GadmPickerState | null>(null);

export function GadmPickerProvider({ children, initialSelectedNodes = [] }: { children: React.ReactNode, initialSelectedNodes?: GadmNode[] }) {
    const [roots, setRoots] = useState<GadmNode[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<GadmNode[]>(initialSelectedNodes);
    const [expandMap, setExpandMap] = useState<Record<string, ExpandState>>({});
    const [regionQuery, setRegionQuery] = useState('');
    const [hasAutoLocated, setHasAutoLocated] = useState(false);
    const treeApiRef = useRef<GadmTreePickerApi | null>(null);

    return (
        <GadmPickerContext.Provider value={{
            roots, setRoots,
            expandMap, setExpandMap,
            regionQuery, setRegionQuery,
            hasAutoLocated, setHasAutoLocated,
            treeApiRef,
            selectedNodes, setSelectedNodes
        }}>
            {children}
        </GadmPickerContext.Provider>
    );
}

export function useGadmPicker(): GadmPickerState {
    const ctx = useContext(GadmPickerContext);
    if (!ctx) throw new Error('useGadmPicker must be used within GadmPickerProvider');
    return ctx;
}
