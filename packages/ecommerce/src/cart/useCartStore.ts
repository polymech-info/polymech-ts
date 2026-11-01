import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState } from "./types";

/** Recompute derived totals from items array. */
function computeTotals(items: CartItem[]) {
    return {
        subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
}

/**
 * Global cart store — persisted to localStorage.
 *
 * Usage:
 * ```tsx
 * const { items, addItem, subtotal } = useCartStore();
 * ```
 */
export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            subtotal: 0,
            itemCount: 0,

            addItem: (incoming) =>
                set((state) => {
                    const existing = state.items.find((i) => i.id === incoming.id);
                    let items: CartItem[];
                    if (existing) {
                        items = state.items.map((i) =>
                            i.id === incoming.id
                                ? { ...i, quantity: i.quantity + (incoming.quantity ?? 1) }
                                : i,
                        );
                    } else {
                        items = [...state.items, { ...incoming, quantity: incoming.quantity ?? 1 }];
                    }
                    return { items, ...computeTotals(items) };
                }),

            removeItem: (id) =>
                set((state) => {
                    const items = state.items.filter((i) => i.id !== id);
                    return { items, ...computeTotals(items) };
                }),

            updateQuantity: (id, quantity) =>
                set((state) => {
                    if (quantity <= 0) {
                        const items = state.items.filter((i) => i.id !== id);
                        return { items, ...computeTotals(items) };
                    }
                    const items = state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i,
                    );
                    return { items, ...computeTotals(items) };
                }),

            clearCart: () => set({ items: [], subtotal: 0, itemCount: 0 }),
        }),
        {
            name: "pm-ecommerce-cart",
        },
    ),
);
