# Products CRUD Implementation Plan

Based on the simplified approach, **Products are separate from the core `resource_acl` ecosystem**. Products will have their own dedicated table and CRUD operations. They integrate with the ACL system purely by convention (the product's `slug` is used as the `resource_id` in `resource_acl` for product-level rules).

## 1. Database Schema
We need to modify the existing `products` table (or create it if it's currently unused) to support the required fields: `id` (UUID), `name`, `slug`, and `settings` (JSONB).

- [ ] **Migration / SQL Update**:
  - Convert `id` to `UUID` (or ensure new table uses UUID).
  - Add `settings` `jsonb` column for flags like `{ enabled: true, ... }`.
  - Retain `slug` (unique) to use as the join key for ACL mapping.
  - Retain `name` and `description`.

```sql
create table if not exists public.products (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  settings jsonb null default '{"enabled": true}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint products_pkey primary key (id),
  constraint products_slug_key unique (slug)
);
```

## 2. API Endpoints (`/api/admin/products`)
Since Products are independent of the ACL internals, they get their own dedicated admin endpoints rather than being bundled under `/api/admin/acl`.

- [ ] **Zod Schemas** (`server/src/endpoints/admin-products.ts`)
  - `ProductCreateSchema`: name, slug, description, settings.
  - `ProductUpdateSchema`: name, description, settings (maybe allow slug updates with a warning about ACL disconnections).

- [ ] **Handlers**
  - `GET /api/admin/products`: List all products.
  - `GET /api/admin/products/:slug`: Get details for a single product.
  - `POST /api/admin/products`: Insert new product. (Slug can be auto-generated from name if omitted).
  - `PUT /api/admin/products/:slug`: Update the product row.
  - `DELETE /api/admin/products/:slug`: Delete the product. 

## 3. Integration with ACLs
The only touchpoint between the `products` table and the `resource_acl` table is the **slug**.

- [ ] When fetching a User's product-level permissions, we query `resource_acl` where `resource_type = 'product-acl'` and `resource_id = product.slug`.
- [ ] Optionally, implement a cleanup hook: if a product is deleted via `DELETE /api/admin/products/:slug`, fire an event to delete matching `product-acl` rows from `resource_acl`.
- [ ] During the OpenAPI sync (which we discussed for Endpoints), endpoints will match the `products.slug` to populate their `meta.product`.

## 4. Server Integration
- [ ] Build the routes in `server/src/endpoints/admin-products.ts`.
- [ ] Protect all routes with the `Admin()` decorator.
- [ ] Register the routes in the main server router.
