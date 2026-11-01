import { default as React } from 'react';
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
export declare function PolicyPage({ title, children, className }: PolicyPageProps): import("react/jsx-runtime").JSX.Element;
