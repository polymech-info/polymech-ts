export interface ReturnsPageProps {
    /** Number of days for return window. */
    returnWindowDays?: number;
    /** Translation function. */
    t?: (key: string) => string;
    /** Optional extra class names. */
    className?: string;
}
/** Public page with refund / return policy. */
export declare function ReturnsPage({ returnWindowDays, t: _t, className }: ReturnsPageProps): import("react/jsx-runtime").JSX.Element;
