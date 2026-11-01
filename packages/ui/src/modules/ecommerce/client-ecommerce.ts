/**
 * Client-side ecommerce module — transaction CRUD via authenticated API calls.
 * Uses apiClient (@/lib/db) for auth, URL resolution, and retries.
 */

import { apiClient } from '@/lib/db';

// ---------------------------------------------------------------------------
// Transaction Types
// ---------------------------------------------------------------------------

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface Transaction {
    id: string;
    user_id: string;
    status: TransactionStatus;
    shipping_info: Record<string, any>;
    vendor_info: Record<string, any>;
    product_info: any[];
    currency: string;
    total_amount: number;
    buyer_email: string | null;
    buyer_name: string | null;
    buyer_ip: string | null;
    buyer_profile: Record<string, any>;
    external_order_id: string | null;
    external_checkout_id: string | null;
    payment_provider: string;
    note: string | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface CreateTransactionInput {
    shipping_info: Record<string, any>;
    vendor_info: Record<string, any>;
    product_info: any[];
    currency?: string;
    total_amount: number;
    note?: string;
    external_order_id?: string;
    external_checkout_id?: string;
    payment_provider?: string;
    metadata?: Record<string, any>;
}

export interface UpdateTransactionInput {
    status?: TransactionStatus;
    note?: string;
    metadata?: Record<string, any>;
    shipping_info?: Record<string, any>;
    vendor_info?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// CRUD Functions
// ---------------------------------------------------------------------------

/** List all transactions for the current user (admins see all) */
export async function listTransactions(): Promise<Transaction[]> {
    return apiClient<Transaction[]>('/api/transactions');
}

/** Get a single transaction by ID */
export async function getTransaction(id: string): Promise<Transaction> {
    return apiClient<Transaction>(`/api/transactions/${id}`);
}

/** Create a new transaction */
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    return apiClient<Transaction>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/** Update a transaction (status, metadata, etc.) */
export async function updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    return apiClient<Transaction>(`/api/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}
