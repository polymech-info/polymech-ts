# Security Architecture — Polymech

Polymech implements a layered security model that covers authentication, authorization, threat mitigation, and observability. Every layer is configurable via environment variables and manageable through admin APIs.

---

## Table of Contents

- [Authentication](#authentication)
- [Authorization & Access Control](#authorization--access-control)
- [Threat Mitigation](#threat-mitigation)
- [Transport Security](#transport-security)
- [Observability & Auditing](#observability--auditing)
- [Admin API](#admin-api)
- [Configuration Reference](#configuration-reference)

---

## Authentication

### JWT Bearer Tokens

All authenticated requests use Supabase-issued JWTs via the `Authorization: Bearer <token>` header. The server validates tokens through Supabase's `auth.getUser()`, with results cached in-memory to avoid repeated round-trips.

### Three Authentication Modes

The server provides three middleware layers that can be composed per-route:

| Middleware | Behavior |
|-----------|----------|
| **`authMiddleware`** | **Strict** — rejects any request without a valid Bearer token. Returns `401` immediately. |
| **`optionalAuthMiddleware`** | **Flexible** — resolves the user if a token is present, but allows unauthenticated access to public endpoints. Respects `REQUIRE_AUTH` env var for non-public routes. Also supports token via `?token=` query param (for SSE streams). |
| **`adminMiddleware`** | **Role-based** — checks `user_roles` table for `role = 'admin'`. Returns `403 Forbidden` if the user lacks admin privileges. Only applies to routes registered in `AdminEndpointRegistry`. |

### Request Flow

```
Request → CORS → Blocklist → Auto-Ban → Analytics → optionalAuthMiddleware → adminMiddleware → Rate Limiter → Body Limit → Route Handler
```

1. **CORS** validates origin against env-driven allowlist
2. **Blocklist** checks manual blocklist (`config/blocklist.json`)
3. **Auto-Ban** checks automatic ban list (`config/ban.json`)
4. **Analytics** logs the request (non-blocking)
5. **Optional Auth** resolves user identity if token present; validates JWT `exp` claim and caches for 30s
6. **Admin Check** enforces admin-only on registered admin routes
7. **Rate Limiter** enforces `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` per IP/user
8. **Body Limit** enforces `MAX_UPLOAD_SIZE` (default 10MB) on all API requests
9. **Route Handler** executes with `c.get('userId')`, `c.get('user')`, and `c.get('isAdmin')` available

---

## Authorization & Access Control

### Route-Level Access Control

Routes are classified at definition time using decorators:

```typescript
// In route definitions:
Public(route)  // Registers in PublicEndpointRegistry → no auth required
Admin(route)   // Registers in AdminEndpointRegistry → admin role required
```

The `PublicEndpointRegistry` and `AdminEndpointRegistry` use pattern matching (supporting `:param` and `{param}` styles) to determine access at runtime. This means authorization is declarative — defined alongside the route, not scattered across middleware.

### Public Endpoints

All SEO and content delivery routes are public by default:

- `/feed.xml`, `/products.xml`, `/sitemap-en.xml`, `/llms.txt`
- `/post/:id.xhtml`, `/post/:id.pdf`, `/post/:id.md`, `/post/:id.json`
- `/user/:id/pages/:slug.xhtml`, `.html`, `.pdf`, `.md`, `.json`, `.email.html`
- `/api/posts/:id`, `/api/feed`, `/api/profiles`, `/api/media-items`
- `/embed/:id`, `/embed/page/:id`

### Admin-Only Endpoints

Privileged operations require both authentication and the `admin` role:

| Endpoint | Description |
|----------|-------------|
| `POST /api/admin/system/restart` | Graceful server restart |
| `GET /api/admin/bans` | View current ban list |
| `POST /api/admin/bans/unban-ip` | Remove an IP ban |
| `POST /api/admin/bans/unban-user` | Remove a user ban |
| `GET /api/admin/bans/violations` | View violation statistics |
| `POST /api/flush-cache` | Flush all server caches |
| `GET /api/analytics` | View request analytics |
| `DELETE /api/analytics` | Clear analytics data |
| `GET /api/analytics/stream` | Live analytics stream (SSE) |

### VFS (Virtual File System) ACL

The Storage product implements a full ACL system for its virtual file system:

- **Mounts** — isolated storage namespaces with per-mount access control
- **Grants** — explicit read/write permissions per user per mount
- **Revocations** — ability to revoke access without deleting the mount
- **Glob-based queries** — file listing supports `glob` patterns, scoped to authorized mounts

### Supabase RLS

Database-level security is enforced through PostgreSQL Row-Level Security:

- `user_roles` — scoped by `auth.uid() = user_id`
- `user_secrets` — API keys never exposed through public endpoints; accessed via `/api/me/secrets` proxy with masked GET and server-proxied PUT
- Content tables — owner-based access with collaboration extensions

### Secrets Management

API keys (OpenAI, Google, etc.) are stored in `user_secrets` and never returned in cleartext from any endpoint. The `/api/me/secrets` proxy returns masked values (last 4 characters only) with a `has_key` boolean indicator. Client code never accesses `user_secrets` directly.

### CSRF Protection

Bearer token auth via `Authorization` header is inherently CSRF-proof — browsers cannot attach custom headers in cross-origin form submissions. No CSRF tokens are needed.

---

## Threat Mitigation

### Blocklist (Manual)

The `blocklist.json` file in `/config/` provides static blocking of known bad actors:

```json
{
  "blockedIPs": ["203.0.113.50"],
  "blockedUserIds": ["malicious-user-uuid"],
  "blockedTokens": ["compromised-jwt-token"]
}
```

The blocklist is loaded on startup and checked for every API request. Blocked entities receive `403 Forbidden`.

### Auto-Ban (Automatic)

The auto-ban system tracks violations in-memory and automatically bans entities that exceed configurable thresholds:

**How it works:**

1. Rate limit violations are recorded per IP or user key
2. When violations exceed `AUTO_BAN_THRESHOLD` (default: 5) within `AUTO_BAN_WINDOW_MS` (default: 10s), the entity is permanently banned
3. Bans are persisted to `config/ban.json` and survive server restarts
4. Old violation records are cleaned up periodically (`AUTO_BAN_CLEANUP_INTERVAL_MS`)

**What gets tracked:**

- Repeated rate limit violations
- Repeated auth failures
- Suspicious request patterns

**Ban types:**

| Type | Scope |
|------|-------|
| IP ban | Blocks all requests from the IP |
| User ban | Blocks all requests from the user ID |
| Token ban | Blocks requests with a specific JWT |

### Rate Limiting

Rate limiting uses `hono-rate-limiter` with configurable windows and limits:

- **Global API limiter** — `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` (applied to `/api/*`)
- **Custom per-endpoint limiters** — `createCustomRateLimiter(limit, windowMs)` for endpoints needing different thresholds
- **Key generation** — rate limits are tracked per authenticated user (if token present) or per IP (fallback)
- **Standard headers** — responses include `RateLimit-*` headers (draft-6 spec)
- **Violation escalation** — rate limit violations are forwarded to the auto-ban system

---

## Transport Security

### Secure Headers

Applied globally via Hono's `secureHeaders` middleware:

| Header | Value | Rationale |
|--------|-------|-----------|
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | 1-year HSTS, enforces HTTPS |
| **X-Frame-Options** | `SAMEORIGIN` | Clickjacking protection (relaxed for `/embed/*` routes) |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Preserves analytics referrer data same-origin, protects privacy cross-origin |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=(self)` | Restricts unused browser features; payment allowed for Stripe |
| **Content-Security-Policy** | See below | Full directive set protecting against XSS |
| **Cross-Origin-Resource-Policy** | Disabled | Media assets served cross-origin |
| **Cross-Origin-Embedder-Policy** | Disabled | Compatibility with external image/video sources |
| **Cross-Origin-Opener-Policy** | Disabled | No popup isolation needed |

#### Embed Route Override

Routes under `/embed/*` strip `X-Frame-Options` and widen `frame-ancestors` to `*`, allowing external sites to iframe embed widgets while keeping all other routes protected against clickjacking.

#### CSP Directives

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Baseline deny-all |
| `script-src` | `'self' 'nonce-<per-request>' cdn.jsdelivr.net` | Nonce-based inline script execution + Scalar UI |
| `style-src` | `'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net` | Google Fonts CSS + Scalar UI (`unsafe-inline` required for dynamic styles) |
| `font-src` | `'self' fonts.gstatic.com cdn.jsdelivr.net fonts.scalar.com` | Google Fonts + Scalar fonts |
| `img-src` | `'self' data: blob: *.supabase.co *.polymech.info` | Supabase Storage + CDN assets |
| `connect-src` | `'self' *.supabase.co wss://*.supabase.co api.openai.com assets.polymech.info cdn.jsdelivr.net proxy.scalar.com` | API, Realtime, AI, Scalar |
| `media-src` | `'self' blob: *.supabase.co assets.polymech.info stream.mux.com` | Video/audio sources |
| `frame-src` | `'self' *.supabase.co` | Supabase Auth popup |
| `frame-ancestors` | `'self'` | Default: same-origin only (relaxed to `*` for `/embed/*`) |
| `object-src` | `'none'` | Block Flash/Java |
| `base-uri` | `'self'` | Prevent base-tag hijacking |

### Compression

All responses are compressed with Brotli/gzip via `hono/compress`, reducing payload sizes and improving TTFB.

### CORS

CORS origin validation is driven by `CORS_ORIGINS` env var:

```
# Production — only listed origins get Access-Control-Allow-Origin
CORS_ORIGINS=https://service.polymech.info,https://polymech.info,https://forum.polymech.info

# Development (unset / default) — falls back to origin: '*'
```

| Setting | Production | Development |
|---------|-----------|-------------|
| **Origin** | Env-driven allowlist | `*` |
| **Methods** | GET, POST, PUT, DELETE, PATCH, OPTIONS | Same |
| **Credentials** | `true` | `false` (browsers disallow `credentials: true` with `*`) |
| **Max Preflight Cache** | 600s (10 min) | Same |

Custom headers are whitelisted for client SDK compatibility (Stainless, etc.).

---

## Observability & Auditing

### Security Logging

All security events are logged via a dedicated `securityLogger` (Pino) with structured context:

- Auth failures with IP + user agent
- Admin actions with acting user ID
- Ban/unban events with target and outcome
- Rate limit violations with key and threshold

### Analytics Middleware

Every request (except static assets, doc UIs, and widget paths) is tracked:

| Field | Source |
|-------|--------|
| Method + Path | Request |
| IP Address | Hardened extraction via `getClientIpFromHono()` — validates `socket.remoteAddress` against trusted proxy ranges before trusting `X-Forwarded-For` |
| User Agent | Request header |
| Session ID | `pm_sid` cookie (30-minute sliding expiry) |
| Geo Location | Background async lookup via BigDataCloud API |
| User ID | Resolved from JWT if present |
| Response Time | Measured end-to-end |
| Status Code | Response |

**Geo-lookup resilience:**

- Results cached in-memory + disk (`cache/geoip.json`)
- Non-blocking — resolved in background after response is sent
- Circuit breaker — after 3 consecutive failures, geo lookups are disabled for 30 seconds
- Timeout — individual lookups are capped at 2 seconds
- De-duplication — concurrent lookups for the same IP share a single request

### Real-Time Streams

Security events and analytics are available as live Server-Sent Event (SSE) streams:

```
GET /api/logs/system/stream    → Live system + security logs
GET /api/analytics/stream      → Live request analytics
```

---

## Admin API

All admin endpoints require authentication + admin role. Documented in OpenAPI and accessible via Swagger UI / Scalar.

### Ban Management

```
GET  /api/admin/bans              → View all banned IPs, users, tokens
POST /api/admin/bans/unban-ip     → { "ip": "203.0.113.50" }
POST /api/admin/bans/unban-user   → { "userId": "user-uuid" }
GET  /api/admin/bans/violations   → View current violation tracking stats
```

### System Operations

```
POST /api/admin/system/restart    → Graceful restart (systemd re-spawns)
POST /api/flush-cache             → Flush all in-memory + disk caches
POST /api/cache/invalidate        → Selective cache invalidation by path/type
GET  /api/cache/inspect           → View cache state, TTLs, dependency graph
```

### Analytics

```
GET    /api/analytics             → Historical request data
GET    /api/analytics/stream      → Real-time SSE stream
DELETE /api/analytics             → Clear analytics data
```

---

## Configuration Reference

All security settings are configurable via environment variables:

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `REQUIRE_AUTH` | `false` | When `true`, all non-public API routes require authentication |
| `CORS_ORIGINS` | `*` | Comma-separated CORS allowed origins. Falls back to `*` if unset |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `1` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `50` | Window duration in milliseconds |

### Auto-Ban

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_BAN_THRESHOLD` | `5` | Violations before auto-ban |
| `AUTO_BAN_WINDOW_MS` | `10000` | Violation counting window (ms) |
| `AUTO_BAN_CLEANUP_INTERVAL_MS` | `60000` | How often to clean up old violation records |

### API Documentation

| Variable | Default | Description |
|----------|---------|-------------|
| `SCALAR_AUTH_TOKEN` | `''` | Pre-filled Bearer token for Scalar UI |
| `NODE_ENV` | — | When `production`, Swagger/Scalar UIs are disabled |

### Files

| File | Description |
|------|-------------|
| `config/blocklist.json` | Manual IP/user/token blocklist |
| `config/ban.json` | Auto-generated ban list (persisted auto-bans) |
| `cache/geoip.json` | Geo-IP lookup cache |

---

## TODO — Pending Improvements

### High Priority

- [ ] **Swagger/Scalar in production** — Currently disabled entirely in production. Consider enabling at a protected `/admin/reference` path behind admin auth for debugging
- [-] **Audit logging** — Admin actions (unban, restart, cache flush) log to Pino but should also persist to a dedicated `audit_log` table in the database

### Medium Priority

- [ ] **Page collaboration ACL** — Implement `page_collaborators` RLS so viewers cannot edit shared pages
- [ ] **Organization impersonation** — Add `X-Org-Slug` header middleware to scope queries to organization context with role-based access (Admin reads all, Member reads own)
- [ ] **Per-route rate limiting** — Apply stricter limits to expensive endpoints (`/api/search`, `/api/serving/site-info`, image optimization proxy) using `createCustomRateLimiter`
- [ ] **Redis-backed rate limiting** — Current rate limiter is in-memory (per-instance). For multi-instance deploys, switch to a Redis-backed store via `hono-rate-limiter`

### Low Priority / Nice-to-Have

- [ ] **API key authentication** — Support `X-API-Key` header as an alternative to Bearer tokens for third-party integrations
- [ ] **Webhook signature verification** — For incoming webhooks (Stripe, etc.), verify HMAC signatures before processing
- [ ] **Geo-blocking** — Extend blocklist to support country-level blocking using the existing geo-IP cache
- [ ] **Security headers audit** — Run [securityheaders.com](https://securityheaders.com) and [Mozilla Observatory](https://observatory.mozilla.org/) checks on production and address any findings
