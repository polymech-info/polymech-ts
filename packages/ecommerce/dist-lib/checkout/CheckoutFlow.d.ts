import { SavedAddress } from './CheckoutPage';
export interface CheckoutFlowProps {
    /** The authenticated user's ID. */
    userId?: string;
    /** The authenticated user's display name. */
    userDisplayName?: string;
    /** The authenticated user's email. */
    userEmail?: string;
    /** Async function to fetch saved addresses for the user. */
    onFetchAddresses: (userId: string) => Promise<SavedAddress[]>;
    /** Async function to save a new address (or update list). */
    onSaveAddress: (userId: string, addresses: SavedAddress[]) => Promise<void>;
    /** Async function to place the order (create transaction). */
    onPlaceOrder: (data: any) => Promise<void>;
    /** Navigation callback to go back to cart. */
    onBackToCart: () => void;
    /** Callback after successful order placement (e.g. navigate to purchases). */
    onOrderSuccess: () => void;
    /** Toast notification handler. */
    toast?: {
        success: (msg: string) => void;
        error: (msg: string) => void;
    };
    /**
     * Stripe publishable key (pk_test_... or pk_live_...).
     * If omitted the Stripe payment option will still render but remain
     * in a "loading" state until the key is provided.
     */
    stripePublishableKey?: string;
    /**
     * Base URL for the API server (e.g. "http://localhost:3333").
     * Used to call `/api/stripe/create-payment-intent`.
     */
    apiBaseUrl?: string;
    /** Stripe return URL for redirect-based payment methods. */
    stripeReturnUrl?: string;
    /** Currency code for Stripe payments (default: "eur"). */
    currency?: string;
    /** Returns the current auth token for authenticated API calls. */
    getAuthToken?: () => Promise<string | null>;
    /** Locale for Stripe Elements (e.g. "en", "de", "fr"). */
    locale?: string;
}
export declare function CheckoutFlow({ userId, userDisplayName, userEmail, onFetchAddresses, onSaveAddress, onPlaceOrder, onBackToCart, onOrderSuccess, toast, stripePublishableKey, apiBaseUrl, stripeReturnUrl, currency, getAuthToken, locale, }: CheckoutFlowProps): import("react/jsx-runtime").JSX.Element;
