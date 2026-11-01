import { create } from 'zustand';
import { Action, ActionState } from './types';

interface ActionStore extends ActionState {
    // Internal state
}

export const useActionStore = create<ActionStore>((set, get) => ({
    actions: {},

    registerAction: (action: Action) => set((state) => {
        // Prevent duplicate registration if not needed, or overwrite
        // For now, we overwrite based on ID
        if (state.actions[action.id]) {
            // console.warn(`Action with id ${action.id} already exists. Overwriting.`);
        }
        return {
            actions: {
                ...state.actions,
                [action.id]: action
            }
        };
    }),

    unregisterAction: (actionId: string) => set((state) => {
        const newActions = { ...state.actions };
        delete newActions[actionId];
        return { actions: newActions };
    }),

    updateAction: (actionId: string, updates: Partial<Action>) => set((state) => {
        const action = state.actions[actionId];
        if (!action) {
            console.warn(`Action with id ${actionId} not found.`);
            return {};
        }
        return {
            actions: {
                ...state.actions,
                [actionId]: { ...action, ...updates }
            }
        };
    }),

    getAction: (actionId: string) => {
        return get().actions[actionId];
    },

    getActionsByGroup: (group: string) => {
        const actions = get().actions;
        return Object.values(actions).filter(a => a.group === group);
    },

    getActionsByPath: (path: string) => {
        const actions = get().actions;
        return Object.values(actions).filter(a => a.id.startsWith(path));
    }
}));
