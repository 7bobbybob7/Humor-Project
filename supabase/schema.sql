-- Week 2 assignment: jokes table for the Humor Project.
-- Paste this whole file into the Supabase SQL Editor and click "Run".

create table if not exists public.jokes (
  id          bigint generated always as identity primary key,
  setup       text not null,
  punchline   text not null,
  category    text,
  created_at  timestamptz not null default now()
);

-- Row Level Security is on by default for new tables. Without the policy
-- below, the anon key returns an empty array instead of an error, which looks
-- exactly like an empty table. The policy grants read-only public access.
alter table public.jokes enable row level security;

drop policy if exists "Public read access" on public.jokes;
create policy "Public read access"
  on public.jokes
  for select
  to anon, authenticated
  using (true);

insert into public.jokes (setup, punchline, category) values
  ('Why do programmers prefer dark mode?', 'Because light attracts bugs.', 'Programming'),
  ('How many programmers does it take to change a light bulb?', 'None. That''s a hardware problem.', 'Programming'),
  ('Why did the database administrator leave their spouse?', 'They had too many one-to-many relationships.', 'Databases'),
  ('Why was the JavaScript developer sad?', 'They didn''t know how to null their feelings.', 'Programming'),
  ('What is a foreign key''s favorite kind of music?', 'Anything with a strong reference.', 'Databases'),
  ('Why do front-end developers eat lunch alone?', 'Because they don''t know how to join tables.', 'Databases'),
  ('What did the server say to the client?', 'Stop making requests, I need some space.', 'Web'),
  ('Why did the developer go broke?', 'Because they used up all their cache.', 'Web');
