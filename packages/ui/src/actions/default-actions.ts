import { Action } from './types';
import { Undo2, Redo2, MousePointer2, X } from 'lucide-react';

export const UNDO_ACTION_ID = 'Edit/Undo';
export const REDO_ACTION_ID = 'Edit/Redo';
export const FINISH_ACTION_ID = 'File/Finish';
export const CANCEL_ACTION_ID = 'File/Cancel';

export const createDefaultActions = (): Action[] => [
    {
        id: UNDO_ACTION_ID,
        label: 'Undo',
        icon: Undo2,
        group: 'History',
        shortcut: 'ctrl+z',
        visibilities: {
            Ribbon: true
        },
        handler: () => { console.warn('Undo action not implemented') }
    },
    {
        id: REDO_ACTION_ID,
        label: 'Redo',
        icon: Redo2,
        group: 'History',
        shortcut: 'ctrl+y',
        visibilities: {
            Ribbon: true
        },
        handler: () => { console.warn('Redo action not implemented') }
    },
    {
        id: FINISH_ACTION_ID,
        label: 'Finish',
        icon: MousePointer2,
        group: 'Exit',
        visibilities: {
            Ribbon: true
        },
        handler: () => { console.warn('Finish action not implemented') }
    },
    {
        id: CANCEL_ACTION_ID,
        label: 'Cancel',
        icon: X,
        group: 'Exit',
        visibilities: {
            Ribbon: true
        },
        handler: () => { console.warn('Cancel action not implemented') }
    }
];
