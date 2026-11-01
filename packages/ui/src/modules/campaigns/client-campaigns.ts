// ─── Types ────────────────────────────────────────────────────────────────────

import { apiClient } from '@/lib/db';

export interface Campaign {
    id: string;
    owner_id: string;
    name: string;
    page_slug?: string | null;
    page_id?: string | null;
    subject?: string | null;
    group_ids: string[];
    lang?: string | null;
    tracking_id?: string | null;
    vars?: Record<string, any>;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    stats?: { total?: number; sent?: number; failed?: number; skipped?: number };
    scheduled_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    meta?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

// ─── Campaigns CRUD ───────────────────────────────────────────────────────────

export const fetchCampaigns = async (options?: {
    status?: string;
    q?: string;
    limit?: number;
    offset?: number;
}): Promise<Campaign[]> => {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.q) params.set('q', options.q);
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.offset != null) params.set('offset', String(options.offset));
    return apiClient<Campaign[]>(`/api/campaigns?${params}`);
};

export const getCampaign = async (id: string): Promise<Campaign> => {
    return apiClient<Campaign>(`/api/campaigns/${id}`);
};

export const createCampaign = async (data: Partial<Campaign>): Promise<Campaign> => {
    return apiClient<Campaign>('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
    return apiClient<Campaign>(`/api/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const deleteCampaign = async (id: string): Promise<void> => {
    await apiClient<unknown>(`/api/campaigns/${id}`, { method: 'DELETE' });
};

export const sendCampaign = async (
    id: string,
    intervalSecs: number = 1
): Promise<{ total: number; sent: number; failed: number; skipped: number }> => {
    return apiClient<{ total: number; sent: number; failed: number; skipped: number }>(
        `/api/campaigns/${id}/send`,
        {
            method: 'POST',
            body: JSON.stringify({ interval: intervalSecs }),
        }
    );
};
