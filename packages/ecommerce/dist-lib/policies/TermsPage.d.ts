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
export declare function TermsPage({ siteName, contactEmail, t: _t, className, }: TermsPageProps): import("react/jsx-runtime").JSX.Element;
