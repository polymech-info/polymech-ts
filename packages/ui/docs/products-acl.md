# Product Tiering and ACL Integration

The Product ACL Middleware in Polymech is a centralized gatekeeping layer designed to enforce dynamic, product-level routing conditions. It bridges the platform's multi-tenant Product definitions with the core Access Control List (ACL) system, enabling declarative endpoint protection (such as locking API access behind premium subscription tiers or feature flags) without modifying the endpoint handlers themselves.

## 1. Core Component Layering

Product tiering is resolved dynamically through three primary systems:

*   **`productAclMiddleware`**: Sits directly behind the core `auth` handler in the server pipeline. It intercepts incoming requests, cross-references them against active product definitions, and gates access.
*   **`DbAclBackend`**: Provides a singleton, unified mechanism for resolving ACL structures from PostgreSQL (`db-acl.ts`). It handles cache management, ensures schema adherence, and acts as the transport layer for queries.
*   **Dynamic Route Registry**: Managed inside the `products` table via the JSON `settings.routes` definition.

### Product Route Definitions 

A product asserts ownership of specific routes via its JSON settings block. If an endpoint is listed here, the middleware will trap the request before the target Hono handler.

```json
{
  "enabled": true,
  "default_cost_units": 0,
  "routes": [
    {
      "url": "/api/places/gridsearch",
      "method": "post",
      "rate": 1
    }
  ]
}
```

The middleware checks incoming requests for a matching path and HTTP verb. If a product claims the route, the evaluation logic maps standard REST verbs to abstract actions (`GET` → `read`, `POST|PUT|PATCH|DELETE` → `write`) and hands evaluation down to `evaluateAcl`.

**Monetization Metrics:** In addition to strict ACL gating, the settings block supports tiered consumption metrics:
*   `default_cost_units`: A universal baseline payload cost or operational limit assigned to the product broadly.
*   `rate`: Used inside the routes array. If a user queries the `gridsearch` endpoint, it consumes `1` unit of rate limit or credit allocation. This architecture supports tracking specific high-computation endpoints dynamically.

If the evaluation fails, the middleware aborts the request universally with a `403 Payment/Upgrade Required`.

## 2. Pricing and Monetization Models

The flexibility of the `settings` JSON blob combined with the ACL group system allows Polymech to support multiple different monetization models simultaneously. This enables distinct billing paradigms on a per-product basis without hardcoding specific logic into endpoints.

### Tier-Based Models (Subscriptions)

The most common model relies on static access grants. Rather than consuming a dynamic balance, access is binary based on whether a user's subscription tier matches the required ACL group.

1.  **Group Assignments**: A product's settings define an array of `groups` (e.g., `["Pro Subscribers", "Enterprise"]`).
2.  **Access Control**: The `productAclMiddleware` validates if the incoming user profile intersects with these product-assigned groups. This is a pure-functional check; if the user possesses the role, they pass transparently.
3.  **Billing Enforcement**: A backend billing service (like Stripe webhooks) manages mapping users into these Global ACL groups when their subscription is active, and removes them if payment fails.
4.  **Use Case**: Unlimited access SaaS paradigms, features like "Advanced Reporting," or premium dashboard views where usage volumes are not strictly tracked.

### Credits-Based Models (Metered)

For highly computational operations (like GenAI image generation or complex search aggregations), access is gated dynamically based on a diminishing credit ledger.

1.  **Cost Configuration**: The product defines a global `default_cost_units` value. Granular endpoint costs are defined within the `routes` array mapping (e.g., calling `/api/search` costs `5` units via `route.rate`).
2.  **Ledger Validation**: Unlike Tier-based models, pure group membership is insufficient. The billing middleware or endpoint handler dynamically assesses the user's current "credit balance" against the defined `rate` or `default_cost_units` for the active product logic.
3.  **Deduction**: If constraints are met, the database deducts the exact units specified by the product definition. 
4.  **Use Case**: Pay-as-you-go API access, generation limits, or API-as-a-Service architecture where customers pre-purchase bulk credits.

### Hybrid Strategy (Tiered Allowances)

You can blend these architectures by applying a Tier Subscription model that grants access to a recurring monthly bundle of credits.

1.  Users are mapped into a specific ACL `group` defining their tier ("Gold Subscriber").
2.  The product strictly checks for that group membership before allowing interaction.
3.  If they hold the required tier, they receive a localized balance renewal (e.g., 1000 requests/month constraint) against the product's `cost_units`.
4.  Once exhausted, they can either trigger an upsell or be blocked by rate limiters until the next billing cycle.

## 3. Resource Identity and Database Constraints

Products are system-level abstractions. In the underlying database `resource_acl` schema, rows are uniquely identified by a combination of `resource_type`, `resource_id`, and `resource_owner_id`. 

Because products are global to the entire platform (not owned by any single user), the `resolveId` abstraction ignores the owner identity parameters, and queries against the Postgres database pass `ownerId = null`. This satisfies the strict `UUID` constraint on the `resource_owner_id` column while correctly mapping to a system-wide entity singleton. 

## 4. Global Roles vs User Evaluation

During ACL execution, an administrator or backend script defines rules allocating `READ` or `WRITE` access to specific paths. The identities defined in these rules can be explicit `userId` entries, OR they map to `groups`.

When the `evaluateAcl` function assesses a payload, it builds an identity profile for the user via `fetchUserEffectiveGroups`. The user adopts:
1. Implicit static strings (e.g., `'anonymous'`, `'authenticated'`, `'registered'`).
2. Custom Virtual local groups defined directly in the ACL rules.
3. Persistent Database Global Groups.

To provide compatibility between the generated UI tools and dynamic API access, User database groups append *both* their descriptive string `name` (e.g., `"Pacbot Test Tier"`) AND their UUID `id` strings into the evaluation identity array. This allows API grants targeting raw UUIDs from standard REST flows to safely map to system users.

## 5. Performance & Caching

The `productAclMiddleware` sits in front of potentially high-throughput data operations. Evaluating ACL schemas across PostgreSQL directly per request would induce a severe N+1 overhead latency.

Instead, the `DbAclBackend` utilizes an in-memory `LRUCache`:
*   `fetchAclSettings` queries and caches the serialized ruleset representation for a TTL of 5 minutes (`ACL_CACHE_TTL`).
*   Database interaction operations (`grantAcl`, `revokeAcl`, `putAclGroup`) automatically invoke `flushAclCache` with the corresponding `resourceType` and `resourceId`.
*   This architecture guarantees that the next request made after a monetization tier upgrade (grant execution) fetches fresh permissions, satisfying strong consistency while maintaining sub-millisecond validations across repeat requests.

## 6. Administrative Endpoints

User mapping and Tier granting is abstracted away from the core products engine into the central `/api/admin/acl` paths. Endpoints defined in `server/src/endpoints/acl.ts`:

*   **`POST /api/admin/acl/groups`**: Upserts a global application-level ACL Group allowing `(id?: uuid, name: string, description?: string)`. Let the database auto-generate UUIDs to prevent collision and constraints issues.
*   **`POST /api/admin/acl/groups/:id/members`**: Maps a specific `{ userId }` payload representation into the target global ACL group using `acl_group_members`.
*   **`POST /api/acl/product/:slug/grant`**: Accepts the previously defined `group` id representation, binding strict evaluation endpoints to the product module. 

## 7. Audit & Logging

The Product ACL infrastructure relies on dedicated Pino loggers to produce auditable trails of authorization activity, separated from the main application logs. 

*   **Middleware Telemetry**: By initializing `createLogger('product-acl')` within the `productAclMiddleware.ts`, all ACL evaluation statuses—both allowed and denied—are flushed independently to `logs/product-acl.json`. This targeted log file guarantees isolated monitoring of access patterns, premium tier rejections, and endpoint security.
*   **Test Harness Logging**: Custom loggers (e.g., `createLogger('test-products-acl')`) are utilized extensively in E2E tests to funnel verbose output and debugging logs (like Group UUID assignments and ACL rule validation paths) into separate files, keeping the `vitest` CLI clean while preserving deep inspection capabilities.

## 8. Proposed Architecture: Route-Level Tiering (Draft Design)

To solve the complex requirement where a single product exposes URLs tiered across different monetization brackets (e.g. "Free" vs "Pro" endpoints within the same product logic), we have implemented dynamic Route-Level Tiering directly within the configuration schema.

This avoids splitting unified codebases into artificial "sub-products" just for ACL, and ensures `resource_acl` remains scalable. 

### The Schema Expansion

We augment the existing `product.settings.routes` definition to accept `groups` properties for access tiering, and `pricing` properties for exact cost allocations per endpoint. For more complex cases where a single endpoint has different costs per tier, we use the `variants` array.

```json
{
  "enabled": true,
  "default_cost_units": 5, 
  "routes": [
    {
      "url": "/api/video/export",
      "method": "post",
      "rate": 10, // Global fallback rate for this route
      "variants": [
        {
          "groups": ["Pro", "Enterprise"], 
          "rate": 2, // Discounted rate for Pro/Enterprise
          "pricing": {
            "provider": "stripe",
            "provider_price_id": "price_pro_export",
            "amount": 0.20,
            "currency": "usd"
          }
        },
        {
          "groups": ["Registered"],
          "rate": 10,
          "pricing": {
            "provider": "stripe",
            "provider_price_id": "price_free_export",
            "amount": 1.00,
            "currency": "usd"
          }
        }
      ]
    }
  ]
}
```

### Variant Selection Logic

When a request matches a route, the middleware evaluates `variants` in order:
1. **First Match**: The first variant whose `groups` intersection with the user's `effectiveGroups` is non-empty is selected.
2. **Override**: If a variant is selected, its `rate` and `pricing` override any settings defined at the route or product level.
3. **Implicit Grant**: Matching a variant (or a route-level `groups` array) constitutes an implicit grant, bypassing the need for a separate entry in the `resource_acl` table.
4. **Fallback**: If no variant matches, the system falls back to the route's default `rate` and evaluates against the global `resource_acl` permissions.

### Extending Pricing Resolution

When an endpoint is metered or requires direct fiat payment per use, the `productAclMiddleware` or a downstream billing handler can read the `matchedRoute.pricing` or `matchedRoute.rate`.
* **Token/Credit Drain**: Immediately deduct from the user's `cost_units` wallet mapped to `rate`.
* **Metered Billing**: Fire a usage record to the abstracted Billing Gateway API using the `provider` and `provider_price_id` (e.g., Stripe, Paddle, LemonSqueezy) associated specifically with this route, allowing a single product configuration to emit distinct billing lines to any upstream gateway.

## 9. Pluggable Add-on: Per-User Rate Limiting

We've established that rate linking (like `RATE_LIMIT_MAX=500` in `rateLimiter.ts`) restricts API abuse globally. To allow users to purchase higher rate limits as an "add-on", we can shift from static env vars to dynamic per-user token buckets.

### The Mechanism

1. **Profile Extension**: The user's `profiles.settings` JSON block is expanded to optionally cache a `rate_limit_override` property: `{"rate_limit_override": {"max": 5000, "windowMs": 60000}}`.
2. **Purchase / Webhook Hook**: You create an Add-on product ("API Booster Pack") in Stripe/System. When purchased, your webhook simply patches the user's `profiles.settings.rate_limit_override` to the boosted values.
3. **Dynamic Middleware**: 
   Currently, `apiRateLimiter` is statically initialized via `hono-rate-limiter`. We would refactor the rate limit middleware to intercept the authorization token, query Redis (or the cached DB profile), and apply a custom limit. 

### Why User Settings over ACL for Rate Limits?

While ACL is great for binary *"Can they access this URL?"* checks, Rate Limits are quantitative properties. By storing an explicit `rate_limit_override` directly inside `profiles.settings`:
* Your billing webhooks don't need to interact with the complicated `resource_acl` table; they just patch a single JSON field on the user profile.
* It cleanly separates "Authorization" (Products ACL) from "Traffic Shaping" (Rate Limiting).
* The routing layer checks ACL first. If allowed, it then checks `rateLimit`. If the profile has a rate limit override, it consumes out of their massive bucket. Otherwise, it consumes from the global default bucket.

## 10. Usage Tracking & Metering Hits

If a route is configured with a `rate` (currency) or `pricing` (fiat), the system must track hits reliably. It's critical to separate **Flood Control** from **Quota Metering**:

1. **Flood Control (Rate Limiting)**: Tracked ephemerally via `hono-rate-limiter` using Redis or an LRU MemoryStore. The key is simply mapped to the `userId` or `IP`. This resets every `windowMs` and requires zero persistent database writes.
2. **Quota Metering (Internal Credits)**: If a route requires `rate: 10`, the middleware intercepts the *successful* response and decrements the user's running credit balance in Postgres (e.g., `UPDATE profiles SET settings = jsonb_set(...)`). To avoid database locks on high-throughput routes, these hits can be batched in memory and flushed to the database every 10 seconds.
3. **External Metering (Payment Gateways)**: If a route defines fiat `pricing`, the middleware fires an async call to an internal **Payment Provider Abstraction Layer**. This internal layer reads the `pricing.provider` (e.g., Stripe, Paddle) and `provider_price_id` and forwards the usage data to that specific gateway. This ensures your core system isn't tightly coupled to Stripe, and you can switch to Paddle or Braintree later without rewriting the API middleware!

## 11. Usage Visibility & Dashboard Integration

To ensure transparency and reduce customer support overhead, users should be able to view their API usage natively inside our application's dashboard without being forcefully redirected to external payment portals.

### Internal Credits (`rate`)

For endpoints utilizing the internal token/credit system based on `rate`:
* **User Dashboard**: Because the running balance is stored natively inside Postgres (`profiles.settings.credits`), the React frontend can trivially query a `GET /api/profile` endpoint to render real-time credit burn alongside predictive usage charts.
* **Admin Dashboard**: Support staff can view and manually adjust ("Grant Bonus Credits") this exact JSON value using the standard Admin User manager.

### External Fiat (`pricing.provider`)

For fiat-based metered billing handled by upstream gateways:
* **API Polling**: Providers like Stripe and Paddle offer APIs to query unbilled metered usage (e.g., Stripe's upcoming invoices or meter event summaries). 
* **Native Surfacing**: We establish a proxy endpoint `GET /api/billing/usage` inside our platform. This endpoint reaches out to the defined `pricing.provider`, aggregates the user's running usage data for the current cycle, and passes it to the frontend.
* **Seamless Experience**: This guarantees our users view their accumulated `$15.54` usage natively inside *our* UI, maintaining a complete, white-labeled experience that fits within our dashboard aesthetic constraints.

### Middleware Execution Path

Modifications restricted to the `productAclMiddleware.ts` logic flow:

1. **Route Match Evaluation:** `matchProductRoute` finds the specific route object `matchedRoute` alongside the `matchedProduct`.
2. **Fetch User Groups:** Execute `const effectiveGroups = await fetchUserEffectiveGroups(userId)`.
3. **Route-Level Resolution:** Check if `effectiveGroups` intersects with `matchedRoute.groups`. If true, bypass traditional DB `evaluateAcl` checks and gracefully allow access.
4. **Fallback:** If `matchedRoute.groups` does not explicitly approve access, fall back to the existing `evaluateAcl('product', aclSettings, userId, '/')` logic which continues to serve global DB-enforced overrides.

### Why This Design Works

1. **No Database Migrations:** Uses the flexible JSON payload in `products` instead of enforcing strict SQL constraints. 
2. **UI Compatible:** The `ProductsManager` UI (specifically the `VariablesEditor` for the JSON payload) inherently supports modifying these arrays on the fly. We do not need a custom UI immediately, though replacing the Variables array with inline `GroupPicker` instances for each route later would be trivial.
3. **Graceful Degradation:** Routes without a `groups` array natively fall back to the existing ACL framework without breaking backward compatibility.
4. **Declarative Control:** Admins can view *exactly* who has access to which endpoint from a single, centralized JSON blob.
