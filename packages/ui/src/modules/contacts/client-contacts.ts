import { fetchWithDeduplication, serverUrl } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactEmail {
    email: string;
    label?: string;
    primary?: boolean;
}

export interface ContactAddress {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    label?: string;
}

export interface Contact {
    id: string;
    owner_id: string;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    emails: ContactEmail[];
    phone?: string | null;
    address: ContactAddress[];
    source?: string | null;
    language?: string | null;
    status?: 'active' | 'unsubscribed' | 'bounced' | 'blocked';
    organization?: string | null;
    title?: string | null;
    notes?: string | null;
    tags?: string[] | null;
    log?: any;
    meta?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export interface ContactGroup {
    id: string;
    owner_id: string;
    name: string;
    description?: string | null;
    meta?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function authHeaders(contentType?: string): Promise<HeadersInit> {
    const { getAuthToken } = await import('@/lib/db');
    const token = await getAuthToken();
    const h: HeadersInit = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (contentType) h['Content-Type'] = contentType;
    return h;
}

const SERVER_URL = serverUrl;

async function apiFetch(path: string, init?: RequestInit) {
    const url = SERVER_URL ? `${SERVER_URL}${path}` : path;
    const res = await fetch(url, init);
    if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        throw new Error(`${path} — ${res.status}: ${err}`);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('json') ? res.json() : res.text();
}

// ─── Contacts CRUD ────────────────────────────────────────────────────────────

export const fetchContacts = async (options?: {
    group?: string;
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<Contact[]> => {
    const params = new URLSearchParams();
    if (options?.group) params.set('group', options.group);
    if (options?.q) params.set('q', options.q);
    if (options?.status) params.set('status', options.status);
    if (options?.limit != null) params.set('limit', String(options.limit));
    if (options?.offset != null) params.set('offset', String(options.offset));

    return fetchWithDeduplication(`contacts-list-${params.toString()}`, async () => {
        const headers = await authHeaders();
        return apiFetch(`/api/contacts?${params}`, { headers });
    });
};

export const createContact = async (data: Partial<Contact>): Promise<Contact> => {
    return apiFetch('/api/contacts', {
        method: 'POST',
        headers: await authHeaders('application/json'),
        body: JSON.stringify(data),
    });
};

export const getContact = async (id: string): Promise<Contact> => {
    return fetchWithDeduplication(`contact-${id}`, async () => {
        const headers = await authHeaders();
        return apiFetch(`/api/contacts/${id}`, { headers });
    });
};

export const updateContact = async (id: string, data: Partial<Contact>): Promise<Contact> => {
    return apiFetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: await authHeaders('application/json'),
        body: JSON.stringify(data),
    });
};

export const deleteContact = async (id: string): Promise<void> => {
    await apiFetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
    });
};

export const batchDeleteContacts = async (ids: string[]): Promise<{ deleted: number }> => {
    return apiFetch('/api/contacts/batch-delete', {
        method: 'POST',
        headers: await authHeaders('application/json'),
        body: JSON.stringify({ ids }),
    });
};

// ─── Import / Export ──────────────────────────────────────────────────────────

export const importContacts = async (
    body: Contact[] | string,
    format: 'json' | 'vcard' = 'json',
    groupId?: string
): Promise<{ imported: number; skipped: number }> => {
    const isJson = format === 'json';
    const qs = new URLSearchParams();
    qs.set('format', format);
    if (groupId) qs.set('group_id', groupId);

    return apiFetch(`/api/contacts/import?${qs.toString()}`, {
        method: 'POST',
        headers: await authHeaders(isJson ? 'application/json' : 'text/vcard'),
        body: isJson ? JSON.stringify(body) : (body as string),
    });
};

export const exportContacts = async (options?: {
    format?: 'json' | 'vcard';
    group?: string;
    ids?: string[];
}): Promise<string | Contact[]> => {
    const params = new URLSearchParams();
    if (options?.format) params.set('format', options.format);
    if (options?.group) params.set('group', options.group);
    if (options?.ids?.length) params.set('ids', options.ids.join(','));
    return apiFetch(`/api/contacts/export?${params}`, { headers: await authHeaders() });
};

// ─── Groups ───────────────────────────────────────────────────────────────────

export const fetchContactGroups = async (): Promise<ContactGroup[]> => {
    return fetchWithDeduplication('contact-groups', async () => {
        const headers = await authHeaders();
        return apiFetch('/api/contact-groups', { headers });
    });
};

export const createContactGroup = async (data: Pick<ContactGroup, 'name'> & Partial<ContactGroup>): Promise<ContactGroup> => {
    return apiFetch('/api/contact-groups', {
        method: 'POST',
        headers: await authHeaders('application/json'),
        body: JSON.stringify(data),
    });
};

export const updateContactGroup = async (id: string, data: Partial<ContactGroup>): Promise<ContactGroup> => {
    return apiFetch(`/api/contact-groups/${id}`, {
        method: 'PATCH',
        headers: await authHeaders('application/json'),
        body: JSON.stringify(data),
    });
};

export const deleteContactGroup = async (id: string): Promise<void> => {
    await apiFetch(`/api/contact-groups/${id}`, {
        method: 'DELETE',
        headers: await authHeaders(),
    });
};

export const addGroupMembers = async (groupId: string, contactIds: string[]): Promise<{ added: number }> => {
    return apiFetch(`/api/contact-groups/${groupId}/members`, {
        method: 'POST',
        headers: await authHeaders('application/json'),
        body: JSON.stringify({ contact_ids: contactIds }),
    });
};

/** Returns all group memberships for the current user's contacts as {contact_id, group_id} rows. */
export const fetchGroupMembers = async (): Promise<{ contact_id: string; group_id: string }[]> => {
    return fetchWithDeduplication('contact-group-members', async () => {
        const headers = await authHeaders();
        return apiFetch('/api/contact-groups/members', { headers });
    });
};

export const removeGroupMember = async (groupId: string, contactId: string): Promise<void> => {
    await apiFetch(`/api/contact-groups/${groupId}/members/${contactId}`, {
        method: 'DELETE',
        headers: await authHeaders(),
    });
};
