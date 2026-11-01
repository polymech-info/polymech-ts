import React from "react";
import { PolicyPage } from "./PolicyPage";

export interface TermsPageProps {
    /** Business / site name. */
    siteName?: string;
    /** Contact email for legal inquiries. */
    contactEmail?: string;
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}

/** Optional terms of service page. */
export function TermsPage({
    siteName = "Our Store",
    contactEmail = "legal@example.com",
    t: _t,
    className,
}: TermsPageProps) {
    const t = _t || ((k: string) => k);
    return (
        <PolicyPage title={t("Terms of Service")} className={className}>
            <p dangerouslySetInnerHTML={{ __html: t(
                `By accessing and using <strong>${siteName}</strong>, you agree to be bound by these Terms of Service.`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Use of the Site</h3>` +
                `<p>You agree to use this site only for lawful purposes and in a manner that does not infringe on the rights of others or restrict their use and enjoyment of the site.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Products &amp; Pricing</h3>` +
                `<p>All product descriptions and prices are subject to change without notice. We reserve the right to modify or discontinue any product at any time. Prices are displayed in the store's base currency and may exclude taxes and shipping costs, which are calculated at checkout.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Orders &amp; Payment</h3>` +
                `<p>By placing an order, you make an offer to purchase the selected products. We reserve the right to refuse or cancel any order for any reason, including pricing errors or suspected fraud.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Intellectual Property</h3>` +
                `<p>All content on this site — including text, images, logos, and software — is the property of ${siteName} or its licensors and is protected by applicable intellectual property laws.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Limitation of Liability</h3>` +
                `<p>To the fullest extent permitted by law, ${siteName} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or purchase of products.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Changes to These Terms</h3>` +
                `<p>We may update these Terms of Service from time to time. Continued use of the site after changes constitutes acceptance of the revised terms.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Contact</h3>` +
                `<p>For questions about these terms, contact us at <a href="mailto:${contactEmail}" class="text-primary underline">${contactEmail}</a>.</p>`
            ) }} />
        </PolicyPage>
    );
}
