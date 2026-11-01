import { useEffect } from "react";

interface UseEditorKeyboardShortcutsParams {
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onCopy: () => void;
    onPaste: () => void;
    onTogglePreview: () => void;
    selectedWidgetIds: Set<string>;
    selectedContainerId: string | null;
    onCommandPicker?: () => void;
}

export function useEditorKeyboardShortcuts({
    onSave,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onCopy,
    onPaste,
    onTogglePreview,
    selectedWidgetIds,
    selectedContainerId,
    onCommandPicker,
}: UseEditorKeyboardShortcutsParams) {
    // Undo/Redo shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    if (canRedo) onRedo();
                } else {
                    if (canUndo) onUndo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                if (canRedo) onRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo, canUndo, canRedo]);

    // Save, Preview, Copy, Paste shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                onSave();
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
                if (!isInput) {
                    e.preventDefault();
                    onTogglePreview();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (!isInput) {
                    e.preventDefault();
                    onPaste();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (!isInput && (selectedWidgetIds.size > 0 || selectedContainerId)) {
                    e.preventDefault();
                    onCopy();
                }
            }

            // Ctrl+Space → Command Picker
            if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
                e.preventDefault();
                onCommandPicker?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave, onCopy, onPaste, onTogglePreview, selectedWidgetIds, selectedContainerId, onCommandPicker]);
}
