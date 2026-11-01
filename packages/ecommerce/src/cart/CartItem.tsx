import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "./useCartStore";
import type { CartItem as CartItemType } from "./types";

export interface CartItemProps {
    item: CartItemType;
    /** Optional extra class names for the root element. */
    className?: string;
}

/** A single cart row — thumbnail, title, quantity stepper, line total, remove. */
export function CartItemRow({ item, className }: CartItemProps) {
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const removeItem = useCartStore((s) => s.removeItem);

    const lineTotal = item.price * item.quantity;

    return (
        <div
            className={cn(
                "flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4 transition-colors hover:bg-accent/5",
                className,
            )}
        >
            {/* Thumbnail */}
            {item.image ? (
                <img
                    src={item.image}
                    alt={item.title}
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                />
            ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    No img
                </div>
            )}

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
                <span className="truncate font-medium">{item.title}</span>
                {item.variant && (
                    <span className="text-xs text-muted-foreground">{item.variant}</span>
                )}
                <span className="text-sm text-muted-foreground">
                    ${item.price.toFixed(2)} each
                </span>
                {item.vendorSlug && (
                    <a
                        href={`/user/${item.vendorSlug}`}
                        className="text-xs text-primary hover:underline"
                    >
                        Sold by {item.vendorSlug}
                    </a>
                )}
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                    {item.quantity}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            {/* Line total */}
            <span className="w-20 text-right font-semibold tabular-nums">
                ${lineTotal.toFixed(2)}
            </span>

            {/* Remove */}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.title}`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
