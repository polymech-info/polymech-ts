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
export declare function PrivacyPolicyPage({ siteName, contactEmail, t: _t, className, }: PrivacyPolicyPageProps): import("react/jsx-runtime").JSX.Element;
