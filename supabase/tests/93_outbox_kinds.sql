-- =============================================================================
-- New bot messages (0054): the kind list, and the two access warnings.
-- Run after 10_smoke.sql on the same database (it relies on the smoke suite's admin).
--
-- What this can get wrong:
--   * the rebuilt kind check drops a kind that 0052 allowed, or misses one of the six new ones;
--   * `subscription_ending` goes to the wrong people: too early, to an admin, for a short manual
--     grant, or twice for the same period — and not again after a renewal;
--   * `club_trial_tomorrow` goes to someone who never joined the club, whose subscription
--     outlives the trial, whose week is not ending, or whose newer course moved the end;
--   * a signed-in person can call the function.
--
-- The message text is not here: it lives in `telegram-notify/copy.ts` with its own tests.
-- Everything this suite creates is removed at the end, so the suites after it see no new rows.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

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
  perform set_config('request.jwt.claims', '{}', false);
end $$;

select pg_temp.as_super();

-- --- the kind check: 0052's list and the six new kinds ---------------------------
do $$
declare
  v_def   text;
  v_kinds text[];
  v_kind  text;
begin
  select pg_get_constraintdef(c.oid) into v_def
  from pg_constraint c
  where c.conrelid = 'public.telegram_outbox'::regclass
    and c.conname = 'telegram_outbox_kind_check';
  assert v_def is not null, 'telegram_outbox_kind_check is missing';
  -- Read back the way 0052 and 0054 read it.
  select coalesce(array_agg(distinct k), '{}') into v_kinds
  from regexp_matches(v_def, '''([^'']*)''', 'g') as m,
       lateral unnest(string_to_array(btrim(m[1], '{}'), ',')) as k;

  foreach v_kind in array array[
    -- 0052's list, word for word.
    'course_paid', 'subscription_paid', 'workout_assigned', 'weekly_winner', 'support_reply',
    'referral_reward', 'duo_nudge', 'club_task', 'club_reminder', 'club_recap',
    -- 0054.
    'subscription_ending', 'club_trial_tomorrow', 'session_confirmed', 'session_reminder',
    'session_moved', 'session_cancelled'
  ] loop
    assert v_kind = any (v_kinds), 'kind missing from the check: ' || v_kind;
    -- And the table really takes it.
    insert into public.telegram_outbox (email, kind, params, dedupe_key)
    values ('kinds-probe@example.com', v_kind, '{}'::jsonb, 'kinds-probe:' || v_kind);
  end loop;

  begin
    insert into public.telegram_outbox (email, kind, params, dedupe_key)
    values ('kinds-probe@example.com', 'session_breakfast', '{}'::jsonb, 'kinds-probe:bad');
    assert false, 'an unknown kind must be rejected';
  exception when check_violation then
    null;
  end;

  delete from public.telegram_outbox where email = 'kinds-probe@example.com';
end $$;

-- --- a signed-in person cannot queue ----------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000054a1', 'ending-sub@example.com', '{}')
on conflict (id) do nothing;

select pg_temp.as_user('00000000-0000-0000-0000-0000000054a1', 'ending-sub@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.club_enqueue_access_ending();
  exception when others then
    v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'club_enqueue_access_ending is open to a signed-in person';
end $$;
select pg_temp.as_super();

-- --- subscription_ending ----------------------------------------------------------
do $$
declare
  v_admin_had boolean;
  v_n         int;
  v_row       record;
begin
  -- sub: a month, ends in two days → warned.
  -- cancelled: cancelled, but paid until two days from now → warned.
  -- later: ends in five days → not yet.
  -- short: a two-day manual grant → no warning.
  -- The smoke suite's admin, ending in two days → no warning: the club stays open to them.
  insert into public.subscriptions (email, plan, status, started_at, expires_at) values
    ('ending-sub@example.com',       'monthly', 'active',    now() - interval '28 days', now() + interval '2 days'),
    ('ending-cancelled@example.com', 'monthly', 'cancelled', now() - interval '28 days', now() + interval '2 days'),
    ('ending-later@example.com',     'monthly', 'active',    now() - interval '25 days', now() + interval '5 days'),
    ('ending-short@example.com',     'monthly', 'active',    now() - interval '1 hour',  now() + interval '2 days')
  on conflict (email) do update
    set status = excluded.status, started_at = excluded.started_at, expires_at = excluded.expires_at;

  v_admin_had := exists (select 1 from public.subscriptions where email = 'coach@example.com');
  assert exists (select 1 from public.admins where email = 'coach@example.com'),
    'the smoke suite''s admin is expected';
  if not v_admin_had then
    insert into public.subscriptions (email, plan, status, started_at, expires_at)
    values ('coach@example.com', 'monthly', 'active', now() - interval '28 days', now() + interval '2 days');
  end if;

  v_n := public.club_enqueue_access_ending();
  assert v_n >= 2, 'at least two warnings expected, got ' || v_n::text;

  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'subscription_ending'
    and o.email in ('ending-sub@example.com', 'ending-cancelled@example.com');
  assert v_n = 2, 'both live subscriptions ending in two days are warned, got ' || v_n::text;

  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'subscription_ending'
    and o.email in ('ending-later@example.com', 'ending-short@example.com', 'coach@example.com');
  assert v_n = 0, 'too early, a short grant and an admin get nothing, got ' || v_n::text;

  select o.params, o.expires_at, o.send_after into v_row from public.telegram_outbox o
  where o.kind = 'subscription_ending' and o.email = 'ending-sub@example.com';
  assert (v_row.params ->> 'expires_at')::timestamptz
         = (select s.expires_at from public.subscriptions s where s.email = 'ending-sub@example.com'),
    'the message carries the end of the period';
  assert v_row.send_after <= now(), 'sent right away';
  assert v_row.expires_at <= now() + interval '2 days 1 minute', 'the row lives two days';

  -- The next hour: nothing new.
  assert public.club_enqueue_access_ending(now() + interval '1 hour') = 0, 'a repeat adds nothing';

  -- «later» comes into the window two days on — once.
  v_n := public.club_enqueue_access_ending(now() + interval '2 days 1 hour');
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'subscription_ending' and o.email = 'ending-later@example.com';
  assert v_n = 1, 'a subscription is warned when it enters the window, got ' || v_n::text;

  -- A renewal moves expires_at: the next period gets its own warning.
  update public.subscriptions set expires_at = expires_at + interval '30 days'
  where email = 'ending-sub@example.com';
  perform public.club_enqueue_access_ending(now() + interval '30 days');
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'subscription_ending' and o.email = 'ending-sub@example.com';
  assert v_n = 2, 'a renewed period is warned again, got ' || v_n::text;

  -- A period that has ended is not warned about.
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'subscription_ending' and o.email = 'ending-cancelled@example.com';
  assert v_n = 1, 'an ended period is not warned twice, got ' || v_n::text;

  if not v_admin_had then
    delete from public.subscriptions where email = 'coach@example.com';
  end if;
end $$;

-- --- club_trial_tomorrow ----------------------------------------------------------
do $$
declare
  v_club uuid := public.club_marathon(false);
  v_n    int;
  v_row  record;
begin
  assert v_club is not null, 'no solo club';

  -- trial: a course 6.5 days ago, in the club → warned.
  -- outsider: the same course, never joined the club → nothing.
  -- subbed: in the club, but a subscription outlives the trial → nothing.
  -- early: a course 3 days ago → not yet.
  -- renewed: an old course 6.5 days ago and a newer one yesterday → the week moved, nothing.
  insert into public.purchases (email, course_id, status, activated_at) values
    ('ending-trial@example.com',    'start', 'active', now() - interval '6 days 12 hours'),
    ('ending-outsider@example.com', 'start', 'active', now() - interval '6 days 12 hours'),
    ('ending-subbed@example.com',   'start', 'active', now() - interval '6 days 12 hours'),
    ('ending-early@example.com',    'start', 'active', now() - interval '3 days'),
    ('ending-renewed@example.com',  'start', 'active', now() - interval '6 days 12 hours'),
    ('ending-renewed@example.com',  'dumbbells', 'active', now() - interval '1 day')
  on conflict (email, course_id) do update
    set status = excluded.status, activated_at = excluded.activated_at;

  insert into public.subscriptions (email, plan, status, started_at, expires_at)
  values ('ending-subbed@example.com', 'monthly', 'active', now() - interval '1 day', now() + interval '29 days')
  on conflict (email) do update set status = 'active', expires_at = excluded.expires_at;

  insert into public.marathon_members (marathon_id, email)
  select v_club, e
  from unnest(array['ending-trial@example.com', 'ending-subbed@example.com',
                    'ending-early@example.com', 'ending-renewed@example.com']) as e
  on conflict (marathon_id, email) do update set status = 'active';

  v_n := public.club_enqueue_access_ending();
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_trial_tomorrow' and o.email like 'ending-%';
  assert v_n = 1, 'only the club member whose week ends tomorrow is warned, got ' || v_n::text;

  select o.params into v_row from public.telegram_outbox o
  where o.kind = 'club_trial_tomorrow' and o.email = 'ending-trial@example.com';
  assert v_row.params is not null, 'the trial member is the one warned';
  assert (v_row.params ->> 'ends_at')::timestamptz
         = (select p.activated_at + interval '7 days' from public.purchases p
            where p.email = 'ending-trial@example.com' and p.course_id = 'start'),
    'the message carries the end of the week';

  assert public.club_enqueue_access_ending(now() + interval '1 hour') = 0,
    'a repeat within the window adds nothing';

  -- «early» comes into the window three and a half days on — once.
  perform public.club_enqueue_access_ending(now() + interval '3 days 12 hours');
  perform public.club_enqueue_access_ending(now() + interval '3 days 13 hours');
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_trial_tomorrow' and o.email = 'ending-early@example.com';
  assert v_n = 1, 'warned once when the week comes to its last day, got ' || v_n::text;

  -- Never a raw address in params.
  select count(*) into v_n from public.telegram_outbox o
  where o.email like 'ending-%' and o.params::text ilike '%@example.com%';
  assert v_n = 0, 'no addresses in params';
end $$;

-- --- clean up: the suites after this one count club members and outbox rows -------
do $$
begin
  delete from public.telegram_outbox where email like 'ending-%';
  delete from public.marathon_members where email like 'ending-%';
  delete from public.purchases where email like 'ending-%';
  delete from public.subscriptions where email like 'ending-%';
end $$;

select 'ALL TESTS PASSED';
