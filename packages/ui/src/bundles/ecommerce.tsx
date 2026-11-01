import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { getCurrentLang, translate } from "@/i18n";
import { serverUrl } from "@/lib/db";

const EcommerceBundle = React.lazy(() => import("@polymech/ecommerce").then(m => ({ default: m.EcommerceBundle })));

export const EcommerceBundleWrapper = () => {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const locale = getCurrentLang();

    // Memoize dependencies to prevent re-renders
    const dependencies = React.useMemo(() => {
        return {
            user: user ? {
                id: user.id,
                email: user.email,
                user_metadata: {
                    display_name: user.user_metadata?.display_name
                }
            } : null,
            toast: {
                success: (msg: string) => import('sonner').then(s => s.toast.success(msg)),
                error: (msg: string) => import('sonner').then(s => s.toast.error(msg))
            },
            onFetchAddresses: async (userId: string) => {
                const { getShippingAddresses } = await import('@/modules/user/client-user');
                return getShippingAddresses(userId) as Promise<any[]>;
            },
            onSaveAddress: async (userId: string, addresses: any[]) => {
                const { saveShippingAddresses } = await import('@/modules/user/client-user');
                await saveShippingAddresses(userId, addresses);
            },
            onPlaceOrder: async (data: any) => {
                const { useCartStore } = await import('@polymech/ecommerce');
                const { createTransaction } = await import('@/modules/ecommerce/client-ecommerce');
                const items = useCartStore.getState().items;
                const subtotal = useCartStore.getState().subtotal;

                await createTransaction({
                    shipping_info: data.shipping,
                    vendor_info: {},
                    product_info: items.map((i: any) => ({
                        id: i.id,
                        title: i.title,
                        image: i.image,
                        price: i.price,
                        quantity: i.quantity,
                        variant: i.variant,
                        vendorSlug: i.vendorSlug,
                        pageSlug: i.pageSlug,
                    })),
                    total_amount: subtotal,
                    payment_provider: data.paymentMethod,
                    // Stripe-specific fields (undefined for non-Stripe payments)
                    external_order_id: data.external_order_id,
                    metadata: data.metadata,
                });
                useCartStore.getState().clearCart();
            },
            onFetchTransactions: async () => {
                const { listTransactions } = await import('@/modules/ecommerce/client-ecommerce');
                return listTransactions();
            },
            onNavigate: (path: string) => navigate(path),
            siteName: "PolyMech",
            contactEmail: "sales@plastic-hub.com",
            stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
            apiBaseUrl: serverUrl,
            getAuthToken: async () => session?.access_token ?? null,
            locale,
            t: translate,
            impressum: {
                company: "Polymech S.L.",
                representative: "Guenter Volkmar Baumgart",
                address: "Poligono Can Clapers, Carrer Can Peric 11, 1B, 08181 Sentmenat, Barcelona, Spain",
                email: "info@polymech.info",
                phone: "+34 691 952 287",
                vatId: "ES-Y0100830N",
                register: "Registro Mercantil de Barcelona",
                responsibleContent: "Guenter Volkmar Baumgart (§ 18 Abs. 2 MStV)",
            },
        };
    }, [user, session, navigate, locale]);

    return (
        <React.Suspense fallback={<div className="flex items-center justify-center p-12">Loading...</div>}>
            <EcommerceBundle {...dependencies} />
        </React.Suspense>
    );
};
