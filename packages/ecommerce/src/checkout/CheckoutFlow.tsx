import React, { useState, useEffect } from "react";
import { CheckoutPage, CheckoutPageProps, SavedAddress } from "./CheckoutPage";
import { useCartStore } from "@/cart/useCartStore";
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe as StripeJS } from "@stripe/stripe-js";

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

export function CheckoutFlow({
    userId,
    userDisplayName,
    userEmail,
    onFetchAddresses,
    onSaveAddress,
    onPlaceOrder,
    onBackToCart,
    onOrderSuccess,
    toast,
    stripePublishableKey,
    apiBaseUrl = "",
    stripeReturnUrl,
    currency = "eur",
    getAuthToken,
    locale,
}: CheckoutFlowProps) {
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [stripePromise, setStripePromise] = useState<Promise<StripeJS | null> | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const subtotal = useCartStore((s) => s.subtotal);

    // 1. Fetch addresses on mount if user exists
    useEffect(() => {
        if (!userId) return;
        let mounted = true;
        onFetchAddresses(userId)
            .then((addrs) => {
                if (mounted) setSavedAddresses(addrs);
            })
            .catch((err) => console.error("Failed to fetch addresses:", err));
        return () => { mounted = false; };
    }, [userId, onFetchAddresses]);

    // 2. Load Stripe.js once we have a publishable key
    useEffect(() => {
        if (!stripePublishableKey) return;
        setStripePromise(loadStripe(stripePublishableKey, { locale: (locale as any) || 'auto' }));
    }, [stripePublishableKey, locale]);

    // 3. Create a PaymentIntent when the flow mounts (so the form is ready)
    useEffect(() => {
        if (!stripePublishableKey || subtotal <= 0) return;
        let mounted = true;

        // Stripe expects amount in smallest currency unit (cents for USD)
        const amountInCents = Math.round(subtotal * 100);

        // Get auth token for the API call (needed for Stripe Customer creation)
        const makeRequest = async () => {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (getAuthToken) {
                const token = await getAuthToken();
                if (token) headers["Authorization"] = `Bearer ${token}`;
            }
            const r = await fetch(`${apiBaseUrl}/api/stripe/create-payment-intent`, {
                method: "POST",
                headers,
                body: JSON.stringify({ amount: amountInCents, currency }),
            });
            return r.json();
        };

        makeRequest()
            .then((data) => {
                if (mounted && data.clientSecret) {
                    setClientSecret(data.clientSecret);
                }
            })
            .catch((err) => console.error("Failed to create PaymentIntent:", err));

        return () => { mounted = false; };
    }, [stripePublishableKey, apiBaseUrl, subtotal]);

    // 4. Handle saving a new address
    const handleSaveAddress = async (address: any) => {
        if (!userId) return;
        try {
            // Re-fetch latest to be safe (or use local state if we trust it completely)
            const existing = await onFetchAddresses(userId);

            const newAddr: SavedAddress = {
                ...address,
                id: crypto.randomUUID(),
                label: address.address?.split(',')[0] || 'Checkout address',
                phone: '',
                note: '',
                // If it's the first address, make it default
                isDefault: existing.length === 0,
            };

            const updated = [...existing, newAddr];
            await onSaveAddress(userId, updated);
            setSavedAddresses(updated);
            toast?.success("Address saved to your profile");
        } catch (err) {
            console.error("Failed to save address:", err);
            toast?.error("Failed to save address");
        }
    };

    // 5. Handle order placement (for non-Stripe methods)
    const handlePlaceOrder = async (data: any) => {
        try {
            await onPlaceOrder(data);
            toast?.success("Order placed successfully!");
            onOrderSuccess();
        } catch (err) {
            console.error("Failed to place order:", err);
            toast?.error("Failed to place order. Please try again.");
        }
    };

    // 6. Handle Stripe payment success (inline, no redirect)
    const handleStripePaymentSuccess = async (data: {
        shipping: any;
        paymentMethod: string;
        paymentIntent: { id: string; status: string;[key: string]: any };
    }) => {
        try {
            await onPlaceOrder({
                shipping: data.shipping,
                paymentMethod: data.paymentMethod,
                // Store Stripe PaymentIntent ID for refunds/reconciliation
                external_order_id: data.paymentIntent.id,
                metadata: {
                    stripe_payment_intent_id: data.paymentIntent.id,
                    stripe_status: data.paymentIntent.status,
                },
            });
            toast?.success("Payment successful!");
            // Brief delay to let the Stripe webhook update the transaction
            // with receipt URL and status before navigating
            await new Promise((r) => setTimeout(r, 2000));
            onOrderSuccess();
        } catch (err) {
            console.error("Failed to record Stripe transaction:", err);
            toast?.error("Payment succeeded but failed to record transaction. Contact support.");
        }
    };

    return (
        <CheckoutPage
            onPlaceOrder={handlePlaceOrder}
            onSaveAddress={handleSaveAddress}
            onBackToCart={onBackToCart}
            savedAddresses={savedAddresses}
            initialShipping={{
                fullName: userDisplayName ?? "",
                email: userEmail ?? "",
            }}
            stripePromise={stripePromise}
            stripeClientSecret={clientSecret}
            onStripePaymentSuccess={handleStripePaymentSuccess}
            stripeReturnUrl={stripeReturnUrl}
        />
    );
}
