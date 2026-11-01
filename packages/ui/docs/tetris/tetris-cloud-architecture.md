# Proposal: Tetris AI "Hive Mind" Cloud Architecture (Key-Value)

## Problem
The current Tetris AI is limited by:
1.  **Local Memory**: `localStorage` restricts history to ~100 games.
2.  **Isolation**: Strategies learned on one device are not shared.

## Solution: "Hive Mind" via Simple Key-Value Storage
We propose using Supabase as a simple, flexible NoSQL-style store. This avoids managing complex relational schemas while allowing the AI to dump large amounts of training data ("Long-Term Memory") into the cloud.

### 1. Database Schema
A single, generic table to store all AI data.

#### `tetris_data_store`
```sql
create table tetris_data_store (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  
  -- Partitioning
  bucket text not null,  -- e.g., 'replay', 'model_snapshot', 'experiment'
  key text,              -- Optional human-readable ID (e.g., 'latest_v5')
  
  -- The Payload
  value jsonb not null,  -- The actual game data / neural weights
  
  -- Indexing (For "High Score" queries)
  score int,             -- Extracted from value for fast sorting
  created_at timestamptz default now()
);

-- Index for retrieving the best games (The "Memory")
create index idx_tetris_store_bucket_score on tetris_data_store(bucket, score desc);
```

### 2. Usage Patterns

#### A. Storing Memories (Game Replays)
Instead of a rigid schema, the client simply dumps the game result JSON.
```typescript
await supabase.from('tetris_data_store').insert({
  bucket: 'replay',
  score: gameResult.score, // Hoisted for indexing
  value: gameResult        // { boardFeatures, weights, version... }
});
```

#### B. Retrieving "Collective Memory"
The AI can now fetch the top 1,000 global games to train on.
```typescript
const { data } = await supabase
  .from('tetris_data_store')
  .select('value')
  .eq('bucket', 'replay')
  .order('score', { ascending: false })
  .limit(1000);
  
// Result: A massive array of high-quality training examples from all users.
```

#### C. syncing the "Global Brain"
We can store the canonical "Best Model" under a known key.
```typescript
// Fetching the Hive Mind
const { data } = await supabase
  .from('tetris_data_store')
  .select('value')
  .eq('bucket', 'model_snapshot')
  .eq('key', 'production_v1')
  .single();
  
// Updating the Hive Mind (Admin / Edge Function)
await supabase.from('tetris_data_store').upsert({
  bucket: 'model_snapshot',
  key: 'production_v1',
  value: newNetworkWeights
});
```

### 3. Implementation Plan

1.  **Phase 1: Validation**
    *   Create the `tetris_data_store` table via SQL Editor.
    *   Add RLS policies (Insert: Authenticated, Select: Public).

2.  **Phase 2: Client Integration**
    *   Update `aiStrategies.ts` to push high-score games (>100k) to the `replay` bucket.
    *   Add a "Load Hive Mind" button in `WeightsTuner.tsx`.

3.  **Phase 3: Training**
    *   Create a simple script (or Edge Function) that pulls the top 1,000 `replay` items and runs the `train()` loop, then updates the `production_v1` model.

---

## Benefits of Key-Value Approach
*   **Flexibility**: We can add new fields to the `value` JSON (e.g., "max_combo", "avg_speed") without migration.
*   **Simplicity**: Only one table to manage.
*   **Scale**: Partitioning by `bucket` allows us to store millions of replays easily.
