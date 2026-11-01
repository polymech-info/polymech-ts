export interface PolicyLink {
    label: string;
    href: string;
}
export interface PolicyLinksProps {
    links?: PolicyLink[];
    className?: string;
}
/**
 * Small footer row of policy links for cart / checkout pages.
 */
export declare function PolicyLinks({ links, className }: PolicyLinksProps): import("react/jsx-runtime").JSX.Element;
