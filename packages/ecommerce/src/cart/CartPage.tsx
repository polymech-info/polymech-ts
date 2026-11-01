import React from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCartStore } from "./useCartStore";
import { CartItemRow } from "./CartItem";
import { PolicyLinks } from "@/policies/PolicyLinks";

export interface CartPageProps {
    /** Called when user clicks "Proceed to Checkout". */
    onCheckout?: () => void;
    /** Optional extra class names. */
    className?: string;
}

/**
 * Full cart page — shows items, subtotal, and a checkout CTA.
 * Renders an empty-state when the cart has no items.
 */
export function CartPage({ onCheckout, className }: CartPageProps) {
    const items = useCartStore((s) => s.items);
    const subtotal = useCartStore((s) => s.subtotal);
    const itemCount = useCartStore((s) => s.itemCount);
    const clearCart = useCartStore((s) => s.clearCart);

    /* ---------- Empty state ---------- */
    if (items.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-6 py-24", className)}>
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Your cart is empty</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add some products to get started.
                    </p>
                </div>
            </div>
        );
    }

    /* ---------- Cart with items ---------- */
    return (
        <div className={cn("mx-auto max-w-3xl space-y-6 px-4 py-8", className)}>
            <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <ShoppingCart className="h-5 w-5" />
                        Cart
                        <span className="text-sm font-normal text-muted-foreground">
                            ({itemCount} {itemCount === 1 ? "item" : "items"})
                        </span>
                    </CardTitle>

                    <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Clear
                    </Button>
                </CardHeader>

                <CardContent className="space-y-3">
                    {items.map((item) => (
                        <CartItemRow key={item.id} item={item} />
                    ))}
                </CardContent>

                <Separator />

                <CardFooter className="flex-col items-stretch gap-4 pt-6">
                    <div className="flex items-center justify-between text-lg font-semibold">
                        <span>Subtotal</span>
                        <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Shipping and taxes calculated at checkout.
                    </p>
                    <Button size="lg" className="w-full" onClick={onCheckout}>
                        Proceed to Checkout
                    </Button>
                </CardFooter>
            </Card>

            <PolicyLinks className="pt-2" />
        </div>
    );
}
