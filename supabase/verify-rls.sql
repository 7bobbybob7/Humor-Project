-- Read-only RLS verification. Everything runs inside a transaction that is
-- ROLLED BACK at the end, so no rows are created, changed or deleted.
-- Paste into the Supabase SQL Editor and Run. Read the final table.

begin;

create or replace function pg_temp.try(stmt text) returns text
language plpgsql as $$
begin
  execute stmt;
  return 'ALLOWED';
exception when others then
  return 'BLOCKED';
end $$;

create temp table results(
  n int, scenario text, expected text, actual text, verdict text
) on commit drop;

do $$
declare
  author     uuid;
  voter      uuid;
  other_gen  bigint;   -- a caption the voter did NOT write
  own_gen    bigint;   -- a caption the voter DID write
  r          text;
  claims     text;
begin
  select g.user_id, g.id into author, other_gen
    from public.generations g
   order by g.id
   limit 1;

  select g.user_id, g.id into voter, own_gen
    from public.generations g
   where g.user_id <> author
   order by g.id
   limit 1;

  if voter is null then
    insert into results values (0,'need two distinct authors','-','-','SKIPPED');
    return;
  end if;

  claims := format('{"sub":"%s","role":"authenticated"}', voter);

  -- ---------- as a signed-in user ----------
  execute 'set local role authenticated';
  execute format('set local request.jwt.claims = %L', claims);

  r := pg_temp.try(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, voter));
  insert into results values
    (1,'vote on someone else''s caption','ALLOWED',r,
     case when r='ALLOWED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'update public.votes set value=-1 where generation_id=%s and user_id=%L',
    other_gen, voter));
  insert into results values
    (2,'flip that vote (up -> down)','ALLOWED',r,
     case when r='ALLOWED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'delete from public.votes where generation_id=%s and user_id=%L',
    other_gen, voter));
  insert into results values
    (3,'retract that vote','ALLOWED',r,
     case when r='ALLOWED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    own_gen, voter));
  insert into results values
    (4,'vote on your OWN caption','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, author));
  insert into results values
    (5,'cast a vote AS another user','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'update public.generations set score=9999 where id=%s', other_gen));
  insert into results values
    (6,'inflate a caption score directly','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(format(
    'update public.profiles set first_name=''hacked'' where id=%L', author));
  insert into results values
    (7,'edit another user''s profile','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  insert into results
  select 8,'read other users'' votes','0 rows',
         count(*)::text || ' rows',
         case when count(*)=0 then 'PASS' else 'FAIL' end
    from public.votes where user_id <> voter;

  -- ---------- as an anonymous visitor ----------
  execute 'set local role anon';
  execute 'set local request.jwt.claims = ''{"role":"anon"}''';

  r := pg_temp.try(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, voter));
  insert into results values
    (9,'anonymous casts a vote','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  r := pg_temp.try(
    'insert into public.generations(user_id,prompt,system_prompt,model,caption)
       values (''00000000-0000-0000-0000-000000000000'',''x'',''x'',''x'',''x'')');
  insert into results values
    (10,'anonymous creates a caption','BLOCKED',r,
     case when r='BLOCKED' then 'PASS' else 'FAIL' end);

  insert into results
  select 11,'anonymous reads the public feed','> 0 rows',
         count(*)::text || ' rows',
         case when count(*)>0 then 'PASS' else 'FAIL' end
    from public.generations;

  execute 'reset role';
end $$;

select n, scenario, expected, actual, verdict from results order by n;

rollback;
