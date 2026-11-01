import { CartState } from './types';
/**
 * Global cart store — persisted to localStorage.
 *
 * Usage:
 * ```tsx
 * const { items, addItem, subtotal } = useCartStore();
 * ```
 */
export declare const useCartStore: import('zustand').UseBoundStore<Omit<import('zustand').StoreApi<CartState>, "setState" | "persist"> & {
    setState(partial: CartState | Partial<CartState> | ((state: CartState) => CartState | Partial<CartState>), replace?: false): unknown;
    setState(state: CartState | ((state: CartState) => CartState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import('zustand/middleware').PersistOptions<CartState, CartState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: CartState) => void) => () => void;
        onFinishHydration: (fn: (state: CartState) => void) => () => void;
        getOptions: () => Partial<import('zustand/middleware').PersistOptions<CartState, CartState, unknown>>;
    };
}>;
