-- ============================================================
-- JeevanLink — Database Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: users
-- Stores both donors and patients
-- ============================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  mobile        text unique not null,
  role          text not null check (role in ('donor', 'patient')),
  name          text,
  age           integer,
  blood_group   text,
  area          text,
  id_type       text default 'GPS Verified',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

comment on table public.users is 'Stores donor and patient profiles';

-- ============================================================
-- TABLE: centres
-- Blood collection centres (hospitals, blood banks, NGOs)
-- ============================================================
create table if not exists public.centres (
  id            text primary key,
  name          text not null,
  name_hi       text,
  type          text check (type in ('hospital', 'bloodbank', 'ngo')),
  distance      text,
  distance_hi   text,
  hours         text,
  hours_hi      text,
  address       text,
  address_hi    text,
  lat           double precision,
  lon           double precision,
  verified      boolean default true,
  created_at    timestamptz default now()
);

comment on table public.centres is 'Blood collection centres';

-- ============================================================
-- TABLE: requests
-- Blood donation requests from patients
-- ============================================================
create table if not exists public.requests (
  id                    text primary key,
  patient_id            uuid references public.users(id) on delete set null,
  patient_initials      text,
  user_type             text default 'patient',
  blood_group           text not null,
  units                 text default '1',
  component             text default 'Whole Blood',
  required_date         text,
  slip_name             text,
  centre_id             text references public.centres(id),
  status                text default 'Verified'
                          check (status in (
                            'Verified', 'Donor Accepted',
                            'Donor Arrived', 'Completed', 'Cancelled'
                          )),
  urgency               text default 'Standard' check (urgency in ('Urgent', 'Standard')),
  accepted_by_donor_id  uuid references public.users(id) on delete set null,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

comment on table public.requests is 'Blood donation requests';

-- ============================================================
-- TABLE: donations
-- Completed donation records
-- ============================================================
create table if not exists public.donations (
  id            text primary key,
  request_id    text references public.requests(id) on delete set null,
  donor_id      uuid references public.users(id) on delete set null,
  centre_name   text,
  units         text default '1',
  component     text default 'Whole Blood',
  donated_date  text,
  created_at    timestamptz default now()
);

comment on table public.donations is 'Completed blood donation records';

-- ============================================================
-- TABLE: messages
-- Chat messages between patient and donor per request
-- ============================================================
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  request_id    text references public.requests(id) on delete cascade,
  sender_role   text not null check (sender_role in ('patient', 'donor')),
  sender_id     uuid references public.users(id) on delete set null,
  text          text not null,
  created_at    timestamptz default now()
);

comment on table public.messages is 'Chat messages between patient and donor';

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_requests_status        on public.requests(status);
create index if not exists idx_requests_blood_group   on public.requests(blood_group);
create index if not exists idx_requests_created_at    on public.requests(created_at desc);
create index if not exists idx_donations_donor_id     on public.donations(donor_id);
create index if not exists idx_messages_request_id    on public.messages(request_id);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger on_requests_updated
  before update on public.requests
  for each row execute procedure public.handle_updated_at();
