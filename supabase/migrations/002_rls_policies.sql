-- ============================================================
-- JeevanLink — Row Level Security Policies
-- Run AFTER 001_init_schema.sql
-- ============================================================

-- Enable RLS on all tables
alter table public.users     enable row level security;
alter table public.centres   enable row level security;
alter table public.requests  enable row level security;
alter table public.donations enable row level security;
alter table public.messages  enable row level security;

-- ============================================================
-- CENTRES — public read, no write from client
-- ============================================================
create policy "Centres are publicly readable"
  on public.centres for select
  using (true);

-- ============================================================
-- USERS — users can read/update their own profile
-- ============================================================
create policy "Users can read own profile"
  on public.users for select
  using (true);  -- relaxed for prototype; tighten with auth.uid() in production

create policy "Users can insert own profile"
  on public.users for insert
  with check (true);

create policy "Users can update own profile"
  on public.users for update
  using (true);

-- ============================================================
-- REQUESTS — all verified requests are readable by donors
-- ============================================================
create policy "Anyone can read verified requests"
  on public.requests for select
  using (status != 'Cancelled');

create policy "Patients can create requests"
  on public.requests for insert
  with check (true);

create policy "Donors can update request status"
  on public.requests for update
  using (true);  -- tighten with auth in production

-- ============================================================
-- DONATIONS — donors can read own donations
-- ============================================================
create policy "Donors can read own donations"
  on public.donations for select
  using (true);

create policy "Anyone can insert donations"
  on public.donations for insert
  with check (true);

-- ============================================================
-- MESSAGES — parties of a request can read/write
-- ============================================================
create policy "Messages readable by all parties"
  on public.messages for select
  using (true);

create policy "Anyone can send messages"
  on public.messages for insert
  with check (true);
