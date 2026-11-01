import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface PolicyPageProps {
    /** Page title override. */
    title?: string;
    /** Rich content to render inside the page body (JSX). */
    children?: React.ReactNode;
    /** Optional extra class names. */
    className?: string;
}

/**
 * Generic policy/info page shell — centered card with title + prose body.
 * Used by ShippingPage, ReturnsPage, PrivacyPolicyPage, TermsPage.
 */
export function PolicyPage({ title, children, className }: PolicyPageProps) {
    return (
        <div className={cn("mx-auto max-w-3xl py-8", className)}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
