# Virtual File System (VFS) & Access Control List (ACL)

The Polymech Storage module implements a robust Virtual File System (VFS) with an integrated Access Control List (ACL) engine. This system presents a unified file interface across different mount points, providing advanced features like bind mounting, strict path sanitization, streaming, compression, and granular permission enforcement.

## 1. VFS Mounts

Mounts define the physical or virtual storage locations exposed by the VFS API. 

### Configuration (`config/vfs.json`)
Mount configs list the available storage volumes. It can be overridden per environment (e.g. `vfs-production.json`) or via the `VFS_CONFIG` environment variable.

```json
[
  {
    "name": "root",
    "type": "local",
    "path": "./data/root"
  },
  {
    "name": "assets",
    "type": "local",
    "path": "./data/assets"
  }
]
```

### Special Mount Types
* **Named Mounts**: Declared directly in configured JSON files. (e.g. `root`, `assets`).
* **Home Mount (`home`)**: A virtual mount that maps to `{root_mount_path}/{user_uuid}`. This provides each user with an isolated personal storage area. The directory automatically creates itself on first access.
* **User Mount (`user:{uuid}`)**: Administrative or cross-user syntax to directly refer to a specific user's home folder.
* **UUID Mount (`{uuid}`)**: Also acts as a direct alias to a specific user's home folder, often used for sharing files anonymously or cross-user.

## 2. Bind Mounts

Bind mounts map a path from one mount into a different mount. This allows data to appear in multiple locations without duplicating files, akin to Linux `mount --bind`.

### Configuration (`config/vfs-binds.json`)
Can also be overridden by environment (e.g. `vfs-binds-production.json`).

```json
[
  {
    "id": "home-assets",
    "source": { "mount": "assets" },
    "target": { "mount": "home", "path": "assets" },
    "acl": "source" 
  }
]
```
* **`acl: "source"`**: Permissions are evaluated based on the source mount's ACL contexts.
* **`acl: "inherit"`**: Permissions evaluate against the target mount's context (e.g., if bound to a user's home, the user owns it).

## 3. Access Control Lists (ACL)

The VFS features a granular, path-based ACL system. Every physical mount root or user's home directory maintains a `vfs-settings.json` file defining ownership and permissions.

### Settings Configuration (`vfs-settings.json`)
If a `vfs-settings.json` doesn't exist, it is auto-generated with the default owner when first accessed.

```json
{
  "owner": "3bb4cfbf-318b-44d3-a9d3-35680e738421",
  "groups": [],
  "acl": [
    {
      "path": "/",
      "permissions": ["read", "list"],
      "userId": "anonymous"
    },
    {
      "path": "/shared",
      "permissions": ["read", "list", "write", "mkdir", "delete", "rename", "copy"],
      "userId": "authenticated"
    }
  ]
}
```

### Roles and Identifiers
* **Owner (`owner` field)**: The system owner or user UUID. Has implicit full control. System mounts use a synthetic UUID (`00000000-0000-0000-0000-000000000000`).
* **`userId` values in ACL**:
  * `anonymous`: Any unauthenticated public requests.
  * `authenticated`: Any user with a valid Supabase token.
  * `{uuid}`: A specific Supabase user ID.
* **Permissions Options**: `read`, `list`, `write`, `mkdir`, `delete`, `rename`, `copy`.

### API ACL Management
Users or Admins can manipulate ACL records on their owned mounts via explicit routes:
* `POST /api/vfs/acl/grant/{mount}`
* `POST /api/vfs/acl/revoke/{mount}`

## 4. API Endpoints and Interactions

All VFS endpoints follow a `/{action}/{mount}/{subpath}` format.

* **List / Glob Search**: `/api/vfs/ls/{mount}/*`
  * Query params: `glob=*` (pattern matching), `includeSize=true` (recursively calculates folder sizing with 5-day caching).
  * Automatically applies `.gitignore` filtering when listing physical local mounts via `isIgnored()`.
* **Read / Serve**: 
  * `/api/vfs/read/{mount}/*`: Returns raw text.
  * `/api/vfs/get/{mount}/*`: Serves files with correct MIME types and supports HTTP **Range requests** (`206 Partial Content`), vital for streaming large media components (video/audio).
* **Write / Upload**:
  * `/api/vfs/write/{mount}/*`: Direct HTTP PUT text replacement. 
  * `/api/vfs/upload/{mount}/*`: Standard `multipart/form-data` uploads. Piped directly to disk recursively to mitigate loading entirely in memory for large files.
* **ZIP Compress**: `/api/vfs/compress/{mount}/*`
  * Dynamically streams a ZIP of the targeted folder structure. Rate-limited to 3 times per minute. Refuses anonymous usage implicitly.
* **Deep Search Engine**: `/api/vfs/search/{mount}/*`
  * Implements deep recursive search.
  * Can force-synchronize to Supabase full-text search systems via Admin hooks (`/api/vfs/admin/index`).

## 5. Security & Path Traversal Protection

The primary VFS router enforces extreme security to prevent Directory Traversal or Payload injection.

* **Bans System**: 
  * Detecting null-byte injection (`%00`), URL-encoded bypasses (`..=%5c`), double-encoded bypasses (`%252e`), or trailing malicious slashes will instantly enforce an IP Auto-Ban logging routine resulting in a `403 Fuck You` text response unless requested explicitly from localhost testing vectors.
* **Path Sanitization**: `sanitizeWritePath()` forcefully filters malformed characters (accidental square brackets, extra dots, invalid symbols) for created directories or files.
