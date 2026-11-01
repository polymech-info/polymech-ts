export interface Transaction {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    currency: string;
    product_info: any[];
    shipping_info: any;
    payment_provider?: string;
    external_order_id?: string;
    metadata?: Record<string, any>;
}
export interface PurchasesListProps {
    /** Async function to fetch user transactions. */
    onFetchTransactions: () => Promise<Transaction[]>;
    /** Navigation callback. */
    onNavigate: (path: string) => void;
    /** Toast notification handler. */
    toast?: {
        error: (msg: string) => void;
    };
}
export declare function PurchasesList({ onFetchTransactions, onNavigate, toast }: PurchasesListProps): import("react/jsx-runtime").JSX.Element;
