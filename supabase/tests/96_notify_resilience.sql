-- =============================================================================
-- The sender's claim, the blocked flag and the week's version (0059).
--
-- Run after the other suites on the same database, with 0059_notify_resilience.sql applied.
--
-- What this can get wrong:
--   * two sender runs take the same row: a row another transaction holds must be skipped, not
--     waited for and not returned, and a claimed row must stay out of the next batch until its
--     lease runs out;
--   * a lease never runs out, so a crashed run's rows are never sent;
--   * the owner's queue claims a kind the function cannot word, and it stalls the batch;
--   * a blocked chat is still offered to the sender, or stays blocked after a new account;
--   * anybody but the service role flips the flag, or anybody but an admin reads it;
--   * a week edited from an old copy overwrites the newer one, or an old client is refused.
--
-- The skip-locked check needs a second connection, so the rows it looks at are committed and
-- `dblink` holds the lock from outside; everything created is removed at the end.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create extension if not exists dblink;

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000059a1', 'nr-anna@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000059b2', 'nr-boris@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000059c3', 'nr-cleo@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000059d4', 'nr-admin@example.com', '{}')
on conflict (id) do nothing;
insert into public.admins (email) values ('nr-admin@example.com') on conflict do nothing;

update public.profiles set telegram_id = 59059001 where email = 'nr-anna@example.com';
update public.profiles set telegram_id = 59059002 where email = 'nr-boris@example.com';
update public.profiles set telegram_id = 59059003 where email = 'nr-cleo@example.com';
-- Its own statement: a changed telegram_id clears the flag in the same update (the trigger).
update public.profiles set telegram_blocked_at = now() where email = 'nr-cleo@example.com';

-- Sent long ago on purpose: first in the order, so whatever other suites left pending does not
-- crowd them out of a batch.
insert into public.telegram_outbox (email, kind, params, send_after, dedupe_key) values
  ('nr-anna@example.com',  'course_paid', '{"courseId":"start"}', '2001-01-01', 'nr:anna'),
  ('nr-boris@example.com', 'course_paid', '{"courseId":"start"}', '2001-01-02', 'nr:boris'),
  ('nr-cleo@example.com',  'course_paid', '{"courseId":"start"}', '2001-01-03', 'nr:cleo');

-- --- due: a blocked chat is not offered ----------------------------------------------------------
do $$
declare
  v text[];
begin
  select array_agg(d.email order by d.email) into v
  from public.telegram_outbox_due(200) d where d.email like 'nr-%';
  assert v = array['nr-anna@example.com', 'nr-boris@example.com'],
    'due must offer anna and boris and not the blocked cleo, got ' || coalesce(v::text, 'null');
end $$;

-- --- claim: a row held by another run is skipped, not waited for ---------------------------------
select dblink_connect('nr_other', 'dbname=' || current_database());
select dblink_exec('nr_other', 'begin');
select * from dblink('nr_other',
  $q$select id::text from public.telegram_outbox where dedupe_key = 'nr:anna' for update$q$)
  as t(id text);

-- Waiting would be the bug; a lock timeout turns a wait into a failure instead of a hang.
set lock_timeout = '3s';
do $$
declare
  v text[];
begin
  select array_agg(c.email order by c.email) into v
  from public.telegram_outbox_claim(200) c where c.email like 'nr-%';
  assert v = array['nr-boris@example.com'],
    'the claim must skip the row another run holds, got ' || coalesce(v::text, 'null');
  assert (select claimed_until > now() + interval '4 minutes'
            from public.telegram_outbox where dedupe_key = 'nr:boris'),
    'a claimed row carries its lease';
  assert (select claimed_until is null from public.telegram_outbox where dedupe_key = 'nr:anna'),
    'a skipped row is not stamped';
  assert (select telegram_id from public.telegram_outbox_claim(200) c
           where c.email = 'nr-boris@example.com') is null,
    'a leased row is not claimed twice';
  assert not exists (select 1 from public.telegram_outbox_due(200) d
                      where d.email = 'nr-boris@example.com'),
    'a leased row is not due';
end $$;
reset lock_timeout;

select dblink_exec('nr_other', 'rollback');
select dblink_disconnect('nr_other');

do $$
declare
  r record;
begin
  -- Released by the other run: now it is this run's, with its chat and language.
  select * into r from public.telegram_outbox_claim(200) c where c.email = 'nr-anna@example.com';
  assert r.telegram_id = 59059001, 'the released row is claimed with its chat';
  assert r.kind = 'course_paid' and r.attempts = 0, 'the claimed row comes back whole';

  -- A run that died: its lease runs out and the next run takes the row.
  update public.telegram_outbox set claimed_until = now() - interval '1 second'
   where dedupe_key = 'nr:boris';
  assert exists (select 1 from public.telegram_outbox_claim(200) c
                  where c.email = 'nr-boris@example.com'),
    'an expired lease is claimed again';
  assert (select status from public.telegram_outbox where dedupe_key = 'nr:boris') = 'pending',
    'claiming changes no status';
end $$;

-- --- only the sender claims -----------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000059a1', 'nr-anna@example.com');
do $$
begin
  begin
    perform public.telegram_outbox_claim(1);
    raise exception 'a signed-in person claimed the queue';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.telegram_set_blocked(59059001, true);
    raise exception 'a signed-in person flipped the blocked flag';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_outbox_claim(null, 1);
    raise exception 'a signed-in person claimed the owner queue';
  exception when insufficient_privilege then null;
  end;
end $$;
select pg_temp.as_super();

-- --- the owner's queue: only known kinds are claimed ----------------------------------------------
insert into public.admin_outbox (topic, kind, params, dedupe_key, created_at) values
  ('signups', 'nr_from_the_future', '{}', 'nr:unknown', '2001-01-01'),
  ('signups', 'signup', '{"email":"nr-anna@example.com"}', 'nr:signup', '2001-01-02');

do $$
declare
  v text[];
begin
  select array_agg(c.dedupe_key order by c.dedupe_key) into v
  from public.admin_outbox_claim(array['signup', 'course_paid'], 200) c
  where c.dedupe_key like 'nr:%';
  assert v = array['nr:signup'], 'only a kind the sender knows is claimed, got ' || coalesce(v::text, 'null');
  assert (select claimed_until is null from public.admin_outbox where dedupe_key = 'nr:unknown'),
    'an unknown kind is left alone';
  -- Without a kind list every kind is claimed — except the one already leased.
  select array_agg(c.dedupe_key order by c.dedupe_key) into v
  from public.admin_outbox_claim(null, 200) c
  where c.dedupe_key like 'nr:%';
  assert v = array['nr:unknown'], 'no kind list takes every kind but the leased one, got '
    || coalesce(v::text, 'null');
end $$;

-- --- blocked and unblocked ------------------------------------------------------------------------
do $$
begin
  assert public.telegram_set_blocked(59059001, true) = 1, 'a 403 flags the profile';
  assert public.telegram_set_blocked(59059001, true) = 0, 'a second 403 changes nothing';
  assert public.telegram_set_blocked(59059999, true) = 0, 'a chat with no profile is fine';

  insert into public.telegram_outbox (email, kind, params, send_after, dedupe_key)
  values ('nr-anna@example.com', 'subscription_paid', '{"plan":"monthly"}', '2001-01-04',
          'nr:anna2');
  assert not exists (select 1 from public.telegram_outbox_claim(200) c
                      where c.email = 'nr-anna@example.com'),
    'a blocked chat is not claimed';

  -- The person wrote to the bot again.
  assert public.telegram_set_blocked(59059001, false) = 1, 'writing to the bot clears the flag';
  assert exists (select 1 from public.telegram_outbox_due(200) d where d.email = 'nr-anna@example.com'),
    'and the queue reaches them again';

  -- Another Telegram account is another chat.
  update public.profiles set telegram_id = 59059033 where email = 'nr-cleo@example.com';
  assert (select telegram_blocked_at is null from public.profiles where email = 'nr-cleo@example.com'),
    'linking another account clears the flag';
  update public.profiles set telegram_blocked_at = now() where email = 'nr-cleo@example.com';
  update public.profiles set display_name = 'Клео' where email = 'nr-cleo@example.com';
  assert (select telegram_blocked_at is not null from public.profiles where email = 'nr-cleo@example.com'),
    'any other change keeps it';
end $$;

-- --- the admin sees it ----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000059d4', 'nr-admin@example.com');
do $$
declare
  v text[];
begin
  select array_agg(b.email order by b.email) into v
  from public.admin_telegram_blocked(array['nr-anna@example.com', 'NR-Cleo@example.com',
                                           'nobody@example.com']) b;
  assert v = array['nr-cleo@example.com'], 'the admin sees exactly the blocked address, got '
    || coalesce(v::text, 'null');
  assert not exists (select 1 from public.admin_telegram_blocked(array[]::text[])),
    'an empty list is an empty answer';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000059a1', 'nr-anna@example.com');
do $$
begin
  perform public.admin_telegram_blocked(array['nr-cleo@example.com']);
  raise exception 'a non-admin read the blocked flag';
exception when insufficient_privilege then null;
end $$;

-- --- the week's version ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000059d4', 'nr-admin@example.com');
do $$
declare
  v_read  timestamptz;
  v_after timestamptz;
begin
  select availability_updated_at into v_read from public.coaches where id = 'sergey';
  assert v_read is not null, 'every coach has a version';

  assert public.admin_set_availability('sergey', '[{"weekday":1,"start":"10:00","end":"12:00"}]',
                                        v_read) = 1, 'a save from the current version goes';
  select availability_updated_at into v_after from public.coaches where id = 'sergey';
  assert v_after > v_read, 'a save moves the version';

  begin
    perform public.admin_set_availability('sergey', '[]', v_read);
    raise exception 'a week edited from an old copy was saved';
  exception when others then
    assert sqlerrm = 'stale_week', 'the refusal names itself, got ' || sqlerrm;
  end;
  assert (select count(*) from public.coach_availability where coach_id = 'sergey') = 1,
    'the refused save changed nothing';

  -- An old client sends no version and is not refused.
  assert public.admin_set_availability('sergey', '[]') = 0, 'no version, no check';
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000059a1', 'nr-anna@example.com');
do $$
begin
  perform public.admin_set_availability('sergey', '[]', null);
  raise exception 'a non-admin saved the week';
exception when insufficient_privilege then null;
end $$;

-- --- clean up -------------------------------------------------------------------------------------
select pg_temp.as_super();
delete from public.telegram_outbox where dedupe_key like 'nr:%';
delete from public.admin_outbox where dedupe_key like 'nr:%';
delete from public.coach_availability where coach_id = 'sergey';
delete from public.admins where email = 'nr-admin@example.com';
update public.profiles set telegram_id = null, telegram_blocked_at = null
 where email like 'nr-%@example.com';

\echo 96_notify_resilience: ALL TESTS PASSED
