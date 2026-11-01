import { useActionStore } from './store';
import { Action } from './types';
import { useCallback } from 'react';

/**
 * Hook to interact with the Action System
 */
export const useActions = () => {
    const registerAction = useActionStore(state => state.registerAction);
    const unregisterAction = useActionStore(state => state.unregisterAction);
    const updateAction = useActionStore(state => state.updateAction);
    const getAction = useActionStore(state => state.getAction);
    const actions = useActionStore(state => state.actions);

    const getActionsByGroup = useCallback((group: string) => {
        return Object.values(actions).filter(a => a.group === group);
    }, [actions]);

    const executeAction = useCallback(async (actionId: string, context?: any) => {
        const action = actions[actionId];
        if (action && !action.disabled && action.handler) {
            try {
                await action.handler(context);
            } catch (error) {
                console.error(`Error executing action ${actionId}:`, error);
            }
        } else {
            console.warn(`Action ${actionId} not found or disabled.`);
        }
    }, [actions]);

    return {
        actions,
        registerAction,
        unregisterAction,
        updateAction,
        getAction,
        getActionsByGroup,
        executeAction
    };
};
