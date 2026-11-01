/** Represents a single item in the shopping cart. */
export interface CartItem {
    /** Unique product identifier (e.g. Shopify product id). */
    id: string;
    /** Product display title. */
    title: string;
    /** Absolute URL to product thumbnail image. */
    image?: string;
    /** Unit price in the store's base currency. */
    price: number;
    /** Quantity in cart (≥ 1). */
    quantity: number;
    /** Optional variant label (e.g. "Red / XL"). */
    variant?: string;
    /** Vendor/seller username slug (for linking to vendor profile). */
    vendorSlug?: string;
    /** Page slug (for linking back to the product page). */
    pageSlug?: string;
}

/** Actions exposed by the cart store. */
export interface CartActions {
    /** Add an item or increment its quantity if already present. */
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    /** Remove an item entirely by id. */
    removeItem: (id: string) => void;
    /** Set exact quantity for an item. Removes if qty ≤ 0. */
    updateQuantity: (id: string, quantity: number) => void;
    /** Empty the cart. */
    clearCart: () => void;
}

/** Full cart state shape. */
export interface CartState extends CartActions {
    items: CartItem[];
    /** Derived: sum of price × quantity for every item. */
    subtotal: number;
    /** Derived: total number of units in cart. */
    itemCount: number;
}
