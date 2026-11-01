# Plesk CLI (`pm-cli-cms plesk`)

CLI wrapper around the **Plesk REST API v2** — domains, clients, DNS, databases, FTP users and extensions, all from the terminal.

> **DNS note:** DNS is managed in **Hetzner Robot**, not in Plesk. All subdomain commands skip DNS by default. Add Hetzner A records manually after provisioning.

Source: `cli-ts/src/commands/plesk/` · Client lib: `cli-ts/src/lib/plesk.ts` · API spec: `cli-ts/ref/plesk.json`

---

## Setup

### 1. Generate an API key

API keys generated from `localhost` on the server are **restricted to localhost** by default. Pass `"ips":[]` to make the key reachable from anywhere:

```bash
# Run on the server (SSH) — generates a key with no IP restriction
curl -sk -X POST --user admin:YOUR_PASSWORD \
  -H "Content-Type: application/json" \
  -d '{"description":"pm-cli-cms","ips":[]}' \
  "https://localhost:8443/api/v2/auth/keys"
# → { "key": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }
```

### 2. Add vars to `cli-ts/.env`

Both `.env` and `.env.production` are loaded at startup (`.env.production` wins on conflicts).

```dotenv
PLESK_HOST=https://polymech.info:8443
PLESK_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Skip TLS cert check (Plesk default cert is self-signed)
PLESK_INSECURE=1
```

### 3. Global flags (override env vars per-command)

| Flag | Env var | Description |
|---|---|---|
| `--host` | `PLESK_HOST` | Plesk server base URL (must include port `:8443`) |
| `--api-key` | `PLESK_API_KEY` | API key — UUID format |
| `--login` | `PLESK_LOGIN` | Admin login (basic auth fallback) |
| `--password` | `PLESK_PASSWORD` | Admin password (basic auth fallback) |
| `--insecure` | `PLESK_INSECURE=1` | Skip TLS cert verification |

---

## Command Reference

### `plesk server` — Server info

```bash
pm-cli-cms plesk server info    # platform, hostname, Plesk version
pm-cli-cms plesk server ips     # list all server IPs (used to auto-detect IP)
```

---

### `plesk app` — Provision an app slot ⭐

One idempotent command that provisions everything Plesk needs for a new app: subdomain + FTP user. Credentials are written to `--target/plesk.json` and re-used on subsequent runs (safe to re-run).

```bash
# Minimal — auto-detects IP, auto-generates FTP password
pm-cli-cms plesk app create --name shop --target ./infrastructure/shop

# Re-running is safe — skips already-provisioned resources
pm-cli-cms plesk app create --name shop --target ./infrastructure/shop

# Preview without changes
pm-cli-cms plesk app create --name shop --target ./infrastructure/shop --dry-run
```

**Output — `infrastructure/shop/plesk.json`:**
```json
{
  "fqdn": "shop.polymech.info",
  "ip": "148.251.75.178",
  "ftpLogin": "shop_polymech_info",
  "ftpPassword": "PmXXXXXXXXXXXX1!",
  "domain": { "id": 43, "name": "shop.polymech.info", "www_root": "/var/www/vhosts/polymech.info/site1", ... },
  "ftpUser": { "id": 10, "name": "shop_polymech_info", "home": "/httpdocs", ... },
  "createdAt": "2026-04-10T14:44:28.239Z",
  "updatedAt": "2026-04-10T14:44:28.239Z"
}
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--name` | required | App name — becomes subdomain prefix (`shop` → `shop.polymech.info`) |
| `--root` | `polymech.info` | Root domain |
| `-t, --target` | required | Directory where `plesk.json` is written |
| `--ip` | auto (from `/server/ips`) | IPv4 to register the domain on |
| `--ftp-login` | `<name>_<root>` | FTP username override |
| `--ftp-password` | auto-generated | FTP password override |
| `--client-login` | — | Assign domain to this Plesk client |
| `--dry-run` | `false` | Print plan without making changes |

**Note:** DNS is **not** touched — add the A record in Hetzner Robot after running this.

---

### `plesk subdomains` — Raw subdomain management

Lower-level than `plesk app` — creates a single subdomain entry in Plesk, no target file.

```bash
# Create (DNS skipped by default — managed in Hetzner)
pm-cli-cms plesk subdomains create --name client

# Create under a different root
pm-cli-cms plesk subdomains create --name staging --root demo.polymech.info

# Preview
pm-cli-cms plesk subdomains create --name test --dry-run

# List all subdomains under the root
pm-cli-cms plesk subdomains list
pm-cli-cms plesk subdomains list --root polymech.io

# Delete
pm-cli-cms plesk subdomains delete --name client
```

**`create` options:**

| Flag | Default | Description |
|---|---|---|
| `--name` | required | Subdomain prefix |
| `--root` | `polymech.info` | Root domain |
| `--ip` | auto | IPv4 for the domain |
| `--ftp-login` | `<name>_<root>` | FTP login (required by Plesk for virtual hosting) |
| `--ftp-password` | auto-generated | FTP password |
| `--client-login` | — | Assign to Plesk client |
| `--hosting-type` | `virtual` | `virtual` \| `none` \| `standard_forwarding` \| `frame_forwarding` |
| `--skip-dns` | `true` | DNS step — always leave as default (use Hetzner) |
| `--dry-run` | `false` | Print plan without executing |

---

### `plesk domains` — Domain management

```bash
pm-cli-cms plesk domains list
pm-cli-cms plesk domains get <id>
pm-cli-cms plesk domains client <id>
pm-cli-cms plesk domains status <id>
pm-cli-cms plesk domains set-status <id> --status disabled
pm-cli-cms plesk domains delete <id>
```

---

### `plesk clients` — Client account management

```bash
pm-cli-cms plesk clients list
pm-cli-cms plesk clients get <id>
pm-cli-cms plesk clients create \
  --name "Acme Corp" --login acme --password s3cr3t --email admin@acme.com
pm-cli-cms plesk clients update <id> --email new@acme.com
pm-cli-cms plesk clients domains <id>
pm-cli-cms plesk clients stats <id>
pm-cli-cms plesk clients activate <id>
pm-cli-cms plesk clients suspend <id>
pm-cli-cms plesk clients delete <id>
```

---

### `plesk databases` — Database management

```bash
pm-cli-cms plesk databases list
pm-cli-cms plesk databases servers
pm-cli-cms plesk databases create --name myapp_db --domain example.com --type mysql
pm-cli-cms plesk databases delete <id>
pm-cli-cms plesk databases users
pm-cli-cms plesk databases add-user --login myapp_user --password s3cr3t --db-id 42
pm-cli-cms plesk databases update-user <id> --password newpass
pm-cli-cms plesk databases delete-user <id>
```

---

### `plesk ftp` — FTP user management

> For app FTP users, prefer `plesk app create` which handles this automatically.

```bash
pm-cli-cms plesk ftp list
pm-cli-cms plesk ftp create \
  --name ftpdeploy --password s3cr3t --domain example.com --home /httpdocs
pm-cli-cms plesk ftp update ftpdeploy --password newpass
pm-cli-cms plesk ftp delete ftpdeploy
```

**Note:** Plesk requires `permissions` in the POST body — always pass `read`+`write` or use the `plesk app` command which handles this automatically.

---

### `plesk extensions` — Extension management

```bash
pm-cli-cms plesk extensions list
pm-cli-cms plesk extensions get <id>
pm-cli-cms plesk extensions install --id letsencrypt
pm-cli-cms plesk extensions install --url https://example.com/my-ext.zip
pm-cli-cms plesk extensions enable <id>
pm-cli-cms plesk extensions disable <id>
pm-cli-cms plesk extensions uninstall <id>
```

---

## App Provisioning Workflow

```bash
# 1. Provision Plesk resources (subdomain + FTP) → writes infrastructure/shop/plesk.json
pm-cli-cms plesk app create --name shop --target ./infrastructure/shop

# 2. Add DNS in Hetzner Robot (manual)
#    A  shop.polymech.info  →  148.251.75.178

# 3. Continue with site init / deploy
pm-cli-cms site-init --domain shop.polymech.info --target-env ./infrastructure/shop/.env.production
```

---

## Files

```
cli-ts/
├── ref/
│   └── plesk.json                  ← Plesk REST API v2 OpenAPI spec
├── src/
│   ├── lib/
│   │   └── plesk.ts                ← typed HTTP client (all 50 endpoints)
│   └── commands/
│       ├── plesk.ts                ← top-level 'plesk' command + global flags
│       └── plesk/
│           ├── _client.ts          ← shared client(argv) helper
│           ├── app.ts              ← plesk app create  ⭐
│           ├── subdomains.ts       ← plesk subdomains *
│           ├── server.ts           ← plesk server info ips
│           ├── domains.ts          ← plesk domains *
│           ├── clients.ts          ← plesk clients *
│           ├── databases.ts        ← plesk databases *
│           ├── ftp.ts              ← plesk ftp *
│           └── extensions.ts       ← plesk extensions *

infrastructure/
└── <app>/
    ├── init.sh                     ← pm-cli-cms plesk app create ...
    └── plesk.json                  ← generated credentials
```

---

## Tips

- All commands output raw JSON — pipe to `jq`:
  ```bash
  pm-cli-cms plesk domains list | jq '[.[] | {id, name, base_domain_id}]'
  pm-cli-cms plesk ftp list | jq '[.[] | {id, name, home}]'
  ```
- `PINO_LOG_LEVEL=debug` logs every HTTP request URL.
- `--dry-run` is available on `plesk app create` and `plesk subdomains create`.

---

## curl Reference

```bash
PLESK=https://polymech.info:8443
KEY=your-api-key

alias p='curl -sk -H "X-API-Key: $KEY" -H "Content-Type: application/json"'
```

### Auth

```bash
# Generate key with no IP restriction (run on server via SSH)
curl -sk -X POST --user admin:PASSWORD \
  -H "Content-Type: application/json" \
  -d '{"description":"pm-cli-cms","ips":[]}' \
  "https://localhost:8443/api/v2/auth/keys"

p -X DELETE "$PLESK/api/v2/auth/keys/KEY_VALUE"
```

### Server

```bash
p "$PLESK/api/v2/server"      | jq .
p "$PLESK/api/v2/server/ips"  | jq .
```

### Subdomain (Plesk side only — DNS goes in Hetzner)

```bash
ROOT=polymech.info
SUB=shop
IP=148.251.75.178

# Create subdomain with required hosting_settings + parent_domain
p -X POST "$PLESK/api/v2/domains" -d "{
  \"name\": \"$SUB.$ROOT\",
  \"hosting_type\": \"virtual\",
  \"parent_domain\": { \"name\": \"$ROOT\" },
  \"ip_addresses\": [\"$IP\"],
  \"hosting_settings\": {
    \"ftp_login\": \"${SUB}_${ROOT//./_}\",
    \"ftp_password\": \"YourPassword1!\"
  }
}" | jq .

# Create FTP user (permissions field is required to avoid Plesk 500)
p -X POST "$PLESK/api/v2/ftpusers" -d "{
  \"name\": \"${SUB}_${ROOT//./_}\",
  \"password\": \"YourPassword1!\",
  \"home\": \"/httpdocs\",
  \"permissions\": { \"read\": \"true\", \"write\": \"true\" },
  \"parent_domain\": { \"name\": \"$SUB.$ROOT\" }
}" | jq .

# Delete subdomain
DOMAIN_ID=$(p "$PLESK/api/v2/domains" | jq -r ".[] | select(.name==\"$SUB.$ROOT\") | .id")
p -X DELETE "$PLESK/api/v2/domains/$DOMAIN_ID"
```

### Domains

```bash
p "$PLESK/api/v2/domains" | jq '[.[] | {id,name,base_domain_id,www_root}]'
p "$PLESK/api/v2/domains/42" | jq .
p -X PUT "$PLESK/api/v2/domains/42/status" -d '{"status":"disabled"}' | jq .
p -X DELETE "$PLESK/api/v2/domains/42"
```

### Clients

```bash
p "$PLESK/api/v2/clients" | jq '[.[] | {id,login,name,status}]'
p -X POST "$PLESK/api/v2/clients" -d '{
  "name":"Acme","login":"acme","password":"s3cr3t","email":"a@acme.com"
}' | jq .
p -X PUT "$PLESK/api/v2/clients/7/suspend"
p -X PUT "$PLESK/api/v2/clients/7/activate"
p -X DELETE "$PLESK/api/v2/clients/7"
```

### Databases

```bash
p "$PLESK/api/v2/databases" | jq .
p "$PLESK/api/v2/dbservers"  | jq .
p -X POST "$PLESK/api/v2/databases" -d '{
  "name":"mydb","type":"mysql","parent_domain":{"name":"example.com"}
}' | jq .
p -X POST "$PLESK/api/v2/dbusers" -d '{
  "login":"dbuser","password":"s3cr3t","database_id":42
}' | jq .
p -X DELETE "$PLESK/api/v2/databases/42"
```

### FTP

```bash
p "$PLESK/api/v2/ftpusers" | jq .
p -X PUT "$PLESK/api/v2/ftpusers/myuser" -d '{"password":"newpass"}' | jq .
p -X DELETE "$PLESK/api/v2/ftpusers/myuser"
```

### Extensions

```bash
p "$PLESK/api/v2/extensions" | jq '[.[] | {id,name,version,active}]'
p -X POST "$PLESK/api/v2/extensions" -d '{"id":"letsencrypt"}' | jq .
p -X PUT    "$PLESK/api/v2/extensions/letsencrypt/enable"
p -X DELETE "$PLESK/api/v2/extensions/letsencrypt"
```

### CLI gate

```bash
p "$PLESK/api/v2/cli/commands" | jq '[.[] | .id]'
p -X POST "$PLESK/api/v2/cli/plesk/call" -d '{
  "params": ["bin", "subscription", "--list"]
}' | jq .
```
