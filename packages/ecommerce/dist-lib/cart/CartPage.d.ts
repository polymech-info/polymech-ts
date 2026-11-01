export interface CartPageProps {
    /** Called when user clicks "Proceed to Checkout". */
    onCheckout?: () => void;
    /** Optional extra class names. */
    className?: string;
}
/**
 * Full cart page — shows items, subtotal, and a checkout CTA.
 * Renders an empty-state when the cart has no items.
 */
export declare function CartPage({ onCheckout, className }: CartPageProps): import("react/jsx-runtime").JSX.Element;
