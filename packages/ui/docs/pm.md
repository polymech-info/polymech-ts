# Polymech Server Operations

## Hot Reloading via API

To update the server code without requiring root access or SSH:

1.  **Deploy Code**: Sync the new `dist/` folder to the server (e.g., using `scripts/deploy.sh` or `rclone`).
2.  **Trigger Restart**: Send a POST request to the restart endpoint with an admin token.

```bash
curl -X POST https://api.polymech.info/api/admin/system/restart \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### How it works

- The endpoint `/api/admin/system/restart` is protected by admin authentication.
- When called, it waits 1 second (to flush the response) and then calls `process.exit(0)`.
- The systemd service is configured with `Restart=always` (or `on-failure`), so it automatically restarts the node process.
- The new process loads the updated code from the disk.

### Systemd Configuration

Ensure your `pm-pics.service` file includes:

```ini
[Service]
Restart=always
# or
Restart=on-failure
```
