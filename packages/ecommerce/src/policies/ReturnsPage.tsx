import React from "react";
import { RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react";
import { PolicyPage } from "./PolicyPage";

export interface ReturnsPageProps {
    /** Number of days for return window. */
    returnWindowDays?: number;
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}

/** Public page with refund / return policy. */
export function ReturnsPage({ returnWindowDays = 30, t: _t, className }: ReturnsPageProps) {
    const t = _t || ((k: string) => k);
    return (
        <PolicyPage title={t("Returns & Refund Policy")} className={className}>
            {/* Quick summary */}
            <div className="not-prose mb-8 grid gap-4 sm:grid-cols-2">
                {[
                    { icon: Clock, label: t(`${returnWindowDays}-day return window`) },
                    { icon: RotateCcw, label: t("Free returns on defective items") },
                    { icon: CheckCircle, label: t("Full refund to original payment") },
                    { icon: XCircle, label: t("No restocking fees") },
                ].map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-accent/5 p-4"
                    >
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm font-medium">{label}</span>
                    </div>
                ))}
            </div>

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Eligibility</h3>` +
                `<p>Items must be returned within <strong>${returnWindowDays} days</strong> of delivery in their original, unused condition with all tags and packaging intact.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>How to Initiate a Return</h3><ol>` +
                `<li>Contact our support team with your order number.</li>` +
                `<li>Receive a prepaid return label (for defective items) or return instructions.</li>` +
                `<li>Ship the item back using the provided label or your preferred carrier.</li>` +
                `</ol>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Refund Processing</h3>` +
                `<p>Once we receive and inspect the returned item, your refund will be processed within 5–10 business days to your original payment method. You will receive an email confirmation when the refund has been issued.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Exceptions</h3>` +
                `<p>The following items are not eligible for return: gift cards, downloadable products, and items marked as final sale. Perishable goods cannot be returned unless they arrive damaged or defective.</p>`
            ) }} />
        </PolicyPage>
    );
}
