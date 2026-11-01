# Layered / Nested VFS

> **Status:** Operational — core bind resolution, context refactor, config extraction, and path rebasing complete  
> **Date:** 2026-03-11  
> **Last updated:** 2026-03-11T23:20

## 1. Problem

Today every VFS is a **flat, top-level mount** (`home`, `root`, `www`, `user:<uuid>`).  
Addresses use `mount:/path` everywhere — API routes, `AclEditor`, `MountManager.resolve()`, the `FileBrowser`.

This prevents a key capability: **mounting one VFS inside another** (like Linux's `mount --bind`).  
Use-cases:

| Scenario | What you want |
|---|---|
| Shared media library | Mount `media` at `home:/assets/shared` so a user sees it in their tree |
| Multi-site builder | Mount `site-b` at `www:/sites/b` — each sub-site is its own VFS with its own ACL |
| User collab folders | Mount `user:Alice:/public` inside `user:Bob:/collabs/alice` |
| Read-only overlays | Mount a system `templates` VFS read-only at `home:/templates` |

---

## 2. Current Architecture (Status Quo)

```
┌─────────────────────────────────────────────────────────┐
│  API route: /api/vfs/{op}/{mount}/{path*}               │
└──────────────┬──────────────────────────────────────────┘
               │
      resolveMount(c, userId)          ← flat lookup
               │
   ┌───────────▼───────────┐
   │     MountManager      │  findByName("www")  → IMount
   │     (vfs.json array)  │  findByName("home") → root + userId
   └───────────┬───────────┘
               │
      createVFS(mount, ownerId, callerId)
               │
   ┌───────────▼───────────┐
   │  AclVfsClient         │  ← wraps LocalVFS with path-scoped ACL
   │  (vfs-settings.json)  │
   └───────────┬───────────┘
               │
   ┌───────────▼───────────┐
   │      LocalVFS         │  ← root-jailed fs operations
   └───────────────────────┘
```

### Key constraints

1. **`MountManager`** is a flat array — no nesting concept.
2. **`resolveMount()`** returns a single `{ mount, ownerId }` — one VFS driver per request.
3. **`AclVfsClient.#guard()`** checks `resourceChain(ownerId, subpath)` against a single `vfs-settings.json`.
4. **`INode.path`** is always relative to the mount root — no cross-mount references.
5. **Frontend** (`FileBrowser`, `AclEditor`) uses `mount:path` strings as the canonical address.

---

## 3. Proposed Design: Bind Mounts

### 3.1 Mental model: `mount --bind`

This is **not** an overlay filesystem. It's a bind mount — the same semantics as:

```bash
mount --bind /srv/media /home/bob/assets/shared
```

The bound directory **is** the source directory. There's no copy, no union, no layering in the OverlayFS sense. You're looking at the same inodes through a different path. Writes go to the source. Deletes hit the source. `stat` returns the source's metadata.

The only things the bind can add:
- **`readonly`** — like `mount --bind -o ro`
- **`acl`** — choose whose permission rules govern access (see §6)

### 3.2 `VfsBind` interface

```ts
interface VfsBind {
  /** Unique bind id (slug or uuid) */
  id: string;

  /** Source: what to mount */
  source: {
    mount: string;            // existing mount name
    subpath?: string;         // optional sub-tree of the source
  };

  /** Target: where to mount it */
  target: {
    mount: string;            // host mount name (e.g. "home", "www")
    path: string;             // path inside the host  (e.g. "assets/shared")
  };

  /** Options */
  readonly?: boolean;         // enforce read-only  (default: false)

  /**
   * ACL strategy:
   *   "source"  → source mount's ACL governs (default, like bind mount)
   *   "inherit" → target/host ACL governs; source accessed raw
   */
  acl?: "source" | "inherit";
}
```

### 3.3 Storage

Binds are stored in `config/vfs-binds.json` (system-wide) and optionally in per-user `vfs-settings.json` under a `binds` key:

```jsonc
// config/vfs-binds.json  (system-wide)
[
  {
    "id": "shared-media",
    "source": { "mount": "media" },
    "target": { "mount": "home", "path": "assets/shared" },
    "readonly": true,
    "acl": "source"
  }
]
```

```jsonc
// vfs-settings.json  (per-user, extends existing format)
{
  "owner": "aaa-bbb-ccc",
  "acl": [ ... ],
  "binds": [
    {
      "id": "alice-collab",
      "source": { "mount": "user:aaa-bbb-ccc", "subpath": "public" },
      "target": { "path": "collabs/alice" },
      "acl": "source"
    }
  ]
}
```

---

## 4. Resolution Algorithm

When a request arrives for `mount:/some/deep/path`:

```
1.  resolveMount(mount, userId) → host IMount  (unchanged)

2.  NEW: resolveBind(hostMount, subpath, visited = [])
    - Walk the bind table for binds targeting this host mount
    - Find the longest-prefix match:
        bind.target.path is a prefix of subpath
    - If match found:
        remainingPath = subpath.slice(bind.target.path.length)
        return { bind, remainingPath }
    - If no match: proceed with host VFS as today

3.  If bind matched:
    - Guard: if source mount already in `visited`, throw ELOOP
    - Push source mount onto visited
    - Resolve source mount → source IMount
    - sourceSubpath = join(bind.source.subpath || '', remainingPath)
    - RECURSE: resolveBind(sourceMount, sourceSubpath, visited)
      (handles nested binds — a bind inside a bind)
    - createVFS(sourceMount, sourceOwner, callerId)
    - If bind.readonly → wrap in ReadOnlyVfsProxy
    - ACL: see §6
```

### Prefix-match example

```
Request:       home:/assets/shared/photos/2024/img.jpg
Bind:          target.path = "assets/shared"  → source.mount = "media"
               ────────────────────────────
Remaining:     photos/2024/img.jpg
Resolved to:   media:/photos/2024/img.jpg
```

---

## 5. `readdir` Merging (Virtual Entries)

When listing a directory that **contains** a bind mount point, the host listing needs to include the bind as a directory entry:

```
host readdir("assets/")  returns:  [own-file.txt, readme.md]
bind target.path = "assets/shared"

merged result:  [own-file.txt, readme.md, shared/]
                                           ^^^^^^ virtual entry from bind
```

### Implementation

```ts
async readdir(path: string): Promise<INode[]> {
  const hostEntries = await hostVfs.readdir(path);

  // Find binds whose target.path is a direct child of `path`
  const bindEntries = binds
    .filter(b => {
      const rel = b.target.path.replace(path + '/', '');
      return b.target.path.startsWith(path + '/') && !rel.includes('/');
    })
    .map(b => ({
      name: b.target.path.split('/').pop()!,
      path: b.target.path,
      type: 'dir',
      mime: 'inode/directory',
      size: 0,
      mtime: 0,
      parent: path,
      _bind: b.id,          // tag for the UI
    }));

  return [...hostEntries, ...bindEntries];
}
```

### Edge case: host dir already exists at bind path

Just like `mount --bind` on Linux — if the host has a real directory at `assets/shared/`, the bind **shadows** it. The host's contents are invisible while the bind is active. When the bind is removed, the original contents reappear.

This is important: we don't merge host + source contents. The bind completely replaces the path.

---

## 6. ACL Interaction

### 6.1 `acl: "source"` (default)

The **source VFS's own ACL** governs. The bind is a portal — you must have permissions in the source mount.

- `AclVfsClient` is created with the **source** ownerId
- `resourceChain()` operates on source paths (relative to source root)
- The host ACL does **not** apply to bind contents
- The source owner's `vfs-settings.json` determines who can read/write

**Real-world analogy:** You `mount --bind` Alice's `/srv/shared` into Bob's home. Accessing files checks Alice's POSIX permissions, not Bob's.

**When to use:** Cross-user sharing, system mounts, anything where the source owner should control access.

### 6.2 `acl: "inherit"`

The **target/host ACL** governs the bound path. The source VFS is accessed **without ACL wrapping** (raw `LocalVFS`).

- `resourceChain()` uses the **host** ownerId and the **full host path** (including the bind prefix)
- Host owner can set ACL rules on `assets/shared/*` in their own `vfs-settings.json`
- Source VFS permissions are ignored

**Real-world analogy:** You `mount --bind` a shared volume into a container. The container's own permission model governs access; the underlying volume has no opinion.

**When to use:** Admin-managed shared content where one ACL tree should cover everything. A `www` mount that binds in sub-sites — the www ACL governs all of them.

### 6.3 ACL edge cases

#### Scenario A: Bob mounts Alice's public folder (acl: "source")
```
Bind:   source=user:alice:/public → target=user:bob:/collabs/alice
ACL:    "source"

Bob accesses:     user:bob:/collabs/alice/photo.jpg
Resolves to:      user:alice:/public/photo.jpg
ACL check:        Does Bob have 'read' on vfs:alice:/public/photo.jpg?
                  → Checked against Alice's vfs-settings.json
                  → Alice must have granted Bob read access
```

#### Scenario B: Admin binds templates into user home (acl: "inherit")
```
Bind:   source=templates:/ → target=home:/templates   acl: "inherit"

User accesses:    home:/templates/invoice.docx
Resolves to:      templates:/invoice.docx
ACL check:        Does user have 'read' on vfs:<userId>:/templates/invoice.docx?
                  → Checked against user's own vfs-settings.json
                  → User is owner of their home, so they have '*' on '/' → allowed
```

#### Scenario C: Third-party accesses a bind path
```
Bind:   source=media:/ → target=user:bob:/assets/shared   acl: "source"

Carol (no grants) accesses:    user:bob:/assets/shared/photo.jpg
Resolves to:                   media:/photo.jpg
ACL check:                     Does Carol have 'read' on media's ACL?
                               → media mount's vfs-settings.json decides
                               → If media grants public read: allowed
                               → If media requires explicit grants: denied
```

#### Scenario D: Write through a readonly bind
```
Bind:   source=media:/ → target=home:/media   readonly: true

User writes:    home:/media/new-file.txt
Result:         EACCES — ReadOnlyVfsProxy rejects before ACL is even checked
                (structural constraint, not permission)
```

#### Scenario E: Permission granted on host path, but bind uses source ACL
```
Bind:   source=user:alice:/docs → target=user:bob:/shared/alice   acl: "source"

Bob's vfs-settings.json grants Carol read on /shared/*
Carol accesses:    user:bob:/shared/alice/secret.txt
Resolves to:       user:alice:/docs/secret.txt
ACL check:         Alice's ACL (source) — Bob's grant is irrelevant
Result:            Carol is denied unless Alice also granted her access
```

This is the most important edge case to document. **With `acl: "source"`, host-side grants do NOT propagate into binds.** The bind is an ACL boundary. This matches `mount --bind` semantics — permissions come from the mounted filesystem, not the mount point.

### 6.4 `readonly: true`

A `ReadOnlyVfsProxy` wraps the resolved VFS and throws `EACCES` on any write/delete/mkdir/rename/copy operation. This is independent of ACL — it's a hard structural constraint on the bind.

Applied **after** ACL resolution: even if the ACL would allow write, readonly blocks it.

---

## 7. Real-World Edge Cases (`mount --bind` Parity)

### 7.1 Rename/move across bind boundary

```
User renames:    home:/my-file.txt → home:/assets/shared/my-file.txt
                 ^^^^ host FS          ^^^^ bind (source = media)
```

This is a **cross-device rename** in Linux terms. `rename(2)` returns `EXDEV`. Our VFS must do the same:

- Detect that source and destination resolve to different underlying VFS instances
- Return a clear error: `"Cannot move across bind boundaries. Copy + delete instead."`
- Frontend should catch this and offer a copy-then-delete flow

### 7.2 Hard links across bind boundary

Not applicable — our VFS doesn't support hard links. But symlinks (if ever added) should NOT follow across bind boundaries by default (same as `mount --bind`).

### 7.3 `stat` on the bind mount point itself

```
stat("assets/shared")  — what does this return?
```

Two options:
- **Option A (Linux-like):** Return the `stat` of the source root dir (or source subpath). This is what `mount --bind` does — the mount point takes on the stat of the mounted thing.
- **Option B (synthetic):** Return a synthetic `INode` with `_bind` metadata.

**Decision: Option A.** The bind mount point behaves as the source root. `stat` returns the source's `mtime`, `size`, etc. The `_bind` flag is only added during `readdir` so the UI can show an icon, but `stat` is transparent.

### 7.4 Deleting the bind mount point from the host

```
rm -rf home:/assets/shared   — what happens?
```

This should **NOT** delete the source. It should **unmount** (remove the bind).

In Linux, `rm -rf /mnt/bind-target` would delete the source's contents (dangerous!). We should be safer:

- `rmdir` on a bind mount point → error: `"Cannot delete bind mount point. Use unbind."`
- Files **inside** the bind: `rm` works normally against the source (unless readonly)

### 7.5 Creating a file/dir at the exact bind path when no bind exists

No issue — if no bind matches, the path is a regular host path. If a bind is later created targeting that path, it shadows the host content (existing host dir becomes invisible while the bind is active).

### 7.6 Nested binds (bind inside a bind)

```
Bind 1:  source=media:/ → target=home:/media
Bind 2:  source=archive:/ → target=media:/old

User accesses:  home:/media/old/2020/photo.jpg
```

Resolution chain:
1. `home:/media/old/2020/photo.jpg` → Bind 1 matches → `media:/old/2020/photo.jpg`
2. `media:/old/2020/photo.jpg` → Bind 2 matches → `archive:/2020/photo.jpg`
3. `archive` has no binds → `LocalVFS` resolves `2020/photo.jpg`

This works because `resolveBind()` is recursive with cycle detection (visited set). Max depth = 8.

### 7.7 Two binds with overlapping target paths

```
Bind A:  source=media:/   → target=home:/assets
Bind B:  source=archive:/ → target=home:/assets/old
```

`home:/assets/old/file.txt` — which bind wins?

**Longest prefix match:** Bind B (`assets/old`) is more specific than Bind A (`assets`). Bind B wins. This matches Linux mount semantics — more specific mount points shadow less specific ones.

`home:/assets/photos/file.txt` → Bind A wins (only match).

### 7.8 Bind source doesn't exist or is offline

```
Bind:   source=remote-nas:/ → target=home:/nas-backup

remote-nas mount is unreachable
```

- `readdir` on the host dir containing the bind: still shows `nas-backup/` as a virtual entry
- Any operation inside the bind: returns `EIO` or `ENOENT` with message: `"Bind source 'remote-nas' is unavailable"`
- The bind doesn't disappear — it's still configured. Like an unmounted disk in `/etc/fstab`.

### Shadowing example

```
Host readdir("assets/"):  [shared/, photos/, readme.md]
Bind target = "assets/shared" → source = media

Result: [shared/ (_bind:"shared-media"), photos/, readme.md]
         ^^^^^^ host's 'shared' dir is shadowed by the bind
```

The host's `assets/shared/` directory still exists on disk — it's just invisible while the bind is active.

---

## 9. ACL Cascade Diagram

```
                 ┌──────────────────────────────┐
                 │    Request arrives at         │
                 │  host-mount:/some/bind/path   │
                 └──────────────┬───────────────┘
                                │
                   resolveBind(path) → match?
                       │                   │
                      no                  yes
                       │                   │
               ┌───────▼──────┐    ┌───────▼───────────────┐
               │ Normal flow  │    │  acl mode?            │
               │ host ACL     │    └──┬───────────────┬────┘
               └──────────────┘       │               │
                              acl:"source"    acl:"inherit"
                                      │               │
                          ┌───────────▼──┐   ┌────────▼──────────┐
                          │ Source mount  │   │ Host ACL checks   │
                          │ AclVfsClient │   │ path = full host   │
                          │ source owner │   │ path through bind  │
                          │ source paths │   │                    │
                          └──────┬───────┘   │ Source accessed    │
                                 │           │ raw (no ACL wrap)  │
                          ┌──────▼───────┐   └────────┬───────────┘
                          │ LocalVFS     │            │
                          │ source root  ◄────────────┘
                          └──────────────┘

                 readonly: true? → wrap either path in ReadOnlyVfsProxy
```

---

## 10. CLI Interface

The VFS should behave like any other filesystem — including a CLI. This enables scripting, future FUSE integration, and admin automation.



### 10.2 `pmvfs resolve` (debug tool)

Shows the full resolution path — invaluable for debugging nested binds:

```
$ pmvfs resolve home:/assets/shared/photos/2024/img.jpg

home:/assets/shared/photos/2024/img.jpg
  ├─ bind "shared-media" (acl: source, readonly: true)
  ├─ → media:/photos/2024/img.jpg
  └─ → LocalVFS /srv/data/media/photos/2024/img.jpg
```

### 10.3 Implementation

The CLI is a thin wrapper over the HTTP API (`/api/vfs/*`). Uses the same auth tokens as the web client. This means:

- No special server-side code — CLI and web share the same endpoints
- Auth via `PMVFS_TOKEN` env var or `~/.pmvfs/auth.json`
- Output formats: human-readable (default), JSON (`--json`), tab-separated (`--tsv`)

### 10.4 Future: FUSE bridge

When FUSE/WinFSP support is added, the CLI becomes the management tool:

```bash
# Mount the entire VFS namespace as a drive
pmvfs fuse mount Z:                    # Windows (WinFSP)
pmvfs fuse mount /mnt/pmvfs            # Linux (FUSE)

# The bind resolution happens inside the FUSE driver
# User sees:  Z:\home\assets\shared\photos\  (backed by media mount)
```

The FUSE driver would use the same `resolveBind()` algorithm. The CLI is the control plane; FUSE is the data plane.

---

## 11. Impact Analysis

### Server changes

| File | Change |
|---|---|
| `vfs/fs/VFS.ts` | Add `VfsBind` interface, `BindManager` class |
| `api/vfs.ts` | After `resolveMount()`, add `resolveBind()` step. Modify `createVFS` for source resolution. Modify `readdir` for merge/shadow. Cross-bind rename detection. |
| `api/vfs-routes.ts` | Add routes for bind CRUD: `GET/POST/DELETE /api/vfs/binds/{mount}` |
| `api/acl-helpers.ts` | Handle `acl: "source" \| "inherit"` selection |
| `config/` | New `vfs-binds.json` config file |

### `@polymech/acl` changes

| File | Change |
|---|---|
| `vfs/vfs-acl.ts` | `VfsSettings` type: add optional `binds: VfsBind[]` |
| `vfs/AclVfsClient.ts` | No change — bind resolution is a layer above |

### Frontend changes

| File | Change |
|---|---|
| `AclEditor.tsx` | Show bind badge on bound entries; block ACL editing if `acl: "source"` (redirect to source) |
| `FileBrowser` / `useVfsAdapter` | Handle `_bind` flag; show mount icon; intercept cross-bind rename with error UX |
| `client-acl.ts` | Add bind CRUD API calls |

### CLI (new)

| File | Change |
|---|---|
| `cli/pmvfs.ts` | New CLI entry point |
| `cli/commands/` | `bind.ts`, `ls.ts`, `cat.ts`, `cp.ts`, `mv.ts`, `rm.ts`, `mkdir.ts`, `stat.ts`, `resolve.ts`, `acl.ts` |

### Wire format

```
Existing:   GET /api/vfs/ls/home/assets/shared/photos
                                ^^^^^^^^^^^^^^ host path

With binds: same URL, server resolves transparently.
            No client-side path change needed.
```

---
The token encodes: who granted it, what permissions, expiry. Eliminates the need for Alice to know Bob's UUID upfront.

### 14.3 WebDAV surface

A thin WebDAV adapter over the bind-aware VFS would let users mount their space natively in Windows Explorer / macOS Finder / Linux file managers:

```
net use Z: https://service.polymech.info/webdav/home
```

Binds would be transparent — the user sees `Z:\assets\shared\` backed by the media mount.

---

## 15. Open Questions

1. **Copy-on-write mode?** When `acl: "source"` and `readonly: false`, writes hit the source. Should we support a COW mode where writes go to the host instead (overlay-style)?

2. **Search indexing:** Should search traverse into binds? Probably yes for queries, configurable for indexing (to avoid double-indexing the same physical content via multiple bind paths).

3. **Per-user binds in multi-tenant:** Should regular users create binds (mounting shared system mounts into their home), or admin-only? Likely: users can bind sources they already have `list` permission on.

4. **Delete semantics:** `rm` on files inside a bind = deletes from source (unless readonly). `rmdir` on the bind mount point itself = error. `unbind` is a separate operation.

5. **Disk usage / quota:** If `media` is bound into 5 user homes, `du` on each home would count the media content 5 times. Need a way to exclude bind paths from quota calculations.

---

## 16. Implementation Status

### What's done ✅

| Feature | Status | Location |
|---|---|---|
| `VfsBind` interface + `BindManager` | ✅ Done | `vfs/fs/VFS.ts` |
| `resolveBind()` with recursive resolution + cycle detection | ✅ Done | `api/vfs.ts` |
| `config/vfs-binds.json` with 3 binds (root-assets, home-assets, machines-firmware) | ✅ Done | `config/vfs-binds.json` |
| `resolveVfsContext()` — unified context resolution | ✅ Done | `api/vfs-context.ts` |
| All handlers migrated to `resolveVfsContext()` | ✅ Done | LsRoot, Ls, Read, Write, Delete, Upload, Mkdir, Get, Stat, Compress |
| `getVirtualBindEntries()` — virtual dir injection in ls | ✅ Done | `api/vfs.ts` |
| `mergeVirtualEntries()` — dedup real + virtual | ✅ Done | `api/vfs.ts` |
| `rebaseBindPaths()` — re-prefix paths from source→host context | ✅ Done | `api/vfs.ts` |
| `vfs-config.ts` — shared config module + test injection API | ✅ Done | `api/vfs-config.ts` |
| Bare UUID mount resolution (`/api/vfs/ls/<uuid>`) | ✅ Done | `api/vfs.ts`, `db-acl-vfs.ts` |
| `db-acl-vfs.ts` deduplicated — uses shared `vfs-config.ts` | ✅ Done | `serving/db/db-acl-vfs.ts` |
| `VfsContext.requestedSubpath` for bind path correction | ✅ Done | `api/vfs-context.ts` |
| E2E tests — 6/6 nested mount tests passing | ✅ Done | `__tests__/vfs-nested.e2e.test.ts` |

### Key modules

```
api/vfs-config.ts      ← Single source of truth for mount/bind config
                          getMounts(), getBinds(), setMounts(), setBinds(), resetVfsConfig()
api/vfs-context.ts     ← resolveVfsContext() — one call, full context
api/vfs.ts             ← Handlers, resolveBind(), rebaseBindPaths(),
                          getMountManager(), getBindManager(), resetManagers()
serving/db/db-acl-vfs.ts ← ACL backend — imports getMounts() from vfs-config.ts
```

### Test injection API

```typescript
import { setMounts, setBinds, resetVfsConfig } from '../api/vfs-config.js';
import { resetManagers } from '../api/vfs.js';

beforeAll(() => {
  setMounts([
    { name: 'test-root', type: 'fs', path: tmpDir },
    { name: 'test-src',  type: 'fs', path: srcDir },
  ]);
  setBinds([
    { id: 'test-bind', source: { mount: 'test-src' },
      target: { mount: 'test-root', path: 'linked' } }
  ]);
  resetManagers();  // clear cached MountManager/BindManager
});

afterAll(() => { resetVfsConfig(); resetManagers(); });
```

### Security notes ⚠️

1. **Path normalization** — `sanitizeSubpath()` runs before VFS operations. Bind prefix matching uses normalized paths.
2. **`startsWith` prefix matching** — bind paths come from admin config only (trusted). User-created binds (future) must validate through `sanitizeSubpath()` at creation time.
3. **ACL boundary** — with `acl: "source"`, host ACL is bypassed. Bind mount point visibility is information leakage (acceptable, noted for hardening).
4. **Cycle detection** — `resolveBind()` tracks visited mounts in a `Set<string>` and throws `ELOOP`. Max depth = 8.

---

## 17. TODO

### Priority 1 — `readonly` support

- [ ] Implement `ReadOnlyVfsProxy` wrapper
- [ ] Apply when `bind.readonly === true` after VFS creation
- [ ] Test: write through readonly bind → EACCES

### Priority 2 — Cross-bind operations

- [ ] `handleVfsRename` — cross-bind `EXDEV` detection
- [ ] `handleVfsCopy` — cross-bind copy support

### Priority 3 — ACL `inherit` mode

- [ ] Implement: when `acl: "inherit"`, create VFS with host ownerId but source mount's LocalVFS
- [ ] Test: host ACL governs access to bind content

### Priority 4 — Frontend

- [ ] `FileBrowser` shows bind icon for virtual entries
- [ ] `AclEditor` shows bind badge, blocks ACL edit if `acl: "source"`
- [ ] Cross-bind rename error UX

### Priority 5 — Admin API

- [ ] `GET /api/vfs/binds` — list all binds
- [ ] `POST /api/vfs/binds` — create bind (admin only)
- [ ] `DELETE /api/vfs/binds/:id` — remove bind
- [ ] Input validation: sanitize bind paths at creation

### Priority 6 — CLI + FUSE

- [ ] `pmvfs` CLI entry point
- [ ] Basic commands: `ls`, `cat`, `bind create/ls/rm`
- [ ] FUSE bridge (future)
