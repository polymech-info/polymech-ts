import React from "react";
import { useLocation, matchPath, Navigate } from "react-router-dom";
import { CartPage } from "./cart/CartPage";
import { CheckoutFlow } from "./checkout/CheckoutFlow";
import { PurchasesList } from "./purchases/PurchasesList";
import { ShippingPage } from "./policies/ShippingPage";
import { ReturnsPage } from "./policies/ReturnsPage";
import { PrivacyPolicyPage } from "./policies/PrivacyPolicyPage";
import { TermsPage } from "./policies/TermsPage";
import { ImpressumPage } from "./policies/ImpressumPage";

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
    // Optional config
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

export const EcommerceBundle: React.FC<EcommerceBundleDependencies> = (props) => {
    const { pathname } = useLocation();
    const t = props.t || ((key: string) => key);

    if (matchPath("/cart/*", pathname)) {
        return <CartPage onCheckout={() => props.onNavigate('/checkout')} />;
    }

    if (matchPath("/checkout/*", pathname)) {
        return (
            <CheckoutFlow
                userId={props.user?.id}
                userDisplayName={props.user?.user_metadata?.display_name}
                userEmail={props.user?.email}
                onFetchAddresses={props.onFetchAddresses}
                onSaveAddress={props.onSaveAddress}
                onPlaceOrder={props.onPlaceOrder}
                onBackToCart={() => props.onNavigate('/cart')}
                onOrderSuccess={() => props.onNavigate('/purchases')}
                toast={props.toast}
                stripePublishableKey={props.stripePublishableKey}
                apiBaseUrl={props.apiBaseUrl}
                stripeReturnUrl={props.stripeReturnUrl}
                currency={props.currency}
                getAuthToken={props.getAuthToken}
                locale={props.locale}
            />
        );
    }

    if (matchPath("/purchases/*", pathname)) {
        return (
            <PurchasesList
                onFetchTransactions={props.onFetchTransactions}
                onNavigate={props.onNavigate}
                toast={props.toast}
            />
        );
    }

    if (matchPath("/shipping/*", pathname)) return <ShippingPage t={t} />;
    if (matchPath("/returns/*", pathname)) return <ReturnsPage t={t} />;
    if (matchPath("/privacy/*", pathname)) return <PrivacyPolicyPage siteName={props.siteName || "PolyMech"} contactEmail={props.contactEmail || "privacy@polymech.org"} t={t} />;
    if (matchPath("/terms/*", pathname)) return <TermsPage siteName={props.siteName || "PolyMech"} contactEmail={props.contactEmail || "legal@polymech.org"} t={t} />;
    if (matchPath("/impressum/*", pathname)) return <ImpressumPage {...(props.impressum || {})} t={t} />;

    return null; // Return null if no route matches (let App.tsx handle 404 if needed, though this component is usually mounted on specific routes)
};
