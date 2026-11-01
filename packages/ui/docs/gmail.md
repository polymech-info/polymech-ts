# Gmail / IMAP Integration

Developer reference for connecting user mailboxes via IMAP to harvest contacts.

---

## Overview

Users can connect any IMAP mailbox (Gmail, Outlook, etc.) from the **Profile → Integrations** tab. Credentials are stored encrypted within `user_secrets.settings.mailboxes` in Supabase — same row-level security as API keys.

**Phase 1 (current):** Store credentials, test connection.  
**Phase 2 (future):** Harvest sender/recipient contacts from mailbox, import into contact groups.  
**Phase 3 (future):** OAuth2 flow for Gmail (no App Password needed).

---

## Gmail App Password Setup (Required for Phase 1)

Standard Gmail passwords won't work over IMAP if 2FA is enabled. Users must generate an **App Password**:

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already on
3. Go to **App passwords** → Select app: *Mail*, device: *Other (custom name)*
4. Copy the generated 16-character password

IMAP settings for Gmail:
- **Host:** `imap.gmail.com`
- **Port:** `993`
- **TLS:** true (IMAPS)
- **Auth:** plain (user + App Password)

---

## Credential Storage Schema

Mailboxes are stored in `user_secrets.settings.mailboxes` as a JSON array:

```ts
interface MailboxCredential {
  id: string;           // uuid, generated on save
  label: string;        // user-facing name e.g. "Work Gmail"
  host: string;         // imap.gmail.com
  port: number;         // 993
  tls: boolean;         // always true for Gmail
  user: string;         // email@gmail.com
  password: string;     // App Password (stored as-is, protected by Supabase RLS)
  status?: 'ok' | 'error' | 'pending';
  lastTestedAt?: string; // ISO datetime
  lastError?: string;
}
```

No plaintext encryption beyond Supabase's column-level storage. The password is **never returned** from the API — only `has_password: boolean` and `user` are exposed.

---

## API Routes

All routes require `Authorization: Bearer <jwt>` header.

### `GET /api/contacts/mailboxes`
List connected mailboxes for the current user. Password is masked.

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "Work Gmail",
    "host": "imap.gmail.com",
    "port": 993,
    "tls": true,
    "user": "user@gmail.com",
    "has_password": true,
    "status": "ok",
    "lastTestedAt": "2026-03-06T12:00:00Z"
  }
]
```

### `POST /api/contacts/mailboxes`
Save or update a mailbox credential.

**Body:**
```json
{
  "id": "optional-uuid-for-update",
  "label": "Work Gmail",
  "host": "imap.gmail.com",
  "port": 993,
  "tls": true,
  "user": "user@gmail.com",
  "password": "abcd efgh ijkl mnop"
}
```

**Response:** Masked mailbox object (same as GET item).

### `DELETE /api/contacts/mailboxes/:id`
Remove a mailbox by ID.

**Response:** `{ "ok": true }`

### `POST /api/contacts/mailboxes/:id/test`
Test an IMAP connection using saved credentials. Does not modify stored data but updates `status` and `lastTestedAt`.

**Response:**
```json
{ "ok": true }
// or
{ "ok": false, "error": "Invalid credentials" }
```

---

## Server Implementation

Located in `server/src/products/contacts/`:

- **`imap-handler.ts`** — business logic using `imapflow`
- **`imap-routes.ts`** — route definitions (Hono/Zod OpenAPI)
- **`index.ts`** — routes registered in `ContactsProduct.initializeRoutes()`

### imapflow connection pattern

```ts
import { ImapFlow } from 'imapflow';

const client = new ImapFlow({
  host: creds.host,
  port: creds.port,
  secure: creds.tls,
  auth: { user: creds.user, pass: creds.password },
  logger: false,
});
await client.connect();
await client.logout();
```

---

## Environment Variables

No additional env vars required for Phase 1 (credentials are per-user in Supabase).

**Future OAuth2 vars (Phase 3):**
```env
# Google OAuth2 for Gmail IMAP access
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

---

## Security Notes

- Passwords are stored in `user_secrets` which has Supabase Row Level Security allowing only the owner to read their own row
- Server API never returns the password field — only `has_password: true`
- Test connection is server-side only; credentials are never sent to the browser after initial save
- In future Phase 3, App Password flow is replaced by OAuth2 refresh tokens (no password stored at all)

---

## Frontend

Component: `src/components/GmailIntegrations.tsx`  
Client module: `src/modules/contacts/client-mailboxes.ts`  
Profile tab: `Profile.tsx` → `/profile/integrations`

---

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Store IMAP credentials, test connection | ✅ Current |
| 2 | Harvest contacts from sent/received emails | 🔜 Planned |
| 3 | OAuth2 for Gmail (no App Password) | 🔜 Planned |
| 4 | Scheduled background sync, dedup contacts | 🔜 Planned |
