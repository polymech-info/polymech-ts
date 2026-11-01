import React, { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, XCircle, ArrowLeft, ExternalLink, RefreshCw, Store, Receipt, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// We need to define or import Transaction type and statusConfig locally or from a shared type file
// Since client-ecommerce.ts is outside, let's redefine minimal types here or ask for them to be passed in.
// Ideally, `client-ecommerce.ts` types should be imported from @polymech/ecommerce if possible, 
// OR @polymech/ecommerce should define the types and client-ecommerce uses them.
// For now, let's define the props generically.

export interface Transaction {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    currency: string;
    product_info: any[];
    shipping_info: any;
    payment_provider?: string;
    external_order_id?: string;
    metadata?: Record<string, any>;
}

export interface PurchasesListProps {
    /** Async function to fetch user transactions. */
    onFetchTransactions: () => Promise<Transaction[]>;
    /** Navigation callback. */
    onNavigate: (path: string) => void;
    /** Toast notification handler. */
    toast?: {
        error: (msg: string) => void;
    };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3.5 w-3.5" /> },
    processing: { label: "Processing", variant: "default", icon: <RefreshCw className="h-3.5 w-3.5" /> },
    paid: { label: "Paid", variant: "default", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    completed: { label: "Completed", variant: "default", icon: <CheckCircle className="h-3.5 w-3.5" /> },
    failed: { label: "Failed", variant: "destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
    refunded: { label: "Refunded", variant: "outline", icon: <RefreshCw className="h-3.5 w-3.5" /> },
    cancelled: { label: "Cancelled", variant: "destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export function PurchasesList({ onFetchTransactions, onNavigate, toast }: PurchasesListProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        onFetchTransactions()
            .then((data) => {
                if (mounted) setTransactions(data);
            })
            .catch((err) => {
                console.error("Failed to load transactions:", err);
                toast?.error("Failed to load purchases");
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [onFetchTransactions]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Package className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">My Purchases</h1>
                </div>
                <Button variant="outline" size="sm" onClick={() => onNavigate("/")}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </div>

            {transactions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No purchases yet.</p>
                        <Button variant="outline" onClick={() => onNavigate("/")}>
                            Browse Products
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => {
                        const products = Array.isArray(tx.product_info) ? tx.product_info : [];
                        const sc = statusConfig[tx.status] || statusConfig.pending;
                        const date = new Date(tx.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        });

                        return (
                            <Card key={tx.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                Order #{tx.id.slice(0, 8)}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">{date}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={sc.variant} className="flex items-center gap-1">
                                                {sc.icon}
                                                {sc.label}
                                            </Badge>
                                            <span className="font-semibold text-sm">
                                                {tx.currency} {Number(tx.total_amount).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {/* Product list */}
                                    <div className="space-y-2">
                                        {products.map((item: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                                            >
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="h-10 w-10 rounded object-cover shrink-0"
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.title || "Product"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Qty: {item.quantity || 1}
                                                        {item.variant && ` · ${item.variant}`}
                                                        {" · "}
                                                        {tx.currency} {Number(item.price || 0).toFixed(2)}
                                                    </p>
                                                    {item.vendorSlug && (
                                                        <a
                                                            href={`/user/${item.vendorSlug}`}
                                                            onClick={(e) => { e.preventDefault(); onNavigate(`/user/${item.vendorSlug}`); }}
                                                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                                                        >
                                                            <Store className="h-3 w-3" />
                                                            {item.vendorSlug}
                                                        </a>
                                                    )}
                                                </div>
                                                {item.vendorSlug && item.pageSlug && (
                                                    <a
                                                        href={`/user/${item.vendorSlug}/pages/${item.pageSlug}`}
                                                        onClick={(e) => { e.preventDefault(); onNavigate(`/user/${item.vendorSlug}/pages/${item.pageSlug}`); }}
                                                        className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                                                    >
                                                        View
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shipping summary */}
                                    {tx.shipping_info && Object.keys(tx.shipping_info).length > 0 && (
                                        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                                            Ships to: {(tx.shipping_info as any).fullName}, {(tx.shipping_info as any).city}, {(tx.shipping_info as any).country}
                                        </div>
                                    )}

                                    {/* Receipt / Invoice links */}
                                    {tx.metadata && (tx.metadata.stripe_receipt_url || tx.metadata.stripe_invoice_url) && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-4">
                                            {tx.metadata.stripe_receipt_url && (
                                                <a
                                                    href={tx.metadata.stripe_receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Receipt className="h-3.5 w-3.5" />
                                                    View Receipt
                                                </a>
                                            )}
                                            {tx.metadata.stripe_invoice_url && (
                                                <a
                                                    href={tx.metadata.stripe_invoice_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    View Invoice
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
