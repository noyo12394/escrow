-- =============================================================================
-- S.T.A.R. Earthquake Rescue Lab - Supabase schema
-- Run this in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- =============================================================================

-- Players: one row per person, identified by a unique name (one-time sign-in).
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

-- Activity: a stream of events (login, investigate, answer, submit, etc.).
create table if not exists public.activity (
  id          bigint generated always as identity primary key,
  player_name text not null,
  week        int  not null default 1,
  type        text not null,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- Submissions: a completed ranking with its worksheet score.
create table if not exists public.submissions (
  id          bigint generated always as identity primary key,
  player_name text not null,
  week        int  not null default 1,
  score       int  not null,
  ranking     jsonb not null,
  answers     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_player_idx    on public.activity (player_name);
create index if not exists submissions_player_idx on public.submissions (player_name);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The browser uses the public anon key, so we allow anonymous INSERTs (to log
-- activity) and SELECTs. Adjust to your needs - for example, drop the anon
-- SELECT policies if students should not read each other's rows, and read the
-- data from the Supabase dashboard / service role instead.
-- ---------------------------------------------------------------------------
alter table public.players     enable row level security;
alter table public.activity    enable row level security;
alter table public.submissions enable row level security;

-- players
drop policy if exists players_insert on public.players;
create policy players_insert on public.players for insert to anon with check (true);
drop policy if exists players_update on public.players;
create policy players_update on public.players for update to anon using (true) with check (true);
drop policy if exists players_select on public.players;
create policy players_select on public.players for select to anon using (true);

-- activity
drop policy if exists activity_insert on public.activity;
create policy activity_insert on public.activity for insert to anon with check (true);
drop policy if exists activity_select on public.activity;
create policy activity_select on public.activity for select to anon using (true);

-- submissions
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to anon with check (true);
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions for select to anon using (true);
