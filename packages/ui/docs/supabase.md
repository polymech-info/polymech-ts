# Supabase Development Guide

This guide covers common Supabase CLI operations for database migrations and TypeScript type generation.

**Note**: This project uses a **remote-only workflow** - we work directly with the remote Supabase database without running a local Supabase instance. This means all migrations are applied directly to the remote database.

## Two Workflow Options: Remote-Only vs Local Development

### Current Setup: Remote-Only (No Docker) ✅

This project currently uses a **remote-only workflow** without Docker:

**What we use:**
- ✅ `npx supabase migration new` - create migration files
- ✅ `npx supabase db push` - apply migrations to remote
- ✅ `npx supabase gen types` - generate TypeScript types from remote
- ✅ `npx supabase migration repair` - fix migration history

**What we DON'T use:**
- ❌ Docker Desktop
- ❌ Local Supabase instance
- ❌ `npx supabase start`
- ❌ `npx supabase db pull`

**Pros:**
- ✅ No Docker installation needed
- ✅ Simpler setup (just link and go)
- ✅ No Docker resource usage (RAM, CPU, disk)
- ✅ Faster onboarding for new developers
- ✅ Works on machines where Docker can't be installed

**Cons:**
- ❌ Test migrations directly on remote (more risky)
- ❌ Can't use `db pull` to sync from dashboard
- ❌ Need internet connection to work
- ❌ Slower migration testing cycle
- ❌ No local testing environment

### Alternative: Local Development with Docker (Optional)

If you install Docker Desktop, you can run a **local mirror** of your Supabase instance:

**How it works:**

1. Install Docker Desktop
2. Start local Supabase:
   ```bash
   npx supabase start
   ```
   This creates a complete local Supabase instance with:
   - PostgreSQL database
   - Auth server
   - Storage server
   - Realtime server
   - All accessible at `http://localhost:54321`

3. Develop locally:
   ```bash
   # Apply migrations to LOCAL database
   npx supabase db push
   
   # Test your changes locally
   # (your app connects to localhost:54321)
   
   # Pull schema changes
   npx supabase db pull
   
   # When satisfied, push to remote
   npx supabase db push --linked
   ```

**Pros:**
- ✅ Test migrations safely before applying to production
- ✅ Can use `db pull` to sync from dashboard
- ✅ Work offline
- ✅ Faster migration testing
- ✅ Complete local development environment
- ✅ Seed data locally for testing

**Cons:**
- ❌ Requires Docker Desktop (4-6 GB disk space)
- ❌ Docker uses significant RAM (2-4 GB)
- ❌ More complex setup
- ❌ Need to manage two databases (local + remote)
- ❌ Can get out of sync between local and remote

### Which Should You Choose?

**Stick with Remote-Only if:**
- You're working on a small project
- You trust your SQL and test carefully
- You want minimal setup complexity
- Your machine can't run Docker well
- You're new to database migrations

**Switch to Local Development if:**
- You're working on a production app with users
- You need to test complex migrations safely
- You want to experiment without affecting production
- You need to work offline
- Multiple developers need isolated test environments
- You use the Supabase dashboard and need to sync changes

### How to Switch to Local Development

If you decide you want local development later:

```bash
# 1. Install Docker Desktop
# Download from: https://docs.docker.com/desktop/

# 2. Start Docker Desktop

# 3. Initialize Supabase locally
npx supabase init

# 4. Start local Supabase
npx supabase start

# 5. Apply existing migrations to local
npx supabase db push

# 6. Link to remote (if not already linked)
npx supabase link --project-ref <your-project-ref>

# 7. Now you have both local and remote!
```

Then you can use both:
- `npx supabase db push` → applies to LOCAL database
- `npx supabase db push --linked` → applies to REMOTE database
- `npx supabase db pull` → pulls from remote to local migration files

### Our Current Choice: Remote-Only

For this project, we're sticking with **remote-only** to keep things simple. But the option to add local development is always there if needs change!

## Prerequisites

- Supabase CLI installed (`npm install -g supabase` or use `npx supabase`)
- A Supabase account and project at [supabase.com](https://supabase.com)
- Your project linked via CLI (see [Linking to Remote Project](#linking-to-remote-project) below)

## Linking to Remote Project

### First-Time Setup

If you haven't linked your project yet, connect to your remote Supabase project:

```bash
npx supabase link --project-ref <your-project-ref>
```

You can find your project reference in your Supabase dashboard URL:
- Format: `https://app.supabase.com/project/<your-project-ref>`
- Example: If URL is `https://app.supabase.com/project/abc123xyz`, then `abc123xyz` is your project ref

You'll be prompted to enter your database password (the one you set when creating the project).

### Checking Link Status

Verify your project is linked:

```bash
npx supabase projects list
```

This shows all your Supabase projects and indicates which one is currently linked.

### Switching Between Projects

If you work with multiple Supabase projects:

```bash
# Link to a different project
npx supabase link --project-ref <different-project-ref>

# Or unlink current project
npx supabase unlink
```

## Database Migrations

### Creating a New Migration

Create a new migration file with a descriptive name:

```bash
npx supabase migration new <migration_name>
```

Example:
```bash
npx supabase migration new add_user_preferences_table
```

This creates a new file in `supabase/migrations/` with timestamp prefix. Edit this file to add your SQL changes.

### Running Migrations on Remote (Remote-Only Workflow)

**For remote-only development** (no local Supabase instance), apply migrations directly to your linked project:

```bash
npx supabase db push
```

When linked to a remote project, this command pushes migrations to your remote database.

⚠️ **Important**: Test migrations carefully as you're working directly with your remote database!

### Checking Migration Status

See which migrations have been applied:

```bash
npx supabase migration list
```

### Pulling Schema from Remote

**⚠️ Important Note**: `npx supabase db pull` requires Docker Desktop because it creates a local "shadow database" to compare schemas. This is a limitation of the Supabase CLI and conflicts with a true remote-only workflow.

**Alternatives for Remote-Only Development:**

**Option 1: Don't Pull Schema** (Recommended for Remote-Only)

Instead of pulling schema:
1. Make all changes through migration files (never in the dashboard)
2. Always create migrations for schema changes: `npx supabase migration new <name>`
3. Apply migrations with: `npx supabase db push`
4. This ensures your migration files are the source of truth

**Option 2: Export Schema Manually**

If you must capture dashboard changes, use direct SQL export:

```bash
# Get your database connection string from Supabase dashboard
# Settings > Database > Connection string (use "Direct connection")

# Then manually export schema (requires psql or pg_dump installed)
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  --schema-only --schema=public > schema_export.sql
```

Then create a migration file from the export manually.

**Option 3: Install Docker Desktop** (If you really need db pull)

If you absolutely need `db pull` functionality:

1. Install [Docker Desktop](https://docs.docker.com/desktop/)
2. Start Docker Desktop
3. Then `npx supabase db pull` will work

But this defeats the purpose of remote-only development.

**Our Recommendation for This Project:**

Since we're doing remote-only development:
- ✅ Create all schema changes via migration files
- ✅ Never make manual changes in the Supabase dashboard
- ✅ Use `npx supabase db push` to apply migrations
- ❌ Don't use `npx supabase db pull`

## TypeScript Type Generation

### Generate Types from Remote Database

After creating or modifying database tables, regenerate TypeScript types from your remote database:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

This command:
1. Connects to your linked remote Supabase project
2. Reads the current database schema
3. Generates TypeScript types
4. Saves them to `src/integrations/supabase/types.ts`

**Pro tip**: Run this command after every migration to keep your types in sync!

### Alternative: Using Project ID Directly

If you're not in a linked project directory:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/integrations/supabase/types.ts
```

## Common Workflows

### Workflow 1: Adding a New Table (Remote-Only)

1. Create a migration file:
   ```bash
   npx supabase migration new add_my_table
   ```

2. Edit the migration file in `supabase/migrations/` with your SQL:
   ```sql
   CREATE TABLE public.my_table (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     name text NOT NULL,
     created_at timestamp with time zone DEFAULT now()
   );
   
   -- Enable RLS
   ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
   
   -- Add policies
   CREATE POLICY "Users can read own data"
   ON public.my_table FOR SELECT
   USING (auth.uid() = user_id);
   ```

3. Review your migration file carefully (you're going straight to remote!)

4. Apply the migration to remote:
   ```bash
   npx supabase db push
   ```

5. Generate TypeScript types from remote:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

6. Commit both the migration file and updated types to git

### Workflow 2: Modifying Existing Schema (Remote-Only)

1. Create a migration:
   ```bash
   npx supabase migration new modify_users_table
   ```

2. Add your ALTER statements in the migration file:
   ```sql
   -- Example: Adding a column
   ALTER TABLE public.users ADD COLUMN bio text;
   
   -- Example: Adding an index
   CREATE INDEX idx_users_email ON public.users(email);
   ```

3. Review carefully (no local testing with remote-only workflow!)

4. Apply to remote:
   ```bash
   npx supabase db push
   ```

5. Regenerate types:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

6. Commit migration file and updated types

### Workflow 3: Handling Dashboard Changes (Remote-Only)

**⚠️ Best Practice**: Avoid making changes in the Supabase dashboard. Always use migration files.

If you or a teammate accidentally made changes directly in the dashboard:

**Manual Migration Creation:**

1. Document what was changed in the dashboard
2. Create a new migration file:
   ```bash
   npx supabase migration new sync_dashboard_changes
   ```

3. Manually write the SQL that represents those changes in the migration file

4. Apply the migration (this will fail if changes already exist, which is expected):
   ```bash
   npx supabase db push
   ```

5. Mark the migration as applied even though it failed:
   ```bash
   npx supabase migration repair --status applied <migration-timestamp>
   ```

6. Regenerate types:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

7. Commit the migration file and updated types

**Better Approach**: Establish a team rule to never make manual changes in the dashboard.

### Workflow 4: Quick Deploy Script

Use the existing deploy script for a complete deployment:

```bash
bash scripts/supabase-deploy.sh
```

This script (from `scripts/supabase-deploy.sh`):
1. Deploys Mux proxy edge function
2. Pushes all pending database migrations
3. Regenerates TypeScript types from remote schema

## Troubleshooting

### Types Not Updating

If types don't reflect your changes:

1. Ensure migration was applied:
   ```bash
   npx supabase migration list
   ```

2. Try regenerating with explicit project ref:
   ```bash
   npx supabase gen types typescript --project-id <your-project-ref> > src/integrations/supabase/types.ts
   ```

### Migration Conflicts

If you have migration conflicts:

1. Check the migration order in `supabase/migrations/`
2. Ensure timestamps are correct
3. Consider creating a new migration to fix issues rather than editing old ones

### Database Out of Sync

If your migration files are out of sync with the remote database:

**Remote-Only Approach:**

1. Review what's in your `supabase/migrations/` directory
2. Check what's actually in the remote database (via Supabase dashboard > Table Editor)
3. Create a new migration to fix the differences:
   ```bash
   npx supabase migration new fix_sync_issue
   ```
4. Write SQL in the migration file to align remote with what you want
5. Apply the migration:
   ```bash
   npx supabase db push
   ```

**Note**: Without `db pull` (which requires Docker), you need to manually track what's in your database vs. your migration files.

### Migration History Mismatch

If you get an error like "The remote database's migration history does not match local files":

This happens when:
- Migration files were deleted/modified locally but the remote database still has records of them
- Team members have different migration files
- The migration history table is out of sync

**Solution 1: Repair Migration History (Recommended)**

The CLI will suggest repair commands. You can run them all at once using the provided script:

```bash
# Linux/Mac:
bash scripts/repair-migrations.sh

# Windows PowerShell:
.\scripts\repair-migrations.ps1
```

This script runs all the repair commands to sync your migration history table.

Or run them manually one by one:

```bash
# Copy all the suggested repair commands from the error output
# Example:
npx supabase migration repair --status reverted 20250927012218
npx supabase migration repair --status applied 20250119000001
# ... etc
```

**Solution 2: Clean Slate Approach**

If you have many migrations to repair and want to start fresh:

1. **Backup first!** Make sure you have your migration files in git

2. Decide on your source of truth:
   - **Option A**: Your migration files are correct → just repair them all
   - **Option B**: Remote database is correct → delete old migration files and create new ones

3. For Option B (remote is correct):
   - Delete old migration files that don't match remote
   - Manually inspect the remote schema in Supabase dashboard
   - Create new migration files that represent the current state
   - Mark them as applied:
     ```bash
     npx supabase migration repair --status applied <migration-timestamp>
     ```

4. Regenerate types:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

**Solution 3: Manual Cleanup**

If you know which migrations should be kept:

1. Check your `supabase/migrations/` directory
2. Delete any migration files that shouldn't be there
3. Run the repair commands for the remaining ones
4. Regenerate types:
   ```bash
   npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

**Understanding the Output:**

- `--status reverted` = Migration file exists locally but not applied in remote (or was rolled back)
- `--status applied` = Migration was applied in remote

After running the repair commands, your migration history should be in sync.

### Authentication Issues

If you get authentication errors:

1. Re-link your project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```

2. Verify you're using the correct database password

3. Check your internet connection

## Best Practices (Remote-Only Workflow)

1. **Review migrations carefully before pushing** - you're working directly on remote, so double-check your SQL!
2. **Regenerate types after every schema change** to keep TypeScript in sync
3. **Use descriptive migration names** (e.g., `add_video_comments_table` not `update`)
4. **Always commit migration files AND updated types.ts together** in the same commit
5. **Use `npx supabase db pull`** after any manual dashboard changes to capture them as migrations
6. **Enable RLS on new tables** unless you have a specific reason not to
7. **Add appropriate indexes** for foreign keys and frequently queried columns
8. **Use transactions** in migrations when making multiple related changes
9. **Test in a staging environment** if possible before applying to production
10. **Keep your project linked** - verify with `npx supabase projects list`

## Quick Reference Commands (Remote-Only)

```bash
# Link to your Supabase project (first time setup)
npx supabase link --project-ref <your-project-ref>

# Check which project is linked
npx supabase projects list

# Create new migration file
npx supabase migration new <descriptive_name>

# Apply migrations to remote database
npx supabase db push

# Check migration status
npx supabase migration list

# Generate TypeScript types from remote
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Deploy everything (migrations + types + edge functions)
bash scripts/supabase-deploy.sh

# Repair migration history (if needed)
bash scripts/repair-migrations.sh  # Linux/Mac
.\scripts\repair-migrations.ps1     # Windows PowerShell
```

**Note**: We don't use `npx supabase db pull` because it requires Docker Desktop, which defeats the remote-only workflow.

## Example: Complete Workflow from Start

```bash
# 1. Link your project (one-time setup)
npx supabase link --project-ref abc123xyz

# 2. Create a migration
npx supabase migration new add_comments_table

# 3. Edit the migration file in supabase/migrations/
# (Use your code editor to add SQL)

# 4. Push migration to remote
npx supabase db push

# 5. Regenerate types
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# 6. Commit your changes
git add supabase/migrations/* src/integrations/supabase/types.ts
git commit -m "Add comments table"
git push
```

## References

- [Supabase Database Import Guide](https://supabase.com/docs/guides/database/import-data)
- [Migrating Within Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase)
- [Dashboard Restore Guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [TypeScript Type Generation](https://supabase.com/docs/guides/api/rest/generating-types)
