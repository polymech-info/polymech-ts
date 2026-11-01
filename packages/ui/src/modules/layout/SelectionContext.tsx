import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { WidgetInstance, LayoutContainer } from '@/modules/layout/LayoutManager';

export interface ClipboardData {
    widgets: WidgetInstance[];
    containers: LayoutContainer[];
}

interface SelectionContextType {
    selectedWidgetIds: Set<string>;
    selectedContainerId: string | null;
    selectWidget: (id: string, multi?: boolean) => void;
    selectContainer: (id: string | null) => void;
    clearSelection: () => void;
    toggleWidgetSelection: (id: string) => void;
    clipboard: ClipboardData | null;
    hasClipboard: boolean;
    copyToClipboard: (data: ClipboardData) => void;
    clearClipboard: () => void;
}

const LOCAL_STORAGE_CLIPBOARD_KEY = 'polymech-editor-clipboard';

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedWidgetIds, setSelectedWidgetIds] = useState<Set<string>>(new Set());
    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<ClipboardData | null>(() => {
        try {
            const item = localStorage.getItem(LOCAL_STORAGE_CLIPBOARD_KEY);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn("Failed to parse clipboard from localStorage", e);
            return null;
        }
    });

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === LOCAL_STORAGE_CLIPBOARD_KEY) {
                try {
                    setClipboard(e.newValue ? JSON.parse(e.newValue) : null);
                } catch (err) {
                    console.warn("Failed to parse synced clipboard", err);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const selectWidget = useCallback((id: string, multi: boolean = false) => {
        setSelectedWidgetIds(prev => {
            if (multi) {
                const newSet = new Set(prev);
                newSet.add(id);
                return newSet;
            } else {
                return new Set([id]);
            }
        });
        // Selecting a widget usually implicitly interacts with container selection logic in specific ways vs just clearing it
        // For now, let's clear container selection when selecting a widget to avoid confusion, or keep it independent?
        // User didn't specify, but usually they are mutually exclusive in property panels.
        setSelectedContainerId(null);
    }, []);

    const toggleWidgetSelection = useCallback((id: string) => {
        setSelectedWidgetIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
        setSelectedContainerId(null);
    }, []);

    const selectContainer = useCallback((id: string | null) => {
        setSelectedContainerId(id);
        if (id) {
            setSelectedWidgetIds(new Set()); // Clear widget selection when selecting container
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedWidgetIds(new Set());
        setSelectedContainerId(null);
    }, []);

    const copyToClipboard = useCallback((data: ClipboardData) => {
        const clonedData = JSON.parse(JSON.stringify(data));
        setClipboard(clonedData);
        try {
            localStorage.setItem(LOCAL_STORAGE_CLIPBOARD_KEY, JSON.stringify(clonedData));
        } catch (e) {
            console.warn("Failed to save clipboard to localStorage", e);
        }
    }, []);

    const clearClipboard = useCallback(() => {
        setClipboard(null);
        try {
            localStorage.removeItem(LOCAL_STORAGE_CLIPBOARD_KEY);
        } catch (e) {
            console.warn("Failed to remove clipboard from localStorage", e);
        }
    }, []);

    const hasClipboard = clipboard !== null && (clipboard.widgets.length > 0 || clipboard.containers.length > 0);

    return (
        <SelectionContext.Provider value={{
            selectedWidgetIds,
            selectedContainerId,
            selectWidget,
            selectContainer,
            clearSelection,
            toggleWidgetSelection,
            clipboard,
            hasClipboard,
            copyToClipboard,
            clearClipboard
        }}>
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
};
