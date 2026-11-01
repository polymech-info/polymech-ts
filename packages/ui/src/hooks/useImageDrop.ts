import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { translate } from '@/i18n';
import { useDragDrop } from '@/contexts/DragDropContext';

interface UseImageDropProps {
    onFilesDrop: (files: File[]) => void;
    isEditMode: boolean;
    enabled?: boolean;
}

export const useImageDrop = ({ onFilesDrop, isEditMode, enabled = true }: UseImageDropProps) => {
    const { setLocalZoneActive, resetDragState, isDragging: globalIsDragging } = useDragDrop();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        if (!isEditMode || !enabled) return;
        e.preventDefault();
        // e.stopPropagation(); // Allow bubbling to global context
        setLocalZoneActive(true);

        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    }, [isEditMode, enabled, setLocalZoneActive]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        if (!isEditMode || !enabled) return;
        e.preventDefault();
        // e.stopPropagation(); // Allow bubbling

        // Check if we're actually leaving the element
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsDragging(false);
        setLocalZoneActive(false);
    }, [isEditMode, enabled, setLocalZoneActive]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!isEditMode || !enabled) return;
        e.preventDefault();
        // e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, [isEditMode, enabled]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (!isEditMode || !enabled) return;
        e.preventDefault();
        e.stopPropagation(); // Keep stopPropagation for drop to prevent global handler
        setIsDragging(false);
        resetDragState();

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            if (files.length > 0) {
                toast.error(translate('Please drop an image file'));
            }
            return;
        }

        onFilesDrop(imageFiles);
    }, [isEditMode, enabled, onFilesDrop, resetDragState]);

    return {
        isDragging,
        handlers: {
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDrop
        }
    };
};
