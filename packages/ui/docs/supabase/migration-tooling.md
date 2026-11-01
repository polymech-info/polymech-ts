# Migration Tooling (Leaving Supabase)

## Overview

Chapter in the **Leaving Supabase** series: concrete CLI snippets used to back up data, export storage, restore databases, and rewrite image URLs while moving away from Supabase-managed services.

The goal of this chapter is not to present generic examples, but to preserve the patterns that were actually useful during migration work in `pm-pics`.

All code below is copied inline so the article stays self-contained.

---

## 1. Common pattern: resolve the right `.env`

Several commands use the same defensive pattern: try explicit `--env` first, then fall back through a small list of common locations and validate the file by checking whether it contains the expected variable.

```ts
function resolveEnvPath(sourceDir: string, envFlag?: string): string {
  if (envFlag) {
    const explicit = resolve(sourceDir, envFlag);
    if (!existsSync(explicit)) {
      throw new Error(`Env file not found: ${explicit}`);
    }
    return explicit;
  }

  const candidates = [
    ".env",
    ".env.production",
    "server/.env",
    "server/.env.production",
  ];

  for (const name of candidates) {
    const p = resolve(sourceDir, name);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf-8");
    if (!content.includes("DATABASE_URL")) continue;
    return p;
  }

  throw new Error(`No .env found in ${sourceDir}`);
}
```

Why this mattered:
- Migration scripts are often run from inconsistent working directories.
- A fast variable check avoids picking the wrong `.env`.
- The fallback order keeps local and production workflows predictable.

---

## 2. Split database backups into structure and data

The backup flow treats schema and data as separate artifacts. That makes restore and troubleshooting much easier than one giant dump.

```ts
if (backupType === "structure" || backupType === "all") {
  const outPath = join(dbDir, `structure-${date}.sql`);
  await dumpSchema({
    pgUrl: env.dbUrl,
    outPath,
    schemas: ["public"],
    excludeIndexes: argv.noIndexes || argv["no-indexes"] || false,
    excludeTables,
  });
}

if (backupType === "data" || backupType === "all") {
  const outPath = join(dbDir, `data-${date}.sql`);
  await dumpData({
    pgUrl: env.dbUrl,
    outPath,
    schemas: ["public"],
    excludeTables: excludeDataTables,
  });
}
```

Why this mattered:
- Schema-only dumps are easier to replay during iterative migration.
- Data-only dumps let you re-import content without recreating everything.
- Large or derived tables can be excluded from data dumps while keeping schema intact.

Also notable is the optional `auth.users` export:

```ts
if (argv["include-auth"] || argv.includeAuth) {
  const outPath = join(dbDir, `auth-users-${date}.sql`);
  try {
    await dumpTableData({
      pgUrl: env.dbUrl,
      outPath,
      table: "auth.users",
    });
  } catch (err: any) {
    log.warn(`auth.users dump failed (may not exist on target): ${err?.message ?? err}`);
  }
}
```

This is useful when the schema still references Supabase auth rows during the transition.

---

## 3. Recursively export Supabase Storage buckets

The storage backup flow walks Supabase Storage recursively and downloads every object with bounded concurrency.

```ts
interface StorageEntry {
  name: string;
  id?: string;
  fullPath: string;
}

async function listFilesRecursive(client: any, bucketId: string, path = ""): Promise<StorageEntry[]> {
  const { data, error } = await client.storage.from(bucketId).list(path, { limit: 1000 });
  if (error || !data) return [];

  const out: StorageEntry[] = [];
  for (const item of data) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (!item.id) {
      const sub = await listFilesRecursive(client, bucketId, fullPath);
      out.push(...sub);
    } else {
      out.push({ name: item.name, id: item.id, fullPath });
    }
  }
  return out;
}

async function pMap<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let index = 0;
  async function run(): Promise<void> {
    const current = index++;
    if (current >= items.length) return;
    await worker(items[current]);
    await run();
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
}
```

Why this mattered:
- Supabase Storage listings are folder-like, so migrations need explicit recursion.
- Concurrency keeps exports fast without turning the migration into a thundering herd.
- This pattern works equally well for backup, verification, and cross-provider copy jobs.

---

## 4. Mirror object storage into application-native paths

One of the most useful ideas is not just downloading bucket objects, but writing additional alias files into the application's destination layout.

```ts
if (bucket.id === "pictures") {
  const aliases = pictureAliases.get(file.fullPath) || [];
  if (aliases.length > 0) {
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";

    for (const alias of aliases) {
      const aliasPath = join(outRoot, bucket.id, "storage", alias.userId, `${alias.id}${ext}`);
      await mkdir(dirname(aliasPath), { recursive: true });
      await writeFile(aliasPath, content);
    }
  }
}
```

Why this mattered:
- Supabase object keys are rarely the same shape as the target application's storage contract.
- Writing aliases during export reduces the amount of later rewrite logic.
- It turns backup into migration preparation instead of just archival.

---

## 5. Restore into a plain Postgres target with a privileged URL

The database import flow makes restore logic explicit: use a higher-privilege connection for DDL, optionally clear the public schema, then import schema and data separately.

```ts
const envPath = resolveEnvPath(targetDir, argv.env);
const env = loadEnvFromFile(envPath);

if (!env.serviceDbUrl && !env.dbUrl) {
  throw new Error(`DATABASE_URL is empty in ${envPath}. Cannot connect to database.`);
}

let importUrl = env.serviceDbUrl || env.dbUrl;

if (argv.clear) {
  await clearPublicSchema(importUrl);
}

if (argv.schema) {
  await restoreSchema({
    pgUrl: importUrl,
    sqlPath: schemaPath,
  });
}

if (argv.data) {
  await restoreData({
    pgUrl: importUrl,
    sqlPath: dataPath,
  });
}
```

Why this mattered:
- Restore usually needs more privileges than the application runtime pool should have.
- Resetting `public` explicitly makes repeated migration tests less fragile.
- Schema and data replay remain independently controllable.

The same command also provisions a service role after restore:

```ts
const createUser = argv.createUser || argv["create-user"];
if (createUser) {
  const createUserPassword = argv.createUserPassword || argv["create-user-password"];
  const pgbossSchema =
    argv.pgbossSchema ||
    argv["pgboss-schema"] ||
    (dbname ? `pgboss_${dbname}` : "pgboss");

  await createServiceUser(importUrl, createUser, createUserPassword, pgbossSchema);
}
```

This is a practical reminder that leaving Supabase is not only about data import; it also means recreating the operational roles the application expects.

---

## 6. Rewrite image URLs from Supabase Storage to VFS

The image migration flow is the most migration-specific command in the set. It identifies Supabase-based `pictures.image_url` values, derives the intended destination path, and updates rows to point at the new VFS endpoint.

```ts
const q = `
  SELECT id, user_id, image_url
  FROM pictures
  WHERE image_url IS NOT NULL
    AND (
      image_url LIKE '%/storage/v1/object/public/pictures/%'
      OR image_url LIKE '%/api/images/render?%'
      OR image_url LIKE '%storage%2Fv1%2Fobject%2Fpublic%2Fpictures%2F%'
    )
  ORDER BY created_at ASC
  ${limitSql}
`;

const res = await pool.query(q);
```

```ts
const nextUrl =
  `${serverBase}/api/vfs/get/${encodeURIComponent(vfsStore)}` +
  `/${encodeURIComponent(row.user_id)}/${encodeURIComponent(filename)}`;

await pool.query(
  `UPDATE pictures SET image_url = $1, updated_at = NOW() WHERE id = $2 AND image_url = $3`,
  [nextUrl, row.id, row.image_url]
);
```

Why this mattered:
- The migration had to support both direct Supabase URLs and wrapped render URLs.
- URL rewrites were done idempotently by checking the old value in the `WHERE` clause.
- The target path was derived from application semantics, not from Supabase storage keys alone.

---

## 7. Hydrate missing files during URL migration

The most robust part of the image migration flow is that it does not assume local storage is already complete. When the expected target file is missing, the command can fetch the old remote file and write it into the VFS layout on the fly.

```ts
if (!existsSync(localFile)) {
  const fetchRes = await fetch(row.image_url);
  if (!fetchRes.ok) {
    missingLocal++;
    continue;
  }

  const content = Buffer.from(await fetchRes.arrayBuffer());
  if (!dryRun) {
    await mkdir(userDir, { recursive: true });
    await writeFile(localFile, content);
  }

  hydratedMissing++;
}
```

Why this mattered:
- Real migrations are messy; backups are often incomplete.
- Hydration lets the URL rewrite and content recovery happen in one pass.
- This reduces the chance of ending up with database rows that point to files that do not exist.

The command goes one step further and can also resolve files by content hash:

```ts
async function resolveFilenameByContentMatch(
  sourceUrl: string,
  userDir: string,
  cache: Map<string, Map<string, string[]>>,
): Promise<string | null> {
  let idx = cache.get(userDir);
  if (!idx) {
    idx = await indexUserFilesByHash(userDir);
    cache.set(userDir, idx);
  }

  const res = await fetch(sourceUrl);
  if (!res.ok) return null;
  const ab = await res.arrayBuffer();
  const h = sha256(new Uint8Array(ab));
  const candidates = idx.get(h);
  return candidates?.[0] ?? null;
}
```

That is especially useful when filenames changed but file contents remained identical.

---

## 8. A small but useful transport command

The bucket transport command is short, but it captures a useful operational pattern: migrate selected buckets between two Supabase environments with a dry-run mode and bounded concurrency.

```ts
const report = await migrateBuckets(source.client, target.client, {
  buckets,
  concurrency: argv.concurrency,
  dryRun: argv["dry-run"],
});
```

This command is less about the copy logic itself and more about orchestration:
- explicit source and target env files
- optional bucket filtering
- dry-run support before destructive or expensive copy work
- a summary report at the end

---

## Practical takeaway

The useful migration patterns were not “Supabase features”, but standard operational building blocks:

- resolve environment files predictably
- split schema and data backups
- export object storage recursively with concurrency limits
- map provider-specific object paths into application-native paths
- restore using a privileged database URL
- rewrite URLs idempotently
- hydrate or recover missing files during migration

That is another reason the long-term recommendation remains the same: **build on Postgres and application-owned storage conventions as early as possible**.
