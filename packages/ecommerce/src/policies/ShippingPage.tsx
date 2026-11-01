import React from "react";
import { Truck, Clock, Globe, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { PolicyPage } from "./PolicyPage";

export interface ShippingRate {
    region: string;
    method: string;
    estimate: string;
    price: string;
}

export interface ShippingPageProps {
    /** Custom shipping rates to display. Falls back to placeholder content. */
    rates?: ShippingRate[];
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}

const defaultRates: ShippingRate[] = [
    { region: "Domestic", method: "Standard", estimate: "5–7 business days", price: "$4.99" },
    { region: "Domestic", method: "Express", estimate: "2–3 business days", price: "$12.99" },
    { region: "International", method: "Standard", estimate: "10–20 business days", price: "$14.99" },
    { region: "International", method: "Express", estimate: "5–8 business days", price: "$29.99" },
];

/** Public page with shipping info and rates. */
export function ShippingPage({ rates = defaultRates, t: _t, className }: ShippingPageProps) {
    const t = _t || ((k: string) => k);
    return (
        <PolicyPage title={t("Shipping Information")} className={className}>
            {/* Highlights */}
            <div className="not-prose mb-8 grid gap-4 sm:grid-cols-2">
                {[
                    { icon: Truck, label: t("Free shipping on orders over $75") },
                    { icon: Clock, label: t("Same-day dispatch on orders before 2 PM") },
                    { icon: Globe, label: t("We ship worldwide") },
                    { icon: DollarSign, label: t("No hidden fees at checkout") },
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

            {/* Rates table — headers translated, values passed through */}
            <h3>{t("Shipping Rates")}</h3>
            <div className="not-prose overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">{t("Region")}</th>
                            <th className="pb-2 pr-4 font-medium">{t("Method")}</th>
                            <th className="pb-2 pr-4 font-medium">{t("Estimate")}</th>
                            <th className="pb-2 font-medium text-right">{t("Price")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map((r, i) => (
                            <tr key={i} className={cn("border-b border-border/30", i % 2 === 0 && "bg-accent/5")}>
                                <td className="py-2.5 pr-4">{t(r.region)}</td>
                                <td className="py-2.5 pr-4">{t(r.method)}</td>
                                <td className="py-2.5 pr-4 text-muted-foreground">{r.estimate}</td>
                                <td className="py-2.5 text-right font-medium">{r.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Processing Time</h3>` +
                `<p>Orders placed before 2:00 PM (local time) on business days are typically processed and shipped the same day. Orders placed after this cut-off or on weekends/holidays will be processed the next business day.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Tracking</h3>` +
                `<p>Once your order ships, you will receive a confirmation email with a tracking number. You can use this number to track your package on the carrier's website.</p>`
            ) }} />
        </PolicyPage>
    );
}
