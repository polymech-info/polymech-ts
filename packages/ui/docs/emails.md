# Email System

Newsletter and marketing email pipeline — from page rendering to delivery and tracking.

## Architecture Overview

```
┌──────────────┐     fetch HTML     ┌──────────────────┐
│  CLI         │ ──────────────────>│  Server           │
│  email-send  │     /email-preview │  (pages-email.ts) │
│              │<───────────────────│                    │
│  sends via   │     rendered HTML  └──────────────────┘
│  @polymech/  │
│  mail        │── POST /track ───> ┌──────────────────┐
│              │<── {id, token} ──  │  Server API       │
│              │── PATCH /track/:id │  (EmailProduct)   │
│              │                    │  → marketing_emails│
└──────────────┘                    └──────────────────┘
```

**Flow:**
1. CLI authenticates with Supabase (get bearer token)
2. Optionally filters unsubscribed (`--check-unsubs`) and already-sent (`--check-sent`) recipients
3. Fetches rendered email HTML from server (`/user/:id/pages/:slug/email-preview`)
4. Applies `--var-*` template variables (`keep=true` to preserve `${unsubscribe}`)
5. Injects tracking parameters into all links/images (via cheerio)
6. For each recipient:
   - `POST /api/email/track` → creates pending row, returns `{id, unsubscribe_token}`
   - Substitutes `${unsubscribe}` with per-recipient unsubscribe URL
   - Sends via `@polymech/mail` (nodemailer, `newsletter` transport)
   - `PATCH /api/email/track/:id` → updates status to `sent`/`failed`

## CLI Usage

```bash
pm-cli-cms email-send --page-slug <slug> [options]
```

### Required

| Arg | Description |
|-----|-------------|
| `--page-slug` | Page slug to render as email |

### Optional

| Arg | Default | Description |
|-----|---------|-------------|
| `--user` | `cgo` | User identifier (username or UUID) |
| `--subject` | `Newsletter Polymech - DD:HH:mm` | Email subject line |
| `--recipient` | `cgoflyn@gmail.com` | Single email or path to `.json` contacts file |
| `--targethost` | `https://service.polymech.info` | Server base URL |
| `--lang` | — | Language tag for translated content |
| `--dry` | `false` | Log actions without sending |
| `--tracking` | `mail-DD-HH-mm` | Tracking param appended to all href/src URLs |
| `--campaign` | — | Campaign identifier string |
| `--check-unsubs` | `false` | Query DB and skip unsubscribed recipients |
| `--check-sent` | `false` | Skip recipients already sent to (matches email + campaign + subject) |
| `--var-<key>` | — | Template variable: `--var-name=hobbit` → `${name}` becomes `hobbit` |

### Examples

```bash
# Basic send
pm-cli-cms email-send --page-slug newsletter-march

# Send to contacts file with campaign tracking
pm-cli-cms email-send --page-slug newsletter-march \
  --recipient ./ref/cscart-contacts.json \
  --campaign spring-2026 \
  --var-emailName "Dear Customer"

# Dry run with language override
pm-cli-cms email-send --page-slug newsletter-march \
  --dry --lang de

# Full safety checks (skip unsubs + already sent)
pm-cli-cms email-send --page-slug newsletter-march \
  --recipient ./ref/cscart-contacts.json \
  --campaign spring-2026 \
  --check-unsubs --check-sent

# Send to a single recipient
pm-cli-cms email-send --page-slug email-2026 --targethost http://localhost:3333/ --var-emailName "Hobbit Ex" --subject test2 --campaign=test2222 --lang=de

```

## Contacts File Format

JSON array with `email` and optional `name` fields (e.g. CS-Cart export):

```json
[
  { "email": "user@example.com", "name": "John", "Language": "en" },
  { "email": "other@example.com", "name": "Jane", "Language": "de" }
]
```

Object format (legacy):
```json
{
  "contact1": { "email": "user@example.com" },
  "contact2": { "email": "other@example.com" }
}
```

Only entries with a non-empty `email` field are used. See [`cli-ts/ref/cscart-contacts.json`](../cli-ts/ref/cscart-contacts.json) for a real example.

## Template Variables

The server renders email HTML with `substitute()` from `@polymech/commons/variables`. Unresolved `${key}` patterns are preserved (`keep=true`) so the CLI can resolve them client-side.

Pass variables via `--var-<key>=<value>`:

```bash
--var-emailName "John Doe" --var-company "Acme Inc"
```

This replaces `${emailName}` and `${company}` in the rendered HTML.

**Reserved variable:** `${unsubscribe}` — auto-substituted per recipient with the unsubscribe URL. Do not pass this via `--var-*`.

## Tracking

Every `<a href>` and `<img src>` in the email gets `?tracking=<value>` appended (via cheerio DOM manipulation). Defaults to `mail-DD-HH-mm` timestamp.

The tracking ID is also stored in `marketing_emails.tracking_id`.

## Server API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/email/unsubscribe/:token` | None | Marks recipient as unsubscribed |
| `POST` | `/api/email/track` | Admin | Creates pending tracking row, returns `{id, unsubscribe_token}` |
| `PATCH` | `/api/email/track/:id` | Admin | Updates row status (`sent`/`failed`/`bounced`) |
| `GET` | `/api/render/email/:id` | Auth | Renders email HTML for a post |
| `POST` | `/api/send/email/:id` | Auth | Generates and sends email for a post |

## Database: `marketing_emails`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, auto-generated |
| `name` | text | Contact name |
| `email` | text | **not null** |
| `status` | text | `pending` / `sent` / `failed` / `bounced` |
| `sent_at` | timestamptz | When successfully sent |
| `page_slug` | text | **not null** |
| `subject` | text | Email subject |
| `tracking_id` | text | Tracking tag |
| `campaign` | text | Campaign identifier |
| `lang` | text | Language used |
| `error_message` | text | Failure reason |
| `retry_count` | int | Send attempts (default 0) |
| `last_retry_at` | timestamptz | Last retry timestamp |
| `sender_id` | uuid | FK → `auth.users` |
| `from_address` | text | Sender email |
| `unsubscribed` | boolean | Default `false` |
| `unsubscribed_at` | timestamptz | When unsubscribed |
| `unsubscribe_token` | uuid | Auto-generated, used in unsubscribe links |
| `meta` | jsonb | Flexible metadata (vars, targethost) |

**Indexes:** `email`, `status`, `page_slug`, `tracking_id`, `campaign`, `unsubscribe_token`

**Migration:** [`supabase/migrations/20260302163400_create_marketing_emails.sql`](../supabase/migrations/20260302163400_create_marketing_emails.sql)

## Unsubscribe

### Flow

1. CLI inserts a `pending` row via `POST /api/email/track` → gets `unsubscribe_token`
2. CLI substitutes `${unsubscribe}` in HTML with `targethost/api/email/unsubscribe/<token>`
3. Email is sent with the per-recipient unsubscribe URL
4. Recipient clicks → `GET /api/email/unsubscribe/:token` → sets `unsubscribed=true`, shows confirmation

### Template

The unsubscribe link lives in [`public/widgets/email-clean/social_links.html`](../public/widgets/email-clean/social_links.html):

```html
<a href="${unsubscribe}">Unsubscribe</a>
```

### RLS

- **Admins**: full access to all rows
- **Authenticated users**: can view rows matching their email
- **Anonymous**: can update `unsubscribed=true` only (via token)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✓ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✓ | Supabase anon/publishable key |
| `ADMIN_EMAIL` | ✓ | Admin email for auth |
| `ADMIN_PASSWORD` | ✓ | Admin password for auth |
| `TEST_EMAIL_FROM` | — | Sender address (default: `newsletter@osr-plastic.org`) |

## Source Files

| File | Description |
|------|-------------|
| [email-send.ts](../cli-ts/src/lib/email-send.ts) | Core library: auth, fetch, substitute, track, send |
| [send.ts](../cli-ts/src/commands/email/send.ts) | CLI wrapper (yargs args, var extraction) |
| [index.ts](../server/src/products/email/index.ts) | Server EmailProduct (render, send, track, unsubscribe) |
| [routes.ts](../server/src/products/email/routes.ts) | Route definitions (zod-openapi) |
| [pages-email.ts](../server/src/products/serving/pages/pages-email.ts) | Page → email HTML renderer |
| [social_links.html](../public/widgets/email-clean/social_links.html) | Email footer template (social icons + unsubscribe) |
| [nodemailer/index.ts](../../polymech-mono/packages/mail/src/lib/nodemailer/index.ts) | `@polymech/mail` transport wrapper |
