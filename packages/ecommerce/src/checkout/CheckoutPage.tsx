import React, { useState } from "react";
import { CreditCard, Bitcoin, ShoppingBag, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/cart/useCartStore";
import { OrderSummary } from "./OrderSummary";
import { PolicyLinks } from "@/policies/PolicyLinks";
import { StripePaymentForm } from "./StripePaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import type { Stripe as StripeJS } from "@stripe/stripe-js";

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
        paymentIntent: { id: string; status: string;[key: string]: any };
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
export function CheckoutPage({
    onPlaceOrder,
    onSaveAddress,
    onBackToCart,
    initialShipping,
    savedAddresses,
    tax,
    shipping,
    stripePromise,
    stripeClientSecret,
    onStripePaymentSuccess,
    stripeReturnUrl,
    className,
}: CheckoutPageProps) {
    const itemCount = useCartStore((s) => s.itemCount);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("shopify");
    const [saveAddress, setSaveAddress] = useState(false);

    // Find default address or first address from savedAddresses
    const defaultAddress = savedAddresses?.find((a) => a.isDefault) ?? savedAddresses?.[0];

    // Determine initial form values: saved default > initialShipping > empty
    const resolveInitial = (): ShippingAddress => ({
        fullName: defaultAddress?.fullName ?? initialShipping?.fullName ?? "",
        email: defaultAddress?.email ?? initialShipping?.email ?? "",
        address: defaultAddress?.address ?? initialShipping?.address ?? "",
        city: defaultAddress?.city ?? initialShipping?.city ?? "",
        zip: defaultAddress?.zip ?? initialShipping?.zip ?? "",
        country: defaultAddress?.country ?? initialShipping?.country ?? "",
    });

    const [form, setForm] = useState<ShippingAddress>(resolveInitial);
    const [selectedAddressId, setSelectedAddressId] = useState<string>(
        defaultAddress?.id ?? "custom"
    );

    // Sync form when a saved address is selected
    const selectAddress = (id: string) => {
        setSelectedAddressId(id);
        if (id === "custom") return;
        const addr = savedAddresses?.find((a) => a.id === id);
        if (addr) {
            setForm({
                fullName: addr.fullName,
                email: addr.email,
                address: addr.address,
                city: addr.city,
                zip: addr.zip,
                country: addr.country,
            });
        }
    };

    const field = (key: keyof ShippingAddress, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (saveAddress && selectedAddressId === "custom" && onSaveAddress) {
            onSaveAddress(form);
        }
        onPlaceOrder?.({ shipping: form, paymentMethod });
    };

    /* ---- Empty cart guard ---- */
    if (itemCount === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-6 py-24", className)}>
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Your cart is empty — nothing to check out.</p>
                {onBackToCart && (
                    <Button variant="outline" onClick={onBackToCart}>
                        Back to Cart
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn("w-full mx-auto max-w-5xl px-4 py-8 overflow-x-hidden", className)}>
            <form
                onSubmit={handleSubmit}
                className="grid gap-8 lg:grid-cols-[1fr_380px]"
            >
                {/* ---- Left: Shipping + Payment ---- */}
                <div className="space-y-6 min-w-0">
                    {/* Shipping */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Shipping Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Saved Address Selector */}
                            {savedAddresses && savedAddresses.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        Saved Addresses
                                    </Label>
                                    <div className="space-y-2">
                                        {savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                type="button"
                                                onClick={() => selectAddress(addr.id)}
                                                className={cn(
                                                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors text-sm",
                                                    selectedAddressId === addr.id
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:bg-accent/5",
                                                )}
                                            >
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium">
                                                        {addr.label || addr.fullName}
                                                        {addr.isDefault && (
                                                            <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-muted-foreground truncate">
                                                        {addr.address}, {addr.city}, {addr.country}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => selectAddress("custom")}
                                            className={cn(
                                                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors text-sm",
                                                selectedAddressId === "custom"
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:bg-accent/5",
                                            )}
                                        >
                                            <span className="text-muted-foreground">✏️</span>
                                            <span className="font-medium">Enter a new address</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="ck-name">Full Name</Label>
                                    <Input
                                        id="ck-name"
                                        required
                                        placeholder="Jane Doe"
                                        value={form.fullName}
                                        onChange={(e) => field("fullName", e.target.value)}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="ck-email">Email</Label>
                                    <Input
                                        id="ck-email"
                                        type="email"
                                        required
                                        placeholder="jane@example.com"
                                        value={form.email}
                                        onChange={(e) => field("email", e.target.value)}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="ck-address">Address</Label>
                                    <Input
                                        id="ck-address"
                                        required
                                        placeholder="123 Main St"
                                        value={form.address}
                                        onChange={(e) => field("address", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ck-city">City</Label>
                                    <Input
                                        id="ck-city"
                                        required
                                        placeholder="New York"
                                        value={form.city}
                                        onChange={(e) => field("city", e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="ck-zip">ZIP / Postal Code</Label>
                                    <Input
                                        id="ck-zip"
                                        required
                                        placeholder="10001"
                                        value={form.zip}
                                        onChange={(e) => field("zip", e.target.value)}
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-1.5">
                                    <Label htmlFor="ck-country">Country</Label>
                                    <Input
                                        id="ck-country"
                                        required
                                        placeholder="United States"
                                        value={form.country}
                                        onChange={(e) => field("country", e.target.value)}
                                    />
                                </div>

                                {selectedAddressId === "custom" && onSaveAddress && (
                                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="ck-save-address"
                                            checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                                        />
                                        <Label htmlFor="ck-save-address" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                                            <Save className="h-3.5 w-3.5" />
                                            Save this address for future orders
                                        </Label>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("shopify")}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                    paymentMethod === "shopify"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-accent/5",
                                )}
                            >
                                <CreditCard className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">Shopify Checkout</p>
                                    <p className="text-xs text-muted-foreground">
                                        Credit / debit card via Shopify
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod("crypto")}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                    paymentMethod === "crypto"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-accent/5",
                                )}
                            >
                                <Bitcoin className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">Crypto Payment</p>
                                    <p className="text-xs text-muted-foreground">
                                        Bitcoin, Ethereum, and more
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod("stripe")}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                    paymentMethod === "stripe"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-accent/5",
                                )}
                            >
                                <CreditCard className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">Stripe</p>
                                    <p className="text-xs text-muted-foreground">
                                        Credit / debit card, Apple&nbsp;Pay, Google&nbsp;Pay
                                    </p>
                                </div>
                            </button>

                            {/* Inline Stripe Payment Form */}
                            {paymentMethod === "stripe" && stripePromise && stripeClientSecret && (
                                <div className="pt-2" style={{ minHeight: 350, contain: "content", overflow: "hidden", maxWidth: "100%" }}>
                                    <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                                        <StripePaymentForm
                                            onPaymentSuccess={(paymentIntent) => {
                                                if (saveAddress && selectedAddressId === "custom" && onSaveAddress) {
                                                    onSaveAddress(form);
                                                }
                                                onStripePaymentSuccess?.({
                                                    shipping: form,
                                                    paymentMethod: "stripe",
                                                    paymentIntent,
                                                });
                                            }}
                                            returnUrl={stripeReturnUrl}
                                            defaultEmail={form.email}
                                            defaultName={form.fullName}
                                        />
                                    </Elements>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ---- Right: Summary + CTA ---- */}
                <div className="space-y-4">
                    <OrderSummary tax={tax} shipping={shipping} />

                    <Separator />

                    {paymentMethod !== "stripe" && (
                        <Button type="submit" size="lg" className="w-full">
                            Place Order
                        </Button>
                    )}

                    {onBackToCart && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={onBackToCart}
                        >
                            ← Back to Cart
                        </Button>
                    )}

                    <PolicyLinks className="pt-4" />
                </div>
            </form>
        </div>
    );
}
