import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/cart/useCartStore";

export interface OrderSummaryProps {
    /** Tax amount (pass 0 or leave undefined to show "Calculated at next step"). */
    tax?: number;
    /** Shipping cost (pass 0 or leave undefined to show "Free" / "TBD"). */
    shipping?: number;
    /** Optional extra class names. */
    className?: string;
}

/**
 * Read-only order breakdown: line items, subtotal, tax, shipping, total.
 */
export function OrderSummary({ tax, shipping, className }: OrderSummaryProps) {
    const items = useCartStore((s) => s.items);
    const subtotal = useCartStore((s) => s.subtotal);

    const taxAmount = tax ?? 0;
    const shippingAmount = shipping ?? 0;
    const total = subtotal + taxAmount + shippingAmount;

    return (
        <Card className={cn("", className)}>
            <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Line items */}
                <ul className="space-y-2 text-sm">
                    {items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                                <span className="truncate text-muted-foreground">
                                    {item.title} × {item.quantity}
                                </span>
                                {item.vendorSlug && (
                                    <a href={`/user/${item.vendorSlug}`} className="text-xs text-primary hover:underline">
                                        via {item.vendorSlug}
                                    </a>
                                )}
                            </div>
                            <span className="shrink-0 tabular-nums">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </li>
                    ))}
                </ul>

                <Separator />

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">
                        {tax !== undefined ? `$${taxAmount.toFixed(2)}` : "Calculated at next step"}
                    </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="tabular-nums">
                        {shipping !== undefined
                            ? shippingAmount === 0
                                ? "Free"
                                : `$${shippingAmount.toFixed(2)}`
                            : "TBD"}
                    </span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
