# Unified Type System

Schema-driven definitions for structures, enums, flags, and field wrappers. Persisted in PostgreSQL (Supabase), exposed under `/api/types`, and edited in the app via **visual builder** (`TypeBuilder`) or **JSON schema / UI schema** (`TypeRenderer`). Runtime forms use **@rjsf/core** with templates in `src/modules/types/RJSFTemplates.tsx`.

For a deeper architecture walkthrough (diagrams, sequence sketches), see [`type-system.md`](./type-system.md).

---

## Type kinds (`types.kind`)

| Kind | Role |
|------|------|
| `primitive` | Built-in value kinds: `string`, `int`, `float`, `bool`, `array`, `object`, `enum`, `flags`, `reference`, `alias`, … |
| `enum` | Custom enum: values live in `type_enum_values`. |
| `flags` | Custom flags: values live in `type_flag_values`. |
| `structure` | Object shape: members listed in `type_structure_fields`. |
| `field` | **Per-structure field row**: name `{StructureName}.{fieldName}`, `parent_type_id` → the **value** type (primitive, custom enum, flags, nested structure, array target, …). Referenced by `type_structure_fields.field_type_id`. |
| `alias` | Treated as string in generated JSON Schema until fully resolved. |

Structures never point `field_type_id` at a bare custom enum id; they point at a **`field` row** whose parent is that enum. That allows per-field `meta`, `settings` (defaults, `items_type_id`, `group`), and descriptions.

---

## Database (summary)

### `types`

- `id`, `name`, `kind`, `parent_type_id` (inheritance / alias target / **field → value type**)
- `description`, `json_schema` (JSONB), `owner_id`, `visibility` (`public` \| `private` \| `custom`)
- `meta` (JSONB) — e.g. `meta.uiSchema` for RJSF overrides on this type
- `settings` (JSONB) — e.g. `default_value`, `items_type_id`, `group` on **field** kinds
- `created_at`, `updated_at`

### `type_enum_values` / `type_flag_values`

- Enum: `type_id`, `value`, `label`, `order`
- Flags: `type_id`, `name`, `bit`

### `type_structure_fields`

- `structure_type_id` → structure `types.id`
- `field_name`, `field_type_id` → **`kind: field`** type id (not the raw enum id)
- `required`, `default_value` (JSONB), `order`

`required` is also reflected in generated JSON Schema `required[]`. If you edit the JSON Schema tab and save, the client can sync `structure_fields[].required` from `json_schema.required` when that array is present.

### `type_casts`

Transformation metadata between types (`from_type_id`, `to_type_id`, `cast_kind`, …).

---

## Server API (`/api/types`)

Implemented in `server/src/products/serving/db/db-types.ts`. OpenAPI route definitions and Zod shapes live in that file (`TypeWithRelationsSchema`, `ExtendedTypeInsertSchema`, `ExtendedTypeUpdateSchema`).

List/detail responses **enrich** each row in memory with:

- `structure_fields`, `enum_values`, `flag_values`

`type_casts` are loaded into the server cache object but **not** attached per type in JSON responses (only the three relations above).

### `GET /api/types`

**Query** (all optional, exact match filters):

- `kind` — e.g. `structure`, `enum`, `field`
- `parentTypeId` — types whose `parent_type_id` equals this id
- `visibility` — `public` \| `private` \| `custom`

**Response header:** `X-Cache: HIT` \| `MISS` (server aggregate cache).

Returns a **sorted** array (by `name`).

### `GET /api/types/:id`

Returns one enriched type, or **404** `{ "error": "Type not found" }` if the id is missing from the cache map (same backing data as the list endpoint).

### `POST /api/types`

Body uses **snake_case** keys matching persistence, e.g.:

```json
{
  "name": "MyEnum",
  "kind": "enum",
  "description": "…",
  "visibility": "public",
  "enum_values": [
    { "value": "a", "label": "A", "order": 0 },
    { "value": "b", "label": "B", "order": 1 }
  ]
}
```

Structures can send `structure_fields` in the same request; nested `field` types are usually created first (see app flow).

**Auth:** If `Authorization: Bearer <token>` is present and resolves to a user, **`owner_id`** is set on the new row from that user.

**Response:** **200** with the full enriched type (same shape as GET by id).

### `PATCH /api/types/:id`

**Core row** (`types` table): the handler updates only **`name`**, **`description`**, **`json_schema`**, **`visibility`**, **`meta`**, **`settings`** — read from the parsed body. Because the server forwards those properties explicitly, keys **missing** from JSON arrive as **`undefined`** in JS; verify your client / PostgREST behavior (unintended **`null`** clears are possible if you PATCH with a sparse body). The app’s `updateType` client usually sends a merged object for `meta` when needed.

**Not** updated via this path: **`kind`**, **`parent_type_id`**, **`owner_id`** (change those only with direct DB / a different API if added later).

**Child tables** (only when the corresponding key is present and is an array):

| Key | Behavior |
|-----|----------|
| `structure_fields` | **Replace** all rows for this structure (delete by `structure_type_id`, then insert). |
| `enum_values` | **Replace** all rows for this enum type. |
| `flag_values` | **Replace** all rows for this flags type. |
| `fieldsToDelete` | After the above, **`deleteType`** each id (e.g. orphaned **`field`** types). |

**Response:** **200** with the full enriched type after `flushTypeCache()` and `appCache.notify('type', id, 'update')`.

### `DELETE /api/types/:id`

Deletes the **`types`** row (CASCADE removes `type_structure_fields` links). If the deleted row was a **structure**, the server then **best-effort deletes** the former `field_type_id` entries (no longer referenced). Failures on that second step are logged but do not roll back the main delete.

**Response:** **200** `{ "success": true }`, plus cache flush / notify.

---

## Caching

- Server: in-memory cache for the types aggregate (`getTypeState` in `db-types.ts`), TTL **5 minutes**; **create / update / delete** call **`flushTypeCache()`** and **`appCache.notify('type', id, …)`** for downstream listeners.
- Client: `fetchWithDeduplication` / invalidation in `src/modules/types/client-types.ts` (`invalidateCache` on create/update/delete).

---

## Client modules (pm-pics)

| Area | Location |
|------|----------|
| Fetch / CRUD | `src/modules/types/client-types.ts` |
| Schema + UI generation | `src/modules/types/schema-utils.ts` — `generateSchemaForType`, `generateUiSchemaForType`, `deepMergeUiSchema` |
| Editor shell | `src/modules/types/TypesEditor.tsx` — visual vs detail mode, save handlers |
| Visual builder | `src/modules/types/TypeBuilder.tsx`, `builder/TypeBuilderContent.tsx` |
| JSON / preview | `src/modules/types/TypeRenderer.tsx` |
| RJSF widgets/templates | `src/modules/types/RJSFTemplates.tsx` |

### Generated JSON Schema & UI schema

- For `structure` / `enum` / `flags`, the UI builds from **`generateSchemaForType`** / **`generateUiSchemaForType`**, then merges **`meta.uiSchema`** from the type with `deepMergeUiSchema` (structure-level overrides win on conflicts).
- **`meta.uiSchema`** holds RJSF keys: per-property widgets, `ui:group` for sections, nested `items` for arrays, root `ui:classNames`, etc.
- Field-level customization also lives on the **`field`** type: `field.meta.uiSchema` and `field.settings` (group, defaults, `items_type_id`). The visual builder merges structure `meta.uiSchema[fieldName]` with the field type when loading so JSON-tab edits round-trip.

### Field parent resolution (critical)

- Palette drops store `refId` = chosen type id. When loading from DB, **`structureFieldToBuilderElement`** sets `type` and **`refId`** from `field.parent_type_id`** so saves resolve the value type, not the `Struct.field` name string.
- **`generateSchemaForType`** treats `kind === 'field'` as a transparent wrapper and resolves through `parent_type_id`.

### Forms & groups

- Custom **`ObjectFieldTemplate`** groups properties by `ui:group` (collapsible sections).
- Default widgets: enum → `select`, flags → `checkboxes`, custom widgets registered in `customWidgets`.

---

## Primitive types (seed)

Typical seeds include: `string`, `int`, `float`, `bool`, `array`, `object`, `enum`, `flags`, `reference`, `alias`.

Using the **primitive** `enum` / `flags` in a structure yields **empty** enums until you use a **custom** `enum` / `flags` type with values defined — custom types carry `enum_values` / `flag_values` in API responses.

---

## Access control (RLS)

Row Level Security applies on the underlying tables. Typical intent:

- **Read**: `public` types visible broadly; `private` / `custom` restricted by owner/admin rules (see policies in Supabase).
- **Write**: owners and admins per product rules.

Exact policies live with the database migrations; treat this section as behavioral summary, not the source of truth for SQL.
