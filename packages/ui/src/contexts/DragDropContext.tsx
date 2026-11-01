import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface DragDropContextType {
    isDragging: boolean;
    isLocalZoneActive: boolean;
    setLocalZoneActive: (active: boolean) => void;
    resetDragState: () => void;
    dragFiles: File[] | null;
    dragType: string | null;
}

const DragDropContext = createContext<DragDropContextType>({
    isDragging: false,
    isLocalZoneActive: false,
    setLocalZoneActive: () => { },
    resetDragState: () => { },
    dragFiles: null,
    dragType: null,
});

export const useDragDrop = () => useContext(DragDropContext);

export const DragDropProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLocalZoneActive, setIsLocalZoneActive] = useState(false);
    const [dragFiles, setDragFiles] = useState<File[] | null>(null);
    const [dragType, setDragType] = useState<string | null>(null);

    const dragCounter = useRef(0);
    const dragBlocker = useRef(false);

    const isValidDrag = (e: DragEvent) => {
        const types = e.dataTransfer?.types || [];
        if (types.includes('polymech/internal')) return false;
        // Allow Files or Links (text/uri-list) or text/plain
        return types.includes('Files') || types.includes('text/uri-list') || types.includes('text/plain');
    };

    useEffect(() => {

        const handleDragEnter = (e: DragEvent) => {
            if (dragBlocker.current) return;
            if (!isValidDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            if (!isValidDrag(e)) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setIsDragging(false);
                setIsLocalZoneActive(false); // Reset this too just in case
            }
        };

        const handleDragOver = (e: DragEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: DragEvent) => {
            console.log('handleDrop')
            // We only reset if the event bubbles up to here (meaning not handled/stopped by widget)
            // But actually, we want to reset state regardless?
            // If widget handles it, it should call resetDragState() manually.
            // If it bubbles, we reset here.

            // If we prevent default here, does it interfere?
            e.preventDefault();
            // e.stopPropagation(); // Don't stop propagation at window level? 

            resetDragState();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDragging(false);
                setIsLocalZoneActive(false);
                dragCounter.current = 0;
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDragging]);

    const setLocalZoneActive = (active: boolean) => {
        setIsLocalZoneActive(active);
    };

    const resetDragState = () => {
        setIsDragging(false);
        setIsLocalZoneActive(false);
        console.log('resetDragState')
        dragCounter.current = 0;

        // Block new drag events for a short period to prevent flickering/re-triggering after drop
        dragBlocker.current = true;
        setTimeout(() => {
            dragBlocker.current = false;
        }, 100);
    };

    return (
        <DragDropContext.Provider value={{ isDragging, isLocalZoneActive, setLocalZoneActive, resetDragState, dragFiles, dragType }}>
            {children}
        </DragDropContext.Provider>
    );
};
