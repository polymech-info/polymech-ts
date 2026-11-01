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
export declare function ImpressumPage({ company, representative, address, email, phone, vatId, register, responsibleContent, t: _t, className, }: ImpressumPageProps): import("react/jsx-runtime").JSX.Element;
