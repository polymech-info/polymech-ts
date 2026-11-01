/**
 * Admin API helpers for managed sites (`/api/admin/sites`).
 * Mirrors the server schema in `public.managed_sites` + `public.managed_site_events`.
 */

import { apiClient } from '@/lib/db';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SiteStatus = 'active' | 'provisioning' | 'suspended' | 'archived';

export interface ManagedSite {
    id: string;
    name: string;
    display_name: string | null;
    admin_email: string | null;
    contact_email: string | null;
    domain: string;
    service_url: string | null;
    client_url: string | null;
    infrastructure_dir: string | null;
    plesk_target: string | null;
    ssh_host: string | null;
    dns_zone: string | null;
    service_user: string | null;
    status: SiteStatus;
    settings: Record<string, unknown>;
    meta: Record<string, unknown>;
    plesk: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface CreateSitePayload {
    name: string;
    display_name?: string | null;
    admin_email?: string | null;
    contact_email?: string | null;
    domain: string;
    service_url?: string | null;
    client_url?: string | null;
    infrastructure_dir?: string | null;
    plesk_target?: string | null;
    ssh_host?: string | null;
    dns_zone?: string | null;
    service_user?: string | null;
    status?: SiteStatus;
    settings?: Record<string, unknown>;
    meta?: Record<string, unknown>;
}

export type UpdateSitePayload = Partial<Omit<CreateSitePayload, 'name'> & {
    plesk?: Record<string, unknown>;
}>;

export interface SiteEvent {
    id: number;
    site_id: string;
    event_type: string;
    step: string | null;
    status: string;
    message: string | null;
    detail: Record<string, unknown> | null;
    log_file: string | null;
    triggered_by: string | null;
    created_at: string;
}

export interface RunGeneratorPayload {
    config?: string;
    vars?: Record<string, string>;
    steps?: Record<string, boolean>;
    dryRun?: boolean;
    logFile?: string;
}

export interface GeneratorStepResult {
    ok: boolean;
    logFile: string;
    error?: string;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fetchSites(): Promise<ManagedSite[]> {
    return apiClient<ManagedSite[]>('/api/admin/sites');
}

export async function fetchSite(name: string): Promise<ManagedSite> {
    return apiClient<ManagedSite>(`/api/admin/sites/${encodeURIComponent(name)}`);
}

export async function createSite(payload: CreateSitePayload): Promise<ManagedSite> {
    return apiClient<ManagedSite>('/api/admin/sites', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function updateSite(name: string, payload: UpdateSitePayload): Promise<ManagedSite> {
    return apiClient<ManagedSite>(`/api/admin/sites/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export async function deleteSite(name: string): Promise<boolean> {
    try {
        await apiClient(`/api/admin/sites/${encodeURIComponent(name)}`, { method: 'DELETE' });
        return true;
    } catch {
        return false;
    }
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function fetchSiteEvents(name: string, limit = 50): Promise<SiteEvent[]> {
    return apiClient<SiteEvent[]>(
        `/api/admin/sites/${encodeURIComponent(name)}/events?limit=${limit}`,
    );
}

// ── Plesk import ──────────────────────────────────────────────────────────────

export async function importPleskJson(name: string): Promise<{ ok: boolean; fqdn?: string }> {
    return apiClient<{ ok: boolean; fqdn?: string }>(
        `/api/admin/sites/${encodeURIComponent(name)}/plesk/import`,
        { method: 'POST', body: JSON.stringify({}) },
    );
}

// ── Generator pipeline ────────────────────────────────────────────────────────

export async function runSiteGenerator(payload: RunGeneratorPayload): Promise<GeneratorStepResult> {
    return apiClient<GeneratorStepResult>('/api/admin/sites/generate/run', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ── Individual pipeline steps ─────────────────────────────────────────────────

/** Map of step id → endpoint path suffix */
const STEP_PATHS: Record<string, string> = {
    'backup-master':        '/api/admin/sites/generate/steps/backup-master',
    'db-import':            '/api/admin/sites/generate/steps/db-import',
    'plesk-app-create':     '/api/admin/sites/generate/steps/plesk-app-create',
    'plesk-app-ftp-ensure': '/api/admin/sites/generate/steps/plesk-app-ftp-ensure',
    'plesk-ssl-issue':      '/api/admin/sites/generate/steps/plesk-ssl-issue',
    'plesk-app-sync':       '/api/admin/sites/generate/steps/plesk-app-sync',
    'patch-config':         '/api/admin/sites/generate/steps/patch-config',
    'plesk-create-service': '/api/admin/sites/generate/steps/plesk-create-service',
    'plesk-apache-deploy':  '/api/admin/sites/generate/steps/plesk-apache-deploy',
    'hetzner-dns-a-upsert': '/api/admin/sites/generate/steps/hetzner-dns-a-upsert',
    'zitadel-setup':        '/api/admin/sites/generate/steps/zitadel-setup',
};

export async function runPipelineStep(
    stepId: string,
    args: Record<string, unknown>,
): Promise<GeneratorStepResult> {
    const path = STEP_PATHS[stepId];
    if (!path) throw new Error(`Unknown step: ${stepId}`);
    return apiClient<GeneratorStepResult>(path, {
        method: 'POST',
        body: JSON.stringify(args),
    });
}
