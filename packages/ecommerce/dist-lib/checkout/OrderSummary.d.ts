export interface OrderSummaryProps {
    /** Tax amount (pass 0 or leave undefined to show "Calculated at next step"). */
    tax?: number;
    /** Shipping cost (pass 0 or leave undefined to show "Free" / "TBD"). */
    shipping?: number;
    /** Optional extra class names. */
    className?: string;
}
/**
 * Read-only order breakdown: line items, subtotal, tax, shipping, total.
 */
export declare function OrderSummary({ tax, shipping, className }: OrderSummaryProps): import("react/jsx-runtime").JSX.Element;
