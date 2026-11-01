# Multi-Tenant via URL Architecture Options

Implementing multi-tenancy over the URL is a common pattern for SaaS applications. Here is an exploration of the available options, their applicability, and safety implications, focusing specifically on the Hono server architecture and Supabase database isolation.

## 1. Subdomain-Based Routing (Recommended)

**Format:** `https://tenant_slug.yourdomain.com`

**How it works:**
The tenant is identified by extracting the subdomain from the request's hostname. 

**Applicability:** 
Highly applicable and the industry standard for B2B SaaS. It provides the cleanest URL structure and visually assures users they are in their dedicated workspace.

**Server Implementation (Hono):**
*   Add a global middleware early in the `app.use` chain that inspects the `Host` or `X-Forwarded-Host` header.
*   Extract the subdomain (e.g., `tenant_slug`) and inject it into the request context (`c.set('tenant', tenant_slug)`).
*   **Infrastructure**: Requires configuring a wildcard DNS record (`*.yourdomain.com`) and wildcard SSL certificates.

**Safety:**
*   **High**. Cross-tenant data leakage via the UI is hard because the context is structurally tied to the origin.
*   Cookies can be scoped to the specific subdomain, preventing Session/Auth token leakage to other tenants.

## 2. Path-Based Routing (URL Prefix)

**Format:** `https://yourdomain.com/t/tenant_slug/` or `https://yourdomain.com/tenant_slug/`

**How it works:**
The tenant ID is the first prefix segment of the URL path.

**Applicability:** 
Very common when you cannot manage wildcard subdomains or want a simpler infrastructure setup. Useful for B2C SaaS or mixed platforms.

**Server Implementation (Hono):**
*   Hono allows route grouping and middleware scoping based on paths. 
*   Mount the API under a tenant prefix, e.g., `app.use('/api/t/:tenantSlug/*', tenantMiddleware)`.
*   The middleware extracts `:tenantSlug` from `c.req.param('tenantSlug')` and injects it into `c.set('tenant', tenantSlug)`.
*   This requires refactoring existing Hono route registrations (like `app.route`) to be nested under the path parameter.

**Safety:**
*   **Medium-High**. The backend middleware must strictly validate the `:tenantSlug` parameter against the authenticated user's allowed tenants.
*   Cookies are shared across the root domain. A compromised session on one tenant path can theoretically affect another if the user relies on path-scoping, which browsers handle inconsistently.

## 3. Query Parameter-Based Routing (Not Recommended)

**Format:** `https://yourdomain.com/dashboard?tenant=tenant_slug`

**How it works:**
Every API call passes the `tenant` as a query parameter.

**Safety:**
*   **Low**. Prone to state leakage.

---

## Server & Database Security Architecture (Supabase)

Merely parsing the tenant from the URL does not make the application secure. The server must use the URL purely as **context**, and rely on the database for **authorization**.

1. **Never Trust the URL for Auth:** 
   If a user navigates to `tenant-b.domain.com` but their session limits them to `tenant-a`, the server must reject the data access. 

2. **Middleware Pipeline:**
   Your Hono server should have a distinct sequence in `server/src/index.ts`:
   *   `tenantMiddleware`: Extracts tenant from URL/Host -> `c.set('tenantId', id)`.
   *   `authMiddleware`: Verifies the authentication JWT. Determines the user's ID.
   *   `authorizationMiddleware` (Optional but recommended): Verifies if `c.get('user')` is a member of `c.get('tenantId')` via a quick Supabase check or decoded JWT claims.

3. **Database Isolation using Supabase (RLS):**
   The most robust way to ensure safety is pushing the multi-tenant logic down to Postgres via Row Level Security (RLS). 
   
   Instead of modifying every query (`.eq('tenant_id', tenantId)`), use Postgres local variables:
   *   When Hono handles a requested endpoint, generate a Supabase client using Service Role or standard Auth.
   *   Before running queries, set the Postgres config context: 
       ```typescript
       await supabase.rpc('set_tenant_context', { _tenant_id: c.get('tenantId') });
       // Or raw query: set_config('app.current_tenant', '...', true);
       ```
   *   Your RLS policies on tables simply do: 
       ```sql
       CREATE POLICY "Tenant isolation" ON public.documents 
       USING (tenant_id = current_setting('app.current_tenant')::uuid);
       ```
   This ensures that even if you forget to add a `.eq('tenant_id')` to an API call, data leakage is impossible at the database engine level.

## Deployment on Plesk (Apache Proxy to Node)

Since the application runs via an Apache proxy in a Plesk environment, the deployment implications vary significantly depending on the routing strategy:

### For Subdomain-Based Routing
*   **Plesk Configuration**: You must create a "Wildcard Subdomain" (`*.yourdomain.com`) in Plesk attached to the same proxy configuration as the main application. 
*   **SSL Certificates**: The Let's Encrypt extension in Plesk supports issuing Wildcard certificates, but this strictly requires DNS validation via API (e.g., Cloudflare) rather than standard HTTP validation.
*   **Apache Proxy Pass**: Plesk's Apache to Node.js proxy preserves the original request host internally (`ProxyPreserveHost On`), so `Hono` will natively receive `tenant.yourdomain.com` in the `Host` header, alongside `X-Forwarded-Host`. No advanced `.htaccess` editing is required; you just assign the wildcard domain to the Node app correctly.

### For Path-Based Routing
*   **Plesk Configuration**: Requires zero structural changes to your Plesk or Apache setup. Everything remains under `yourdomain.com` which is already safely proxied to your application.
*   **SSL Certificates**: Your existing single-domain SSL certificate handles everything automatically. No DNS API integration is needed.
*   **Apache Proxy Pass**: Passes through normally; the backend Node application sees the full URI path and routes accordingly.

## Conclusion

Since the frontend is not driving the structural isolation via an OrganizationProvider, the true source of truth must live in the **Hono Server** and **Supabase Database**. 

For a robust architecture:
1. Choose either **Subdomains** (preferable) or **Path Parameters** for Hono routing.
2. Implement a unified `tenantMiddleware` in `server/src/index.ts` to extract and attach the context to the Hono `c` (Context).
3. Standardize on **Supabase RLS with custom config variables** to enforce hard data isolation, preventing accidental cross-tenant queries across all API routes.
