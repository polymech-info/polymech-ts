import React from "react";
import { PolicyPage } from "./PolicyPage";

export interface ImpressumPageProps {
    /** Company / legal entity name. */
    company?: string;
    /** Legal representative. */
    representative?: string;
    /** Postal address. */
    address?: string;
    /** Contact email. */
    email?: string;
    /** Contact phone. */
    phone?: string;
    /** VAT / Tax ID (USt-IdNr.). */
    vatId?: string;
    /** Commercial register entry. */
    register?: string;
    /** Responsible for content (§ 18 Abs. 2 MStV). */
    responsibleContent?: string;
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}

/** Impressum / Legal Disclosure page — required by German TMG §5 / DDG. */
export function ImpressumPage({
    company = "Company Name",
    representative = "Representative Name",
    address = "Street, City, Country",
    email = "info@example.com",
    phone = "",
    vatId = "",
    register = "",
    responsibleContent = "",
    t: _t,
    className,
}: ImpressumPageProps) {
    const t = _t || ((k: string) => k);
    return (
        <PolicyPage title={t("Impressum — Legal Disclosure")} className={className}>
            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Information pursuant to § 5 DDG</h3>` +
                `<p><strong>${company}</strong><br/>` +
                `${address}</p>` +
                `<p><strong>Represented by:</strong><br/>${representative}</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Contact</h3>` +
                `<p>Email: <a href="mailto:${email}" class="text-primary underline">${email}</a>` +
                (phone ? `<br/>Phone: ${phone}` : ``) +
                `</p>`
            ) }} />

            {vatId && (
                <div dangerouslySetInnerHTML={{ __html: t(
                    `<h3>VAT ID</h3>` +
                    `<p>VAT identification number pursuant to § 27a UStG:<br/><strong>${vatId}</strong></p>`
                ) }} />
            )}

            {register && (
                <div dangerouslySetInnerHTML={{ __html: t(
                    `<h3>Commercial Register</h3>` +
                    `<p>${register}</p>`
                ) }} />
            )}

            {responsibleContent && (
                <div dangerouslySetInnerHTML={{ __html: t(
                    `<h3>Responsible for Content</h3>` +
                    `<p>${responsibleContent}</p>`
                ) }} />
            )}

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>EU Dispute Resolution</h3>` +
                `<p>The European Commission provides a platform for online dispute resolution (ODR): ` +
                `<a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-primary underline">https://ec.europa.eu/consumers/odr/</a>. ` +
                `We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Liability for Content</h3>` +
                `<p>As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to § 7(1) DDG. According to §§ 8 to 10 DDG, however, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.</p>`
            ) }} />

            <div dangerouslySetInnerHTML={{ __html: t(
                `<h3>Liability for Links</h3>` +
                `<p>Our website contains links to external third-party websites over whose content we have no influence. We therefore cannot accept any liability for this third-party content. The respective provider or operator of the linked pages is always responsible for the content of the linked pages.</p>`
            ) }} />
        </PolicyPage>
    );
}
