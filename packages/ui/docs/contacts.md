# Contacts

User-managed address book — vCard-compatible contacts, groups, import/export, and flexible `meta` jsonb.

## Architecture Overview

```
┌──────────────────────────────────────┐
│  Frontend                            │
│  ContactsManager.tsx                 │
│  (MUI DataGrid, batch bar, dialogs) │
│                                      │
│  client-contacts.ts                  │
│  (fetch wrappers, bearer token)      │
└──────────────┬───────────────────────┘
               │ /api/contacts/*
               ▼
┌──────────────────────────────────────┐
│  Server – ContactsProduct            │
│  products/contacts/index.ts          │
│  products/contacts/routes.ts         │
└──────────────┬───────────────────────┘
               │ Supabase
               ▼
┌──────────────────────────────────────┐
│  Tables                              │
│  contacts                            │
│  contact_groups                      │
│  contact_group_members               │
└──────────────────────────────────────┘
```

## Database

### `contacts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `owner_id` | uuid | FK → `auth.users`, not null |
| `name` | text | Full display name |
| `first_name` | text | — |
| `last_name` | text | — |
| `emails` | jsonb | Array of `{ email, label?, primary? }` objects |
| `phone` | text | Primary phone |
| `organization` | text | Company / org name |
| `title` | text | Job title |
| `address` | jsonb | Array of `{ street, city, state, postal_code, country, label? }` |
| `source` | text | Origin of contact (`cscart`, `import`, `manual`, …) |
| `language` | text | Preferred language tag (`en`, `de`, …) |
| `status` | text | `active` / `unsubscribed` / `bounced` / `blocked` |
| `notes` | text | Free-form notes |
| `tags` | text[] | Searchable tags |
| `log` | jsonb | Audit / event log array `[{ at, event, data }]` |
| `meta` | jsonb | Arbitrary extra fields (vCard extensions, etc.) |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Indexes:** `owner_id`, `status`, `source`, `language`, `tags` (GIN), `emails` (GIN)

### `contact_groups`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `owner_id` | uuid | FK → `auth.users` |
| `name` | text | not null |
| `description` | text | — |
| `meta` | jsonb | e.g. color, icon |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

### `contact_group_members`

| Column | Type | Notes |
|--------|------|-------|
| `group_id` | uuid | FK → `contact_groups` |
| `contact_id` | uuid | FK → `contacts` |
| `added_at` | timestamptz | — |
| PK | composite | (`group_id`, `contact_id`) |

### RLS

- **Owners**: full CRUD on their own rows (`owner_id = auth.uid()`)
- **Admins** (`user_roles.role = 'admin'`): full access to all rows

## Server API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/contacts` | Auth | List contacts. Query: `?group=<id>&q=<search>&status=<status>&limit=&offset=` |
| `POST` | `/api/contacts` | Auth | Create contact |
| `GET` | `/api/contacts/:id` | Auth | Get single contact |
| `PATCH` | `/api/contacts/:id` | Auth | Update contact (partial) |
| `DELETE` | `/api/contacts/:id` | Auth | Delete contact |
| `POST` | `/api/contacts/import` | Auth | Bulk import JSON array or vCard text (`?format=json\|vcard`) |
| `GET` | `/api/contacts/export` | Auth | Export all contacts. Query: `?format=json\|vcard&group=<id>` |
| `GET` | `/api/contact-groups` | Auth | List groups |
| `POST` | `/api/contact-groups` | Auth | Create group |
| `PATCH` | `/api/contact-groups/:id` | Auth | Update group |
| `DELETE` | `/api/contact-groups/:id` | Auth | Delete group |
| `GET` | `/api/contact-groups/members` | Auth | List all group memberships for the user's contacts `→ { contact_id, group_id }[]` |
| `POST` | `/api/contact-groups/:id/members` | Auth | Add contacts `{ contact_ids: string[] }` `→ { added: number }` |
| `DELETE` | `/api/contact-groups/:id/members/:contactId` | Auth | Remove contact from group |

> **Route priority:** static sub-paths (`/import`, `/export`, `/members`) are registered before parameterised `:id` routes to avoid conflicts.

## Import / Export Format

### JSON (default)

```json
[
  {
    "email": "jane@example.com",
    "name": "Jane Doe",
    "first_name": "Jane",
    "last_name": "Doe",
    "phone": "+1 555 0100",
    "organization": "Acme",
    "title": "Engineer",
    "address": { "city": "Berlin", "country": "DE" },
    "tags": ["customer", "newsletter"],
    "meta": { "source": "cscart" }
  }
]
```

### vCard (format=vcard)

Standard vCard 3.0 — one `BEGIN:VCARD … END:VCARD` block per contact.
Fields mapped: `FN`, `N`, `EMAIL`, `TEL`, `ORG`, `TITLE`, `ADR`, `NOTE`, `CATEGORIES`.
Extended fields stored in `meta` as `X-PM-*` (`X-PM-LANGUAGE`, `X-PM-SOURCE`, `X-PM-STATUS`).

## Frontend Client

`src/modules/contacts/client-contacts.ts` — all functions inject the Supabase bearer token automatically via `authHeaders()`. Requests are routed through a shared `apiFetch` helper that resolves `VITE_SERVER_IMAGE_API_URL`.

```ts
// Contacts CRUD
fetchContacts(options?)        → Contact[]     // options: { group?, q?, status?, limit?, offset? }
getContact(id)                 → Contact
createContact(data)            → Contact
updateContact(id, data)        → Contact
deleteContact(id)              → void

// Import / Export
importContacts(body, format?)  → { imported: number; skipped: number }
exportContacts(options?)       → string | Contact[]  // options: { format?, group? }

// Groups CRUD
fetchContactGroups()                          → ContactGroup[]
createContactGroup(data)                      → ContactGroup
updateContactGroup(id, data)                  → ContactGroup
deleteContactGroup(id)                        → void
fetchGroupMembers()                           → { contact_id: string; group_id: string }[]
addGroupMembers(groupId, contactIds)          → { added: number }
removeGroupMember(groupId, contactId)         → void
```

### Key Types

```ts
interface ContactEmail  { email: string; label?: string; primary?: boolean }
interface ContactAddress { street?; city?; state?; postal_code?; country?; label? }
interface Contact       { id; owner_id; name?; first_name?; last_name?; emails: ContactEmail[];
                          phone?; address: ContactAddress[]; source?; language?;
                          status?: 'active'|'unsubscribed'|'bounced'|'blocked';
                          organization?; title?; notes?; tags?; log?; meta?;
                          created_at?; updated_at? }
interface ContactGroup  { id; owner_id; name; description?; meta?; created_at?; updated_at? }
```

## Frontend UI — `ContactsManager`

Full-featured management interface built with **MUI DataGrid** inside a shadcn/ui shell.

### Features

| Feature | Detail |
|---------|--------|
| **DataGrid** | Sortable, filterable columns (name, email, status, groups, tags, actions). Checkbox selection. |
| **URL state sync** | Filter, sort, column visibility and pagination models are persisted in URL search params via `gridUtils`. |
| **Toolbar filters** | Search (`q`), group dropdown, status dropdown — all reflected in URL and sent to the server. |
| **Contact dialog** | Create / edit form with email chips, tag chips, group toggles, and status select. |
| **Batch bar** | When rows are selected: set group, remove from all groups, set status, or delete. Uses `addGroupMembers`, `removeGroupMember`, `updateContact`, `deleteContact`. |
| **Import** | File picker accepts `.json` / `.vcf`, auto-detects format. |
| **Export** | Dropdown for JSON or vCard, respects active group filter. Downloads as file. |
| **Group management** | Dialog to create / delete groups. Inline in the toolbar. |

### URL Parameters

| Param | Source |
|-------|--------|
| `q` | Search input |
| `group` | Group filter dropdown |
| `status` | Status filter dropdown |
| `filter_*` | DataGrid column filters (via `gridUtils`) |
| `sort` | DataGrid sort model |
| `hidden` | DataGrid column visibility |
| `page` / `pageSize` | DataGrid pagination (defaults: 0 / 50) |

## Environment Variables

Inherits same Supabase env as the rest of the server — no additional variables required.

## Source Files

| File | Description |
|------|-------------|
| [contacts.md](contacts.md) | This document |
| [migration](../supabase/migrations/20260306120000_create_contacts.sql) | DB schema, RLS, indexes |
| [routes.ts](../server/src/products/contacts/routes.ts) | Zod-OpenAPI route definitions |
| [index.ts](../server/src/products/contacts/index.ts) | ContactsProduct handlers |
| [client-contacts.ts](../src/modules/contacts/client-contacts.ts) | Frontend fetch wrappers |
| [ContactsManager.tsx](../src/components/ContactsManager.tsx) | Main UI component (DataGrid, batch ops, dialogs) |
