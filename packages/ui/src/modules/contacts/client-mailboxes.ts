/**
 * Client-side API wrapper for IMAP mailbox management.
 * Calls server routes at /api/contacts/mailboxes
 */

import { apiClient } from '@/lib/db';

const API_BASE = '/api/contacts/mailboxes';

/** Same as apiClient but never sends cookies (cross-origin API host). */
function mailboxApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
    return apiClient<T>(endpoint, { ...init, credentials: 'omit' });
}

export interface MailboxItem {
    id: string;
    label: string;
    host: string;
    port: number;
    tls: boolean;
    user: string;
    has_password: boolean;
    has_oauth2?: boolean;
    type?: 'imap' | 'smtp';
    provider?: 'generic' | 'mailersend' | 'mailersend_api';
    status?: 'ok' | 'error' | 'pending' | 'syncing' | 'synced';
    lastTestedAt?: string;
    lastError?: string | null;
}

export interface MailboxInput {
    id?: string;
    label: string;
    host: string;
    port: number;
    tls: boolean;
    user: string;
    password?: string;
    type?: 'imap' | 'smtp';
    provider?: 'generic' | 'mailersend' | 'mailersend_api';
}

export async function listMailboxes(): Promise<MailboxItem[]> {
    return mailboxApi<MailboxItem[]>(API_BASE);
}

export async function saveMailbox(input: MailboxInput): Promise<MailboxItem> {
    return mailboxApi<MailboxItem>(API_BASE, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function deleteMailbox(id: string): Promise<void> {
    await mailboxApi<{ ok: boolean }>(`${API_BASE}/${id}`, { method: 'DELETE' });
}

export async function testMailbox(id: string): Promise<{ ok: boolean; error?: string }> {
    return mailboxApi<{ ok: boolean; error?: string }>(`${API_BASE}/${id}/test`, {
        method: 'POST',
    });
}

export async function testSendMailbox(
    id: string,
    input: { to: string; subject?: string; message?: string }
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
    return mailboxApi<{ ok: boolean; messageId?: string; error?: string }>(`${API_BASE}/${id}/test-send`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function getGmailAuthUrl(): Promise<{ url: string }> {
    return mailboxApi<{ url: string }>(`${API_BASE}/gmail/authorize`);
}

export async function syncMailbox(
    id: string,
    options: { groupId?: string; deepScan?: boolean }
): Promise<{ status: string }> {
    return mailboxApi<{ status: string }>(`${API_BASE}/${id}/sync`, {
        method: 'POST',
        body: JSON.stringify(options),
    });
}

export async function stopSyncMailbox(id: string): Promise<{ ok: boolean }> {
    return mailboxApi<{ ok: boolean }>(`${API_BASE}/${id}/sync-stop`, {
        method: 'POST',
    });
}

export async function resetSyncMailbox(id: string): Promise<{ ok: boolean }> {
    return mailboxApi<{ ok: boolean }>(`${API_BASE}/${id}/sync-reset`, {
        method: 'POST',
    });
}
