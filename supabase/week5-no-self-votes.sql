-- Week 5: stop people voting on their own captions.
-- Paste into the Supabase SQL Editor and Run. Safe to re-run.
--
-- Enforced at the database so it holds even if the UI or the server action is
-- bypassed. generations is publicly readable, so the subquery resolves for
-- any caller.

drop policy if exists "Users cast own votes"   on public.votes;
drop policy if exists "Users change own votes" on public.votes;

create policy "Users cast own votes"
  on public.votes for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
        from public.generations g
       where g.id = votes.generation_id
         and g.user_id = auth.uid()
    )
  );

create policy "Users change own votes"
  on public.votes for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
        from public.generations g
       where g.id = votes.generation_id
         and g.user_id = auth.uid()
    )
  );

-- Clear any self-votes already cast, so the standings start honest.
delete from public.votes v
 using public.generations g
 where v.generation_id = g.id
   and v.user_id = g.user_id;
