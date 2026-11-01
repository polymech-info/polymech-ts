# Category ACL — Design & Implementation Plan

## Overview

Per-category access control — reusing the existing **resource-agnostic ACL system** (`resource_acl` table + `IAclBackend` + `AclEditor`).

**Roles:** `admin`, `authenticated` (logged-in users), `anonymous`  
**Phase 1:** Only admins can manage category permissions  
**Phase 2:** Users can create categories and manage permissions for their own categories

---

## ✅ Completed

### Backend registration

`serving/index.ts` — registered the `'category'` ACL backend:

```ts
import { DbAclBackend } from './db/db-acl-db.js';
registerAclBackend('category', new DbAclBackend('category'));
```

This enables the full ACL API for categories:
- `GET    /api/acl/category/:categoryId` — read ACL
- `POST   /api/acl/category/:categoryId/grant` — grant permission
- `POST   /api/acl/category/:categoryId/revoke` — revoke permission

### Virtual user ID fix

`db-acl-db.ts` — fixed `DbAclBackend` to handle virtual/sentinel user IDs (`anonymous`, `authenticated`). These aren't valid UUIDs and can't be stored in the `user_id` FK column, so they're transparently mapped to/from `group_name`:

| AclEntry.userId | DB column | Value |
|-----------------|-----------|-------|
| `anonymous` | `group_name` | `'anonymous'` |
| `authenticated` | `group_name` | `'authenticated'` |
| `<real-uuid>` | `user_id` | UUID FK → auth.users |
| _(group grant)_ | `group_name` | e.g. `'editors'` |

### E2E tests

`category-acl.e2e.test.ts` — 19 tests, all passing:

| Group | Tests | Coverage |
|-------|-------|----------|
| ACL CRUD | 9 | grant anon/auth/user, verify reads, upsert, full revoke cycle |
| Access control | 4 | unauth rejection, 404 missing revoke, input validation |
| Multi-user | 3 | regular user denied ACL management |
| Group grants | 2 | grant/revoke by group name |
| ACL isolation | 1 | grants don't leak between categories |

Run: `npm run test:acl:categories`

---

## 🔲 Next Steps — CategoryManager UI Integration

### Goal

Add a **Permissions** section to [CategoryManager.tsx](../src/components/widgets/CategoryManager.tsx)'s right panel, using the existing [AclEditor](../src/components/admin/AclEditor.tsx) component.

### Where it goes

The right panel in CategoryManager has 3 states:

```
editingCategory?     → Edit form (name, slug, visibility, variables, types, translate)
selectedCategoryId?  → Selected view (name, description, page link actions)  ← ADD HERE
else                 → Empty state ("Select a category...")
```

Add the `AclEditor` inside the **selected view** (state 2), below the "Current Page Link" section (around line 548):

### Implementation

```tsx
// 1. Import
import { AclEditor } from '@/components/admin/AclEditor';

// 2. Add to the right panel, after the page-link section (~line 548)
// Inside the `selectedCategoryId ? (...)` branch:

<div className="space-y-2">
    <Label className="text-xs uppercase text-muted-foreground">
        <T>Permissions</T>
    </Label>
    <AclEditor
        resourceType="category"
        mount={selectedCategoryId}
        path="/"
    />
</div>
```

The `AclEditor` already handles:
- Anonymous toggle with permission picker
- Authenticated toggle with permission picker
- Per-user grants via `UserPicker`
- Active permissions table with revoke buttons

### Props mapping

| AclEditor prop | StorageManager (VFS) | CategoryManager |
|---------------|---------------------|-----------------|
| `resourceType` | `'vfs'` (default) | `'category'` |
| `mount` | mount name (`'home'`) | category UUID |
| `path` | folder path (`'/shared'`) | always `'/'` |

### Files to change

| File | Change |
|------|--------|
| [CategoryManager.tsx](../src/components/widgets/CategoryManager.tsx) | Import `AclEditor`, add it to selected-category view |

No other files need modification — the backend, API, and ACL editor component are all ready.

---

## Architecture Reference

```
┌── Supabase ─────────────────────────┐
│  resource_acl table (RLS-enabled)   │
│  ┌─ resource_type: 'category'       │
│  ├─ resource_id:   category UUID    │
│  ├─ user_id / group_name            │
│  ├─ permissions[]                   │
│  └─ path: '/'                       │
└─────────────────────────────────────┘
         ▲
┌── Server ───────────────────────────┐
│  db-acl.ts        IAclBackend       │
│  ├ registerAclBackend('vfs', ...)   │
│  └ registerAclBackend('category',…) │  ✅
│  db-acl-db.ts     DbAclBackend     │  ✅ virtual ID fix
│  db-categories.ts CRUD + cache      │
└─────────────────────────────────────┘
         ▲
┌── Client ───────────────────────────┐
│  client-acl.ts    fetch/grant/revoke│  reuse as-is
│  AclEditor.tsx    UI                │  reuse as-is
│  CategoryManager  + ACL section     │  🔲 next step
└─────────────────────────────────────┘
```

## Permission Model

| Permission | Meaning |
|------------|---------|
| `read`     | View category and its items |
| `list`     | Browse category in tree navigation |
| `write`    | Add/remove items from category |
| `manage`   | Edit category metadata |
| `admin`    | Full control including ACL |

### Default Behavior

Categories default to their `visibility` field (`public`/`unlisted`/`private`). ACL entries override visibility for fine-grained control.

### Phase 2 — Future

| Task | Description |
|------|-------------|
| ACL-filtered category reads | Filter `fetchCategoriesServer` by caller's `list` permission |
| ACL-filtered tree view | Hide restricted categories in `CategoryTreeView.tsx` |
| User-owned category ACL mgmt | Let users manage permissions on categories they own |

## File Reference

| File | Role | Status |
|------|------|--------|
| [resource_acl.sql](../supabase/migrations/20260219215000_create_resource_acl.sql) | DB schema | ✅ No changes needed |
| [db-acl.ts](../server/src/products/serving/db/db-acl.ts) | ACL orchestrator | ✅ No changes needed |
| [db-acl-db.ts](../server/src/products/serving/db/db-acl-db.ts) | Supabase backend | ✅ Virtual ID fix |
| [index.ts](../server/src/products/serving/index.ts) | Backend registration | ✅ Category registered |
| [category-acl.e2e.test.ts](../server/src/products/serving/__tests__/category-acl.e2e.test.ts) | E2E tests | ✅ 19/19 pass |
| [CategoryManager.tsx](../src/components/widgets/CategoryManager.tsx) | Category UI | 🔲 Add AclEditor |
| [client-acl.ts](../src/modules/user/client-acl.ts) | Client ACL API | ✅ No changes needed |
| [AclEditor.tsx](../src/components/admin/AclEditor.tsx) | ACL UI component | ✅ No changes needed |
