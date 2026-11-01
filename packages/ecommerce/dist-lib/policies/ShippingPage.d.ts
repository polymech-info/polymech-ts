export interface ShippingRate {
    region: string;
    method: string;
    estimate: string;
    price: string;
}
export interface ShippingPageProps {
    /** Custom shipping rates to display. Falls back to placeholder content. */
    rates?: ShippingRate[];
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}
/** Public page with shipping info and rates. */
export declare function ShippingPage({ rates, t: _t, className }: ShippingPageProps): import("react/jsx-runtime").JSX.Element;
