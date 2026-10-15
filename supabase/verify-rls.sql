-- Read-only RLS verification. Everything runs inside a transaction that is
-- ROLLED BACK at the end, so no rows are created, changed or deleted.
--
-- Checks ROW COUNTS, not just exceptions: under RLS an UPDATE or DELETE on a
-- row the policy forbids does not raise - it silently affects zero rows. A
-- harness that only catches exceptions reports that as success.

begin;

-- Returns the number of rows the statement actually affected, or ERROR if the
-- statement was rejected outright (which is how a blocked INSERT behaves).
create or replace function pg_temp.run(stmt text) returns text
language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n::text || ' rows';
exception when others then
  return 'ERROR';
end $$;

create temp table results(
  n int, scenario text, expected text, actual text, verdict text
) on commit drop;

grant all on results to public;
grant execute on function pg_temp.run(text) to public;

do $$
declare
  author    uuid;
  voter     uuid;
  other_gen bigint;
  own_gen   bigint;
  r         text;
begin
  select g.user_id, g.id into author, other_gen
    from public.generations g order by g.id limit 1;

  select g.user_id, g.id into voter, own_gen
    from public.generations g where g.user_id <> author order by g.id limit 1;

  if voter is null then
    insert into results values (0,'need two distinct authors','-','-','SKIPPED');
    return;
  end if;

  execute 'set local role authenticated';
  execute format('set local request.jwt.claims = %L',
                 format('{"sub":"%s","role":"authenticated"}', voter));

  -- ---- things a signed-in user SHOULD be able to do ----
  r := pg_temp.run(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, voter));
  insert into results values (1,'vote on someone else''s caption','1 rows',r,
    case when r='1 rows' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'update public.votes set value=-1 where generation_id=%s and user_id=%L',
    other_gen, voter));
  insert into results values (2,'flip that vote (up -> down)','1 rows',r,
    case when r='1 rows' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'delete from public.votes where generation_id=%s and user_id=%L',
    other_gen, voter));
  insert into results values (3,'retract that vote','1 rows',r,
    case when r='1 rows' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'update public.profiles set first_name=first_name where id=%L', voter));
  insert into results values (4,'edit your OWN profile','1 rows',r,
    case when r='1 rows' then 'PASS' else 'FAIL' end);

  -- ---- things that MUST NOT work ----
  r := pg_temp.run(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    own_gen, voter));
  insert into results values (5,'vote on your OWN caption','ERROR',r,
    case when r='ERROR' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, author));
  insert into results values (6,'cast a vote AS another user','ERROR',r,
    case when r='ERROR' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'update public.generations set score=9999 where id=%s', other_gen));
  insert into results values (7,'inflate a caption score','0 rows',r,
    case when r in ('0 rows','ERROR') then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'update public.profiles set first_name=''hacked'' where id=%L', author));
  insert into results values (8,'edit ANOTHER user''s profile','0 rows',r,
    case when r in ('0 rows','ERROR') then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'delete from public.generations where id=%s', other_gen));
  insert into results values (9,'delete someone else''s caption','0 rows',r,
    case when r in ('0 rows','ERROR') then 'PASS' else 'FAIL' end);

  insert into results
  select 10,'read other users'' votes','0 rows', count(*)::text || ' rows',
         case when count(*)=0 then 'PASS' else 'FAIL' end
    from public.votes where user_id <> voter;

  -- ---- anonymous ----
  execute 'set local role anon';
  execute 'set local request.jwt.claims = ''{"role":"anon"}''';

  r := pg_temp.run(format(
    'insert into public.votes(generation_id,user_id,value) values (%s,%L,1)',
    other_gen, voter));
  insert into results values (11,'anonymous casts a vote','ERROR',r,
    case when r='ERROR' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(
    'insert into public.generations(user_id,prompt,system_prompt,model,caption)
       values (''00000000-0000-0000-0000-000000000000'',''x'',''x'',''x'',''x'')');
  insert into results values (12,'anonymous creates a caption','ERROR',r,
    case when r='ERROR' then 'PASS' else 'FAIL' end);

  r := pg_temp.run(format(
    'update public.generations set caption=''defaced'' where id=%s', other_gen));
  insert into results values (13,'anonymous edits a caption','0 rows',r,
    case when r in ('0 rows','ERROR') then 'PASS' else 'FAIL' end);

  insert into results
  select 14,'anonymous reads the public feed','> 0 rows',
         count(*)::text || ' rows',
         case when count(*)>0 then 'PASS' else 'FAIL' end
    from public.generations;

  execute 'reset role';
exception when others then
  execute 'reset role';
  insert into results values (99,'harness error','-',SQLERRM,'FAIL');
end $$;

reset role;

select n, scenario, expected, actual, verdict from results order by n;

rollback;
