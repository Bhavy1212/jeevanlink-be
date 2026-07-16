# JeevanLink Backend

Supabase backend schema, migrations, RLS policies and seed data for the JeevanLink blood donation platform.

## Structure

```
supabase/
  migrations/
    001_init_schema.sql   — All tables (users, centres, requests, donations, messages)
    002_rls_policies.sql  — Row Level Security policies
  seed.sql                — Mock blood centre data
```

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project → choose a region.

### 2. Run migrations

In the Supabase **SQL Editor** (or via Supabase CLI):

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Manual — paste each file in SQL Editor in order:
# 1. supabase/migrations/001_init_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/seed.sql
```

### 3. Enable Realtime

In Supabase Dashboard → Database → Replication → enable **realtime** for:
- `requests`
- `messages`

### 4. Copy credentials to frontend

From Supabase Dashboard → Settings → API, copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

Paste them into `D:\RBC\.env.local` (copy from `.env.local.example`).

## Tables

| Table | Purpose |
|---|---|
| `users` | Donor and patient profiles |
| `centres` | Blood collection centres |
| `requests` | Blood donation requests |
| `donations` | Completed donation history |
| `messages` | Patient-donor chat |
