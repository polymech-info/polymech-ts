import { default as React } from 'react';
export interface EcommerceBundleDependencies {
    user: {
        id?: string;
        email?: string;
        user_metadata?: {
            display_name?: string;
        };
    } | null;
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
    };
    onFetchAddresses: (userId: string) => Promise<any[]>;
    onSaveAddress: (userId: string, addresses: any[]) => Promise<void>;
    onPlaceOrder: (data: any) => Promise<void>;
    onFetchTransactions: () => Promise<any[]>;
    onNavigate: (path: string) => void;
    siteName?: string;
    contactEmail?: string;
    /** Stripe publishable key — enables Stripe payment option. */
    stripePublishableKey?: string;
    /** API base URL for Stripe endpoints (e.g. "http://localhost:3333"). */
    apiBaseUrl?: string;
    /** Stripe return URL for redirect-based payment methods. */
    stripeReturnUrl?: string;
    /** Currency code for Stripe (default: "eur"). */
    currency?: string;
    /** Returns the current auth token for authenticated API calls. */
    getAuthToken?: () => Promise<string | null>;
    /** Locale for Stripe Elements (e.g. "en", "de"). */
    locale?: string;
    /** Translation function — receives an English key/HTML fragment, returns translated string. */
    t?: (key: string) => string;
    /** Impressum / Legal disclosure data (required in DACH). */
    impressum?: {
        company?: string;
        representative?: string;
        address?: string;
        email?: string;
        phone?: string;
        vatId?: string;
        register?: string;
        responsibleContent?: string;
    };
}
export declare const EcommerceBundle: React.FC<EcommerceBundleDependencies>;
