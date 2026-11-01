import { Stripe as StripeJS } from '@stripe/stripe-js';
/** Shipping address fields collected at checkout. */
export interface ShippingAddress {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    country: string;
}
/** A saved address with extra metadata (matches pm-pics SavedShippingAddress). */
export interface SavedAddress extends ShippingAddress {
    id: string;
    label?: string;
    isDefault?: boolean;
    phone?: string;
    note?: string;
}
export type PaymentMethod = "shopify" | "crypto" | "stripe";
export interface CheckoutPageProps {
    /** Called when user submits the checkout form. */
    onPlaceOrder?: (data: {
        shipping: ShippingAddress;
        paymentMethod: PaymentMethod;
    }) => void;
    /** Called when user wants to save the entered address to their profile. */
    onSaveAddress?: (address: ShippingAddress) => void;
    /** Called when user clicks "Back to Cart". */
    onBackToCart?: () => void;
    /** Pre-fill shipping form fields (e.g. from user profile). */
    initialShipping?: Partial<ShippingAddress>;
    /** Saved shipping addresses — enables address selector. */
    savedAddresses?: SavedAddress[];
    /** Pre-filled tax amount, if known. */
    tax?: number;
    /** Pre-filled shipping cost. */
    shipping?: number;
    /** Stripe.js promise (from loadStripe). */
    stripePromise?: Promise<StripeJS | null> | null;
    /** Stripe PaymentIntent client secret. */
    stripeClientSecret?: string | null;
    /** Called after Stripe payment succeeds — includes shipping data and PaymentIntent. */
    onStripePaymentSuccess?: (data: {
        shipping: ShippingAddress;
        paymentMethod: PaymentMethod;
        paymentIntent: {
            id: string;
            status: string;
            [key: string]: any;
        };
    }) => void;
    /** Stripe return URL for redirect-based payment methods. */
    stripeReturnUrl?: string;
    /** Optional extra class names. */
    className?: string;
}
/**
 * Checkout page — two-column layout with shipping form + payment selector on
 * the left and an OrderSummary on the right.
 */
export declare function CheckoutPage({ onPlaceOrder, onSaveAddress, onBackToCart, initialShipping, savedAddresses, tax, shipping, stripePromise, stripeClientSecret, onStripePaymentSuccess, stripeReturnUrl, className, }: CheckoutPageProps): import("react/jsx-runtime").JSX.Element;
