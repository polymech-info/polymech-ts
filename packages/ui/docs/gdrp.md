# GDPR (General Data Protection Regulation) & ePrivacy Compliance Report

## Overview
This report evaluates the current tracking, analytics, and marketing campaign features of the platform against the requirements of the GDPR and ePrivacy Directive.

With the recent additions of detailed analytics, session tracking, and individual email tracking, the platform collects, processes, and stores Personal Identifiable Information (PII).

## 1. Analytics & Web Tracking (Cookies & PII)
**Current State:**
- The `analyticsMiddleware` generates and assigns a `SESSION_COOKIE` (`pm_sid`) to track website visitors across sessions.
- IP addresses are **anonymized** before writing to `analytics.jsonl` — the last octet is zeroed for IPv4 (e.g. `203.0.113.47` → `203.0.113.0`) and the last 5 groups are zeroed for IPv6. Full IPs are still used transiently for geo-resolution (BigDataCloud API) and cached in `cache/geoip.json` for operational purposes.
- `userEmail` and `userName` are **not logged**. Only `userId` is persisted for correlation.
- User Agents, Referers, Language, and inferred Geographic locations are logged.

**Remaining Deficiency:**
- **Cookie Consent:** The ePrivacy Directive requires explicit, opt-in consent *before* setting any non-essential cookies (including analytics and session tracking IDs). Currently, the `pm_sid` cookie is placed automatically on all routes not in the ignore list.

**Recommendation:**
- **Consent Banner:** Implement a Cookie Consent UI. Only set the `SESSION_COOKIE` and execute the tracking portion of the middleware if the user has explicitly accepted.

### Google Analytics (GA4)
**Status: ✅ Removed**
- The GA4 script (`G-QZ02JX0J0L`) has been **removed** from `index.html`. No third-party analytics cookies are set, no data is transmitted to Google.

### Security Middleware (unaffected by anonymization)
The `rateLimiter` and `autoBan` middleware continue to use **full, un-anonymized IPs** in-memory at request time. These IPs are never written to the JSONL analytics log — they exist only in transient memory structures (`Map`) and the operational `config/ban.json` blocklist. This is permissible under GDPR's "legitimate interest" basis (Article 6(1)(f)) for security and abuse prevention.

## 2. Marketing Campaigns & Email Tracking
**Status: ✅ Per-contact tracking disabled**
- The 1x1 tracking pixel (`pixel.gif`) injection is **commented out** — no individual open tracking.
- Per-contact `c_id` URL parameters are **commented out** — no individual click tracking.
- The `pixel.gif` route is **disabled** in the `CampaignsProduct` route registration.
- Campaign-level `tracking` param is preserved on links (non-PII, used for aggregate campaign attribution only).
- Unsubscribe links continue to function via `unsubscribe_token`.

## 3. Data Retention and Erasure (Right to be Forgotten)
**Current State:**
- `analytics.jsonl` continuously appends telemetry data without a predefined rotation or deletion policy.
- Campaign interactions and `marketing_emails` records preserve history.

**Deficiencies:**
- **Right to Erasure (Article 17):** If a user requested their data be deleted, the system would need to scan and purge their `userId` from the raw `analytics.jsonl` file.
- **Storage Limitation (Article 5):** PII should only be kept as long as necessary.

**Recommendations:**
- **Structured Log Rotation:** Implement a background job that aggregates or rotates the `analytics.jsonl` file (e.g., deleting logs older than 90 days).
- **Deletion Workflows:** When a user invokes their right to be forgotten (or deletes their profile), ensure that cascading deletes cover the `contacts`, `contact_group_members`, and `marketing_emails` tables.

## Summary
**Completed mitigations:**
- ✅ **IP anonymization** — last octet zeroed in persisted logs; geo data preserved via pre-anonymization lookup.
- ✅ **PII minimization** — `userEmail` and `userName` removed from JSONL logs; only `userId` retained.
- ✅ **Google Analytics removed** — `gtag.js` stripped from `index.html`. No third-party cookies.
- ✅ **Per-contact email tracking disabled** — `c_id` and `pixel.gif` commented out in `campaigns/index.ts`.

**Remaining housekeeping (non-blocking):**
1. Automatically **rotate/expire** old unstructured analytics logs (recommend 90-day TTL).
2. Implement **deletion workflows** to purge `userId` from JSONL on erasure requests.
