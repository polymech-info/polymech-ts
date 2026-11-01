import React, { useState } from "react";
import {
    PaymentElement,
    LinkAuthenticationElement,
    AddressElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface StripePaymentFormProps {
    /** Called after Stripe confirms payment — receives the PaymentIntent data. */
    onPaymentSuccess?: (paymentIntent: { id: string; status: string;[key: string]: any }) => void;
    /** Return URL after redirect-based payment methods (iDEAL, etc.). */
    returnUrl?: string;
    /** Pre-fill the email field. */
    defaultEmail?: string;
    /** Pre-fill the name field in billing details. */
    defaultName?: string;
}

/*
<AddressElement
                options={{
                    mode: "billing",
                    display: { name: "full" },
                    defaultValues: {
                        name: defaultName ?? "",
                    },
                    fields: {
                        phone: "always",
                    },
                }}
            />
*/

/**
 * Embedded Stripe payment form using PaymentElement.
 * Must be rendered inside a Stripe `<Elements>` provider.
 */
export function StripePaymentForm({
    onPaymentSuccess,
    returnUrl,
    defaultEmail,
    defaultName,
}: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!stripe || !elements) return;

        setIsLoading(true);
        setMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl ?? `${window.location.origin}/completion`,
            },
            redirect: "if_required",
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message ?? "Payment failed.");
            } else {
                setMessage("An unexpected error occurred.");
            }
        } else if (paymentIntent) {
            // Payment succeeded without redirect
            onPaymentSuccess?.({
                id: paymentIntent.id,
                status: paymentIntent.status,
            });
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <LinkAuthenticationElement
                id="link-authentication-element"
                options={defaultEmail ? { defaultValues: { email: defaultEmail } } : undefined}
            />
            <PaymentElement
                id="payment-element"
                options={{
                    layout: "accordion",
                    defaultValues: {
                        billingDetails: {
                            name: defaultName ?? "",
                        },
                    },
                    business: { name: "PolyMech" },
                }}
            />

            <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !stripe || !elements}
                className="w-full"
                size="lg"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing…
                    </>
                ) : (
                    "Pay now"
                )}
            </Button>

            {message && (
                <p className="text-sm text-destructive text-center">{message}</p>
            )}
        </div>
    );
}
