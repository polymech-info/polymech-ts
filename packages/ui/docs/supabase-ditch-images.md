# Supabase -> Internal VFS (Images) Migration

## Goal (current)

Move image storage paths from Supabase bucket URLs to internal VFS URLs:

- keep existing `pictures` workflow
- keep historical records readable during migration
- canonicalize to VFS URL format for all migrated rows

---

## Current Implemented State

- Client upload paths are now VFS-only:
  - `src/lib/uploadUtils.ts` always posts `forward=vfs`
  - `src/components/ImageWizard/db.ts` uses VFS upload flow
  - `src/modules/ai/imageTools.ts` uses VFS upload flow
  - `src/modules/posts/client-pictures.ts` uses VFS upload flow
- Server image endpoint supports `forward=vfs` in `server/src/products/images/index.ts`:
  - writes through VFS APIs
  - bootstraps per-user ACL grant (`read/list/mkdir/write` on `/<user_id>`)
  - returns absolute VFS URLs via `IMAGE_VFS_URL`
  - extracts metadata from original input buffer (before Sharp strips EXIF)
- Legacy responsive URL compatibility is implemented:
  - nested `/api/images/render?url=...` wrappers are unwrapped for source resolution
  - legacy `/api/images/cache/<pictureId>_thumb.jpg` lookup falls back to `pictures.image_url`

- VFS mount already exists:
  - mount: `images`
  - path: `./storage/images`
  - config: `server/config/vfs.json`

---

## Canonical URL Format

- Stored `pictures.image_url`:
  - `<IMAGE_VFS_URL>/api/vfs/get/<IMAGE_VFS_STORE>/<user_id>/<picture_id>[.<ext>]`
- `token` is optional at request time for protected reads.
- `token` is not persisted in DB URLs.

---

## Migration Commands (implemented)

### 1) Backup Supabase storage into local images root

```bash
pm-cli-cms backup-store --source ./server --target ./server/storage/images
```

Special behavior for this target:
- writes `pictures/cache/...` directly into `server/storage/images/cache/...`
- writes UUID aliases into `server/storage/images/storage/<user_uid>/<picture_id>.<ext>`

### 2) Rewrite `pictures.image_url` to VFS URLs

```bash
pm-cli-cms migrate-images-vfs --source ./server --dry-run true
pm-cli-cms migrate-images-vfs --source ./server --dry-run false
```

`migrate-images-vfs` now supports:
- direct Supabase picture URLs:
  - `/storage/v1/object/public/pictures/cache/...`
  - `/storage/v1/object/public/pictures/<user>/<name>`
- nested render wrappers:
  - `/api/images/render?url=...` (including nested/encoded forms)
- missing-file resolution:
  - hash-match to existing local files
  - hydrate missing file from old URL to expected VFS path
- canonical filename rewrite:
  - target filename is `<picture_id>.<ext>` (or `<picture_id>` if no extension)

## Notes
- During migration window, mixed URL styles can exist in DB.
- Keep legacy URL compatibility handlers in `images/index.ts` until migration reports no unresolved rows.
