# Enterprise-Grade Security & Access Control

PoolyPress is hardened against vulnerabilities and bad actors at every level, with policies applied consistently across all endpoints. Beyond standard authentication and transport protection, the platform features a highly granular **Virtual File System (VFS) Access Control List (ACL)** system for precise resource management.

## Virtual File System (VFS) ACLs

The Storage product implements a full ACL system for its virtual file system, ensuring that every file and folder is strictly access-controlled. 

- **Isolated Mounts:** Storage is divided into isolated namespaces called "Mounts." Each mount has its own set of access control rules.
- **Granular Permissions:** Access can be explicitly granted or revoked per user, per group, or per specific path within a mount. Supported permissions include `read`, `write`, `list`, `mkdir`, `delete`, `rename`, and `copy`.
- **Special Roles:** 
  - **Anonymous Access:** Configurable permissions for unauthenticated users (e.g., public read/list access).
  - **Authenticated Users:** Configurable baseline permissions for any logged-in user.
- **Resource Chains:** Permissions are evaluated hierarchically. If a user tries to access `/docs/sub/file.txt`, the system checks grants on `/docs/sub/file.txt`, then `/docs/sub`, then `/docs`, and finally `/`. If any level grants access, the request succeeds.
- **Visual Editor:** The platform includes an intuitive ACL Editor UI (`AclEditor`) that allows administrators to easily toggle anonymous/authenticated access, grant specific permissions to individual users or groups, and revoke active permissions.

## Comprehensive Security Posture

The VFS ACLs operate within a broader, deeply integrated security architecture:

- **Strict Authentication & Authorization:** Implements secure JWT-based authentication combined with declarative route-level access controls (`@Public`, `@Admin`). 
- **Automated Threat Mitigation (Auto-Ban):** Actively protects your infrastructure by tracking rate limit violations and suspicious patterns in-memory, dynamically banning offending IP addresses, user IDs, or specific tokens.
- **Comprehensive Transport Protection:** Employs stringent secure headers, Content Security Policies (CSP), and Cross-Origin directives to effectively thwart XSS, clickjacking, and CSRF attacks without impacting load times.
- **Deep Observability & Auditing:** Real-time logging, background async geo-lookups, and SSE streams provide a detailed footprint of user activity for active threat monitoring and system health tracking.
