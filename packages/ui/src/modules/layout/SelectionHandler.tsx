import React, { useEffect } from 'react';

interface SelectionHandlerProps {
    onMoveSelection: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onClearSelection: () => void;
    enabled?: boolean;
}

export const SelectionHandler: React.FC<SelectionHandlerProps> = ({
    onMoveSelection,
    onClearSelection,
    enabled = true
}) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in a form field
            const active = document.activeElement;
            if (active && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.tagName === 'SELECT' ||
                (active as HTMLElement).isContentEditable
            )) {
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    onMoveSelection('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    onMoveSelection('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    onMoveSelection('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    onMoveSelection('right');
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClearSelection();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onMoveSelection, onClearSelection, enabled]);

    return null; // Headless component
};
