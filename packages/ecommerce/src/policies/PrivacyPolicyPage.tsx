import React from "react";
import { PolicyPage } from "./PolicyPage";

export interface PrivacyPolicyPageProps {
    /** Business / site name used in the policy text. */
    siteName?: string;
    /** Contact email for privacy inquiries. */
    contactEmail?: string;
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}

/** Public page with privacy / cookie information. */
export function PrivacyPolicyPage({
    siteName = "Our Store",
    contactEmail = "privacy@example.com",
    t: _t,
    className,
}: PrivacyPolicyPageProps) {
    const t = _t || ((k: string) => k);
    return (
        <PolicyPage title={t("Privacy Policy")} className={className}>
            <p dangerouslySetInnerHTML={{ __html: t(
                `At <strong>${siteName}</strong>, privacy is not a checkbox — it is a core value. We believe you should be able to browse, shop, and interact with our platform without being tracked, profiled, or surveilled. We go beyond legal compliance to ensure your data is handled with the respect it deserves.`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Privacy by Design</h3>` +
                `<p>We have intentionally built our platform without invasive tracking technologies. There are no third-party analytics scripts, no advertising pixels, no behavioral profiling, and no cross-site tracking — not because the law requires it, but because we believe it is the right thing to do.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Information We Collect</h3><ul>` +
                `<li><strong>Order information:</strong> name, email, shipping address, and payment details you provide during checkout — used solely to process and fulfill your orders.</li>` +
                `<li><strong>Account information:</strong> email and profile data if you create an account — used to manage your orders and preferences.</li>` +
                `<li><strong>Anonymized usage data:</strong> we collect basic, anonymized page-visit data (with IP addresses truncated) to understand how our site is used. This data cannot be used to identify you personally.</li>` +
                `</ul>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>What We Will Never Do</h3><ul>` +
                `<li>Sell, rent, or share your personal data with third parties for marketing or advertising.</li>` +
                `<li>Use third-party tracking scripts, analytics services, or advertising networks.</li>` +
                `<li>Use tracking pixels or monitor individual email opens and clicks.</li>` +
                `<li>Build advertising profiles or track you across other websites.</li>` +
                `<li>Monetize your data in any way.</li>` +
                `</ul>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Cookies</h3>` +
                `<p>We use only essential, first-party cookies required for the site to function (e.g., keeping you logged in, maintaining your shopping cart). We do not set any third-party or advertising cookies.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Data Sharing</h3>` +
                `<p>We share information only with service providers strictly necessary to fulfill your order (e.g., payment processors, shipping carriers) and as required by law. These providers are contractually obligated to protect your data.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Your Rights</h3>` +
                `<p>The only personal data we store is the shipping address you enter during checkout. You can request correction or deletion of this data at any time by contacting us at <a href="mailto:${contactEmail}" class="text-primary underline">${contactEmail}</a>. We will respond promptly.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Contact Us</h3>` +
                `<p>If you have questions about this privacy policy, please contact us at <a href="mailto:${contactEmail}" class="text-primary underline">${contactEmail}</a>.</p>`
            ) }} />
        </PolicyPage>
    );
}
