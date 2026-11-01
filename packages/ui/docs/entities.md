# Entity Types

The `serving` endpoint currently handles multiple distinct entity models within the platform. According to the route registrations in `server/src/products/serving/index.ts`, these are the primary operational entities managed by the system:

## 1. Content Entities
- **Posts** (`db-posts.ts`): Primary content entities. Used in feeds and can be exported in various formats (PDF, JSON, HTML, Markdown, Rich HTML).
- **Pages** (`pages-crud.ts`): Standalone pages within the platform. Supports full version control (`PageVersions`), email rendering, and multiple export formats.
- **Categories** (`db-categories.ts`): Taxonomies for grouping and filtering items. Includes `CategoryItems` for linking entities to a category.

## 2. Media & Engagement Entities
- **Pictures** (`db-pictures.ts`): Standalone media assets supporting versioning, linking/unlinking, and batch uploads.
- **Comments** (`db-pictures.ts`): User engagement texts, typically attached to media or content, with support for toggling likes.

## 3. Structural Entities
- **Types** (`db-types.ts`): Dynamically managed content definitions or data schemas.
- **Layouts** (`db-layouts.ts`): View templates and rendering layouts for the front-end or app components.

## 4. Internationalization (i18n) Entities
- **Translations & Widget Translations** (`db-i18n.ts`): Granular text records mapped to UI components.
- **Glossaries & Glossary Terms** (`db-i18n.ts`): Translation dictionaries and terminology synchronization mappings (e.g., DeepL integration).

## 5. User Entities (`db-user.ts`)
- **Profiles**: The public-facing identity (`profiles` table), storing fields like `username`, `display_name`, `bio`, and `avatar_url`. This entity relies on a centralized in-memory cache for high-performance reading and augmentation across the application.
- **User Secrets**: Secure configurations (`user_secrets` table) such as `api_keys`, `variables`, `shipping_addresses`, and `vendor_profiles`. The API ensures `api_keys` are dynamically masked (showing only the last 4 characters) when served.
- **Admin Users**: Management entities that bundle Supabase Auth identities with their respective `profiles` and settings, allowing backend user lifecycle management.

## 6. Access Control (ACL) Entities (`db-acl.ts`)
- **ACL Settings**: A resource-agnostic wrapper used to define access rules. It delegates to specific backends (`IAclBackend`, e.g., memory/VFS or Supabase DB) and encapsulates the owner and `AclEntry` definitions (which specify `userId` or `group`, scoped to a `path` with allowed `permissions`).
- **Global ACL Groups**: Hierarchical roles persisted in the database (`acl_groups`), supporting relationships via `parent_id`.
- **Group Memberships**: Maps users to Global Groups (`acl_group_members`). The ACL engine consolidates these explicit memberships with virtual identities (e.g., *anonymous*, *authenticated*, *registered*, *admin*) and local resource groups to evaluate effective permissions dynamically.

## 7. Platform Integration Entities (`endpoints/products.ts`)
- **Products**: Platform-level features or logical product definitions (`products` table). Each product holds an `id`, `name`, `slug`, `description`, and a flexible `settings` JSON object (supporting logic like `enabled`, `default_cost_units`, and `default_rate_limit`). Their administrative endpoints support full CRUD operations. Notably, deleting a product automatically removes any associated `product-acl` records from the `resource_acl` table.

## 8. Contacts & Integrations Entities (`products/contacts/index.ts`)
- **Contacts**: The primary address book entity (`contacts` table), storing fields like `name`, `organization`, `emails`, `phone`, and `address`. Supports bulk operations and bidirectional data exchange formats (including parsing and serialization for vCard).
- **Contact Groups & Memberships**: Organizational buckets (`contact_groups`) and their associated mapping table (`contact_group_members`) used to categorize constraints.
- **Mailboxes (IMAP Integration)**: Configuration records enabling automated connection to external email servers for contact harvesting. Includes specific OAuth2 handling for Gmail alongside traditional IMAP credential setups.


## 9. Server Middleware Layers (`index.ts` & `middleware/`)
The Polymech server pipeline implements a layered middleware architecture to enforce security, monitoring, and authentication before requests reach the endpoints.

- **Content Security & CORS (`csp.ts`)**: Sets up strict Content Security Policies, secure HTTP headers, and intercepts OPTIONS preflight requests globally.
- **Security & Blocking Pipeline**:
  - **AutoBan Middleware (`autoBan.ts`)**: Applied globally (`*`). Acts as an intrusion detection system (IDS) that catches directory traversal probes and enforces rate-limit bans across all HTTP traffic.
  - **Blocklist Middleware (`blocklist.ts`)**: Applied specifically to `/api/*` to enforce absolute IP or user-based blocklists before API logic is executed.
- **Analytics (`analytics.ts`)**: Traps requests globally (`*`) for telemetry, observability, and usage metric tracking.
- **Authentication & Authorization (`auth.ts`)**:
  - **Optional Authentication**: By default, checks for a `Bearer` token or `?token=` query parameter (e.g., for SSE) and validates it against Supabase via an aggressive cache. Routes registered in the `PublicEndpointRegistry` (and the core `/api/products` route) bypass authentication requirements entirely.
  - **Admin Enforcement**: Intercepts requests meant for the `AdminEndpointRegistry`. Requires a valid session payload and queries `user_roles` to strictly enforce the `admin` capability.
- **Content Compression**: Global `hono/compress` usage that is augmented with custom streaming logic to seamlessly gzip specialized, heavy geometry and vector assets (e.g., `model/stl`, `model/obj`, `vnd.dxf`).


## 10. Product Tiering / Monetization (Freemium, Pro) via ACL Middleware [Proposed Architecture]
To seamlessly integrate subscription tiers on the server-side without overhauling existing database models, the platform can leverage the new ACL engine and middleware layers:

- **ACL Group Hierarchy For Tiers**: Instead of building custom licensing tables, product tiers map directly to **Global ACL Groups** utilizing inheritance.
  - `tier:freemium` (assigned automatically to registered users).
  - `tier:pro` (inherits capabilities from `freemium`).
  - Upon webhook confirmation (e.g., Stripe payment), the user is upserted into the `tier:pro` group via `acl_group_members`.
- **Product-Level Resource Gating**: The `resource_acl` table links an existing Product (from the `products` table, e.g., `contacts` module) to a tier group (`tier:pro`) with explicit `access` permissions.
- **Server Middleware Gating (`productAclMiddleware.ts`)**: A dedicated middleware sits *after* `auth.ts` (so `userId` and `user.groups` are resolved). 
  - Using the `IAclBackend`, it evaluates if the user's combined implicit/explicit groups trigger an `ALLOW` for the requested API route. If denied, it handles the `403 Payment/Upgrade Required` response universally, keeping endpoint code clean.
- **Dynamic Rate Limits**: The `products.settings` JSON (which holds `default_rate_limit`) can be parsed by middleware. The `apiRateLimiter` can then dynamically adjust throttles based on the user's tier, heavily restricting Freemium traffic while allowing Pro users unhindered access.


### Example Integration Flow: Upgrading a User from Free to Pro

1. **Transaction Event**: A user completes a checkout, and the external payment processor (e.g., Stripe) fires a secure webhook (like `checkout.session.completed`) to the backend (`POST /api/webhooks/billing`).
2. **Signature Verification**: The server intercepts the webhook payload and validates its cryptographic signature.
3. **Identity Resolution**: The server maps the external `customer_id` from the payload back to the core Supabase `user_id`.
4. **ACL Upsertion**: The backend inserts or modifies the `acl_group_members` table, mapping the resolved `user_id` strictly to the `tier:pro` global ACL group.
5. **Cache Invalidation**: The server evicts the user's cached identity and permissions footprint from high-speed memory, forcing a fresh lookup.
6. **Instant Authorization**: Upon the user's next API call, the request hits the `productAclMiddleware`. The `IAclBackend` recalculates the merged groups, detects the active `tier:pro` inheritance, and structurally allows access to Pro-restricted product features and modified rate limit overrides.

*This brief documentation reflects the current state of CRUD routing and API interactions across the architecture.*
