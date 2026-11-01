# Groups & ACL — Proposal

## Problem

The ACL system currently hacks `anonymous` and `authenticated` as **sentinel strings** mapped to `group_name` in [resource_acl](../supabase/migrations/20260219215000_create_resource_acl.sql). This works but:

- No concept of custom groups (`vendors`, `editors`, etc.)
- Virtual user ID mapping in [db-acl-db.ts](../server/src/products/serving/db/db-acl-db.ts) is fragile
- No UI for managing groups or discovering group membership
- Can't answer "which groups does user X belong to?" or "who is in group Y?"

## @polymech/acl Package

The [acl package](../../polymech-mono/packages/acl/README.md) already has a proper RBAC system:

| Concept | Implementation |
|---------|---------------|
| Core | [Acl.ts](../../polymech-mono/packages/acl/src/Acl.ts) — Zend-inspired RBAC: `allow(roles, resources, perms)`, `isAllowed(user, resource, perms)` |
| Backend interface | [IBackend](../../polymech-mono/packages/acl/src/interfaces.ts) — bucket-based key-value storage |
| Backends | [MemoryBackend](../../polymech-mono/packages/acl/src/data/MemoryBackend.ts), [FileBackend](../../polymech-mono/packages/acl/src/data/FileBackend.ts) |
| VFS layer | [vfs-acl.ts](../../polymech-mono/packages/acl/src/vfs/vfs-acl.ts), [AclVfsClient](../../polymech-mono/packages/acl/src/vfs/AclVfsClient.ts) |

The `Acl` class already supports:
- `addUserRoles(userId, roles)` / `removeUserRoles(userId, roles)`
- `userRoles(userId)` → returns all roles for a user
- `roleUsers(role)` → returns all users in a role
- `addRoleParents(role, parents)` → role hierarchy
- `isAllowed(userId, resource, permissions)` → permission check

**Groups = Roles in the ACL model.** The `Acl` class uses "roles" — groups are just roles with membership. The missing piece is a **Supabase-backed backend** that persists role/group data in the DB instead of files/memory.

## Current Architecture

```
pm-pics (app)                          @polymech/acl (package)
─────────────────                      ──────────────────────
resource_acl table                     Acl class
├── user_id  UUID FK                   ├── addUserRoles()
├── group_name TEXT (hack)             ├── isAllowed()
│                                      └── IBackend
db-acl-db.ts (DbAclBackend)               ├── MemoryBackend
├── sentinel mapping hack                  └── FileBackend
├── rowToEntry / entryToRow
└── direct Supabase queries            VFS extensions
                                       ├── AclVfsClient
db-acl.ts (orchestrator)               ├── vfs-acl.ts
├── IAclBackend (app-level)            └── uses FileBackend
├── registerAclBackend()
└── fetchAclSettings / grant / revoke
```

The problem: `pm-pics` has its own `IAclBackend` + `DbAclBackend` that **duplicate** what `@polymech/acl` does, but with Supabase instead of files. The sentinel hack exists because `DbAclBackend` bypasses `Acl` entirely.

## Proposed Architecture

### New backend in @polymech/acl

```
@polymech/acl
├── src/
│   ├── data/
│   │   ├── MemoryBackend.ts        (existing)
│   │   ├── FileBackend.ts          (existing)
│   │   └── SupabaseBackend.ts      [NEW] — IBackend using Supabase tables
│   ├── groups/
│   │   ├── GroupManager.ts         [NEW] — CRUD for groups + membership
│   │   └── interfaces.ts          [NEW] — IGroupStore, Group, GroupMember
│   ├── Acl.ts                      (existing, no changes)
│   └── interfaces.ts              (existing, no changes)
```

The key insight: **the `Acl` class doesn't need to change**. It already handles roles, users, and permissions generically. We just need:

1. **`SupabaseBackend`** — implements `IBackend` using Supabase tables instead of in-memory maps
2. **`GroupManager`** — thin wrapper for creating/listing groups and managing membership (writes to `groups` + `group_members` tables)

### Database Tables

```sql
-- Groups definition
create table public.groups (
    id          uuid not null default gen_random_uuid() primary key,
    slug        text not null unique,          -- 'editors', 'vendors'
    name        text not null,                 -- 'Editors', 'Vendors'
    description text,
    builtin     boolean not null default false, -- true for anonymous/authenticated
    created_by  uuid references auth.users(id),
    created_at  timestamptz default now()
);

-- Seed built-in groups
insert into public.groups (slug, name, builtin) values
    ('anonymous', 'Anonymous', true),
    ('authenticated', 'Authenticated Users', true);

-- Group membership (not needed for built-in groups)
create table public.group_members (
    id       uuid not null default gen_random_uuid() primary key,
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id  uuid not null references auth.users(id) on delete cascade,
    role     text default 'member',
    added_at timestamptz default now(),
    unique(group_id, user_id)
);
```

### How It Connects

```
resource_acl.group_name  ──references──>  groups.slug
groups.builtin = true    →  membership is implicit (auth state)
groups.builtin = false   →  membership via group_members
```

`resource_acl.group_name` stays as-is — becomes a soft FK to `groups.slug`.

### Resolution Flow

```
1. Load ACL entries for resource R
2. For each entry:
   ├── entry.user_id === caller       → direct user grant
   ├── entry.group_name = 'anonymous' → builtin, match everyone
   ├── entry.group_name = 'authenticated' && caller.authenticated → match
   └── entry.group_name = 'vendors'   → check group_members → match?
3. Any match with required permission → allow
```

### Relationship to user_roles

> **Keep `user_roles` separate.** It's for system-level admin. Groups are for content/resource access control.

## Files to Change

### Phase 1 — @polymech/acl package

| File | Change |
|------|--------|
| [NEW] `packages/acl/src/groups/interfaces.ts` | `IGroupStore`, `Group`, `GroupMember` types |
| [NEW] `packages/acl/src/groups/GroupManager.ts` | CRUD: `fetchGroups`, `createGroup`, `addMember`, `removeMember`, `getGroupsForUser` |
| [MODIFY] [index.ts](../../polymech-mono/packages/acl/src/index.ts) | Export `GroupManager` + types |

### Phase 2 — pm-pics integration

| File | Change |
|------|--------|
| [NEW] `supabase/migrations/xxx_create_groups.sql` | `groups` + `group_members` tables |
| [MODIFY] [db-acl-db.ts](../server/src/products/serving/db/db-acl-db.ts) | Remove sentinel hack, use `GroupManager` for membership checks |
| [MODIFY] [db-categories.ts](../server/src/products/serving/db/db-categories.ts) | `isCategoryVisible()` uses group membership lookup |
| [MODIFY] [db-acl.ts](../server/src/products/serving/db/db-acl.ts) | Group-aware permission resolution |
| [MODIFY] [index.ts](../server/src/products/serving/index.ts) | Register group API routes |
| [NEW] `server/src/products/serving/db/db-groups.ts` | Handlers for groups API |
| [NEW] `src/modules/groups/client-groups.ts` | Client API |

### Phase 3 — UI

| File | Change |
|------|--------|
| [MODIFY] [AclEditor.tsx](../src/components/admin/AclEditor.tsx) | Dynamic group picker from `groups` table |
| [NEW] `src/components/admin/GroupManager.tsx` | Admin UI: create groups, manage members |
| [MODIFY] [CategoryManager.tsx](../src/components/widgets/CategoryManager.tsx) | Group picker in permissions |

## API Design

```
GET    /api/groups                     → list all groups
POST   /api/groups                     → create group (admin)
PATCH  /api/groups/:id                 → update group (admin)
DELETE /api/groups/:id                 → delete group (admin, not builtin)

GET    /api/groups/:id/members         → list members
POST   /api/groups/:id/members         → add member
DELETE /api/groups/:id/members/:userId → remove member

GET    /api/users/:id/groups           → groups for a user (self or admin)
```

## AclEntry Type Evolution

```diff
 interface AclEntry {
-    userId?: string;      // real UUID or 'anonymous'/'authenticated' (hack)
-    group?: string;       // unused for virtual IDs
+    userId?: string;      // real UUID only
+    groupSlug?: string;   // 'anonymous', 'authenticated', 'vendors', etc.
     path?: string;
     permissions: string[];
 }
```

## Priority

| Phase | Effort | Enables |
|-------|--------|---------|
| 1. @polymech/acl groups | ~2h | Reusable group system for any app |
| 2. pm-pics integration | ~2h | Category/resource visibility by group |
| 3. UI | ~3h | Admin can manage groups visually |
