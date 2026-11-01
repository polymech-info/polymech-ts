export interface StripePaymentFormProps {
    /** Called after Stripe confirms payment — receives the PaymentIntent data. */
    onPaymentSuccess?: (paymentIntent: {
        id: string;
        status: string;
        [key: string]: any;
    }) => void;
    /** Return URL after redirect-based payment methods (iDEAL, etc.). */
    returnUrl?: string;
    /** Pre-fill the email field. */
    defaultEmail?: string;
    /** Pre-fill the name field in billing details. */
    defaultName?: string;
}
/**
 * Embedded Stripe payment form using PaymentElement.
 * Must be rendered inside a Stripe `<Elements>` provider.
 */
export declare function StripePaymentForm({ onPaymentSuccess, returnUrl, defaultEmail, defaultName, }: StripePaymentFormProps): import("react/jsx-runtime").JSX.Element;
