-- Week 3 assignment: profiles, the auth.users trigger, avatar storage,
-- and joke attribution. Paste into the Supabase SQL Editor and Run.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. profiles table
--    first_name / last_name are nullable on purpose: a brand new user has not
--    told us their name yet, and the app prompts them for it after first login.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Trigger: create a profile row the first time a user signs in.
--    security definer is required - the trigger runs while the row is being
--    inserted into auth.users, which the calling role cannot write to.
--    Names are deliberately left NULL even though Google sends given_name /
--    family_name, so that the "complete your profile" prompt is exercised on
--    first login. The avatar is pre-filled because there is nothing to prompt for.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: if you already signed in before running this, create the row now.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. RLS on profiles: a user may read and edit only their own row.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile"   on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 4. Avatar storage. The assignment forbids binary image data in the database,
--    so the image bytes live in Supabase Storage and the table keeps only a URL.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users upload own avatar"             on storage.objects;
drop policy if exists "Users update own avatar"             on storage.objects;

create policy "Avatar images are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

-- Each user may only write inside a folder named after their own user id.
create policy "Users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 5. Attribute jokes to the user who submitted them, so the protected
--    "add a joke" route has something user-specific to write.
-- ---------------------------------------------------------------------------
alter table public.jokes
  add column if not exists user_id uuid references auth.users(id) on delete set null;

drop policy if exists "Authenticated users can add jokes" on public.jokes;
create policy "Authenticated users can add jokes"
  on public.jokes for insert to authenticated
  with check (auth.uid() = user_id);
