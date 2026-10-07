-- Week 4: AI caption generation + voting, with RLS locked down on every table.
-- Paste into the Supabase SQL Editor and Run. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. generations: one row per AI caption, individually votable.
--    `prompt` is the topic the user typed; `system_prompt` is the full text
--    actually sent to the model, so every generation is reproducible.
--    author_first_name is denormalized on purpose: the public feed can show
--    attribution without the profiles table ever being publicly readable.
-- ---------------------------------------------------------------------------
create table if not exists public.generations (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  author_first_name text,
  prompt            text not null,
  system_prompt     text not null,
  model             text not null,
  caption           text not null,
  up_votes          integer not null default 0,
  down_votes        integer not null default 0,
  score             integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists generations_score_idx   on public.generations (score desc, created_at desc);
create index if not exists generations_created_idx on public.generations (created_at desc);
create index if not exists generations_user_idx    on public.generations (user_id);

-- ---------------------------------------------------------------------------
-- 2. votes: one row per user per generation. The unique constraint makes
--    changing your mind an upsert rather than a duplicate row.
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  id            bigint generated always as identity primary key,
  generation_id bigint not null references public.generations(id) on delete cascade,
  user_id       uuid   not null references auth.users(id) on delete cascade,
  value         smallint not null check (value in (-1, 1)),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (generation_id, user_id)
);

create index if not exists votes_generation_idx on public.votes (generation_id);

-- ---------------------------------------------------------------------------
-- 3. Keep the vote tallies on generations in sync.
--    This is what lets the votes table stay owner-only readable: the public
--    reads aggregates from generations, never individual votes. The function
--    is security definer so it can both read all votes and write the counters
--    despite the restrictive policies below.
-- ---------------------------------------------------------------------------
create or replace function public.sync_generation_votes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target bigint;
begin
  target := coalesce(new.generation_id, old.generation_id);

  update public.generations g
     set up_votes   = (select count(*)            from public.votes v where v.generation_id = target and v.value =  1),
         down_votes = (select count(*)            from public.votes v where v.generation_id = target and v.value = -1),
         score      = (select coalesce(sum(v.value), 0) from public.votes v where v.generation_id = target)
   where g.id = target;

  return null;
end;
$$;

drop trigger if exists votes_sync on public.votes;
create trigger votes_sync
  after insert or update or delete on public.votes
  for each row execute function public.sync_generation_votes();

-- ---------------------------------------------------------------------------
-- 4. RLS: generations
--    Readable by everyone (the feed is public). Writable only by the author.
--    There is deliberately NO user-facing UPDATE policy - the vote counters
--    are maintained by the trigger above, so nobody can inflate their own score.
-- ---------------------------------------------------------------------------
alter table public.generations enable row level security;

drop policy if exists "Generations are publicly readable" on public.generations;
drop policy if exists "Users create own generations"      on public.generations;
drop policy if exists "Users delete own generations"      on public.generations;

create policy "Generations are publicly readable"
  on public.generations for select to anon, authenticated
  using (true);

create policy "Users create own generations"
  on public.generations for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own generations"
  on public.generations for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. RLS: votes - the strictest table in the database.
--    A user can only ever see, cast, change or retract their own vote.
--    Nobody, signed in or not, can read how anyone else voted.
-- ---------------------------------------------------------------------------
alter table public.votes enable row level security;

drop policy if exists "Users read own votes"    on public.votes;
drop policy if exists "Users cast own votes"    on public.votes;
drop policy if exists "Users change own votes"  on public.votes;
drop policy if exists "Users retract own votes" on public.votes;

create policy "Users read own votes"
  on public.votes for select to authenticated
  using (auth.uid() = user_id);

create policy "Users cast own votes"
  on public.votes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users change own votes"
  on public.votes for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users retract own votes"
  on public.votes for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Confirm RLS is on for every table in the public schema.
--    Run the select at the end to verify; rowsecurity should be true for all.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.jokes    enable row level security;

select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public'
 order by tablename;
