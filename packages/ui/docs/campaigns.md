# Campaigns

Email campaign management — create campaigns, pick an email page template, target contact groups, and track delivery.

## Architecture Overview

```
┌──────────────────────────────────────┐
│  Frontend                            │
│  CampaignsManager.tsx                │
│  (MUI DataGrid, PagePicker, GroupPicker) │
│                                      │
│  client-campaigns.ts                 │
│  (fetch wrappers, bearer token)      │
└──────────────┬───────────────────────┘
               │ /api/campaigns/*
               ▼
┌──────────────────────────────────────┐
│  Server – CampaignsProduct           │
│  products/campaigns/index.ts         │
│  products/campaigns/routes.ts        │
└──────────────┬───────────────────────┘
               │ Supabase
               ▼
┌──────────────────────────────────────┐
│  Tables                              │
│  campaigns                           │
│  (+ marketing_emails for sends)      │
└──────────────────────────────────────┘
```

## Database

### `campaigns`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `owner_id` | uuid | FK → `auth.users`, not null |
| `name` | text | Campaign label, not null |
| `page_slug` | text | Page slug to render as email |
| `page_id` | text | Optional page UUID |
| `subject` | text | Email subject line |
| `group_ids` | uuid[] | Target contact group IDs |
| `lang` | text | Language tag (`en`, `de`, …) |
| `tracking_id` | text | Tracking param injected into URLs |
| `vars` | jsonb | Template variables (`--var-*` equivalent) |
| `status` | text | `draft` / `scheduled` / `sending` / `sent` / `failed` |
| `stats` | jsonb | `{ total, sent, failed, skipped }` |
| `scheduled_at` | timestamptz | When to send (null = manual) |
| `started_at` | timestamptz | When sending began |
| `completed_at` | timestamptz | When sending finished |
| `meta` | jsonb | Arbitrary metadata |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Indexes:** `owner_id`, `status`, `page_slug`

### RLS

- **Owners**: full CRUD on their own rows (`owner_id = auth.uid()`)
- **Admins** (`user_roles.role = 'admin'`): full access to all rows

## Server API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/campaigns` | Auth | List campaigns. Query: `?status=&q=&limit=&offset=` |
| `POST` | `/api/campaigns` | Auth | Create campaign |
| `GET` | `/api/campaigns/:id` | Auth | Get single campaign |
| `PATCH` | `/api/campaigns/:id` | Auth | Update campaign (partial) |
| `DELETE` | `/api/campaigns/:id` | Auth | Delete campaign |

## Frontend Client

`src/modules/campaigns/client-campaigns.ts` — all functions inject Supabase bearer token automatically.

```ts
fetchCampaigns(options?)   → Campaign[]   // options: { status?, q?, limit?, offset? }
getCampaign(id)            → Campaign
createCampaign(data)       → Campaign
updateCampaign(id, data)   → Campaign
deleteCampaign(id)         → void
```

## Frontend UI — `CampaignsManager`

Mounted at `/user/:id/campaigns` via `UserProfile.tsx`.

| Feature | Detail |
|---------|--------|
| **DataGrid** | Columns: name, page, status, groups, stats, created_at, actions |
| **URL state sync** | Filter, sort, visibility, pagination persisted in search params |
| **Toolbar** | Search, status filter, "New Campaign" button |
| **Campaign dialog** | Name, subject, language, tracking ID, PagePickerDialog for email page, ContactsPicker for groups |
| **Status workflow** | `draft` → `scheduled` → `sending` → `sent` / `failed` |

## Relationship to Email System

The `campaigns` table is the **parent** that defines what to send and to whom. The existing `marketing_emails` table continues to track **individual sends** per recipient. A future "Send Campaign" action will resolve group members, render the email page, and use the email tracking flow (`POST /api/email/track` → send → `PATCH /api/email/track/:id`) — the same pipeline currently used by the CLI `email-send` command.

## Environment Variables

Inherits same Supabase env as the rest of the server — no additional variables required.

## Source Files

| File | Description |
|------|-------------|
| [campaigns.md](campaigns.md) | This document |
| [migration](../supabase/migrations/20260306130000_create_campaigns.sql) | DB schema, RLS, indexes |
| [routes.ts](../server/src/products/campaigns/routes.ts) | Zod-OpenAPI route definitions |
| [index.ts](../server/src/products/campaigns/index.ts) | CampaignsProduct handlers |
| [client-campaigns.ts](../src/modules/campaigns/client-campaigns.ts) | Frontend fetch wrappers |
| [CampaignsManager.tsx](../src/components/CampaignsManager.tsx) | Main UI component (DataGrid, dialogs) |
| [ContactsPicker.tsx](../src/components/ContactsPicker.tsx) | Group selection component |
| [PagePickerDialog.tsx](../src/modules/pages/PagePickerDialog.tsx) | Page selection dialog |
