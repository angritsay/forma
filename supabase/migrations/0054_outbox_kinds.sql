-- =============================================================================
-- 0054 — six new bot messages: access ending, and the coach session's life cycle.
--
-- The audit (items 2 and 5) found two quiet endings. A paying member is never told when the club
-- runs out: there is no auto-renewal, and on the last day the club tab simply turns into the pitch.
-- A course buyer's free club week ends the same way. This migration queues a warning for both, and
-- opens the queue to the four messages the in-app booking (0055) sends about a coach session.
--
--   `subscription_ending`  3 days before `subscriptions.expires_at`: the date, and that renewal
--                          is by hand in the app.
--   `club_trial_tomorrow`  about a day before the free week after a course ends (the trial of
--                          `gameAccess.ts`: newest activated purchase + 7 days).
--   `session_confirmed`    }
--   `session_reminder`     } queued by the booking core (0055), not here. Only the kind check and
--   `session_moved`        } the copy (`telegram-notify/copy.ts`) are this migration's part.
--   `session_cancelled`    }
--
-- ## The kind check is rebuilt, never retyped
--
-- As in 0052: the current list is read back from the constraint and the new kinds are added to
-- it, so this can never drop a kind that some migration after 0052 added. The result is a
-- superset of 0052's list by construction; `supabase/tests/93_outbox_kinds.sql` checks it anyway.
--
-- ## Who is written to, and who is not
--
--   * `subscription_ending`: a subscription that is live (active or cancelled — a cancelled one
--     keeps its paid period, 0005) and ends within three days. Not an admin: their club access
--     does not end with the subscription. Not a period of three days or less (a short manual
--     grant): «ends in three days» right after «the club is open» reads as a mistake.
--   * `club_trial_tomorrow`: the newest activated course of that address, whose week ends within
--     the next 24 hours; only someone who actually joined the club (an active row in a club
--     round) — a buyer who never opened the club has no week to lose, and telling them about it
--     would be advertising. Not someone whose subscription outlives the trial: nothing ends.
--   * Neither checks `club_quiet` (0052). That switch silences the daily touches; these two are
--     one-off notices about the person's own access, like `subscription_paid`.
--   * People without Telegram get a row that waits and expires quietly, as everywhere (0027).
--     The row never lives past the moment it warns about, and `telegram-notify` checks it again
--     right before sending: a warning whose moment has passed, or whose person has since renewed
--     or subscribed, is dropped (`accessWarningEnd` in `copy.ts`).
--
-- ## Once per period
--
-- The dedupe key carries the period: the subscription's id and its `expires_at`, the purchase's
-- id. A renewal moves `expires_at` and so earns a new warning next time; an hourly run inside the
-- window adds nothing.
--
-- ## When
--
-- `club_enqueue_access_ending()` is called every hour by the same job as the daily touches
-- (`.github/workflows/club-daily.yml`). Its windows are 72 and 24 hours wide, so a late or skipped
-- Actions run delays a warning by an hour, never loses it.
--
-- Requires 0005, 0016, 0027, 0052. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Message kinds: added to the live list (0052 does the same).
-- -----------------------------------------------------------------------------
do $$
declare
  v_def   text;
  v_kinds text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
  from pg_constraint c
  where c.conrelid = 'public.telegram_outbox'::regclass
    and c.conname = 'telegram_outbox_kind_check';

  select coalesce(array_agg(distinct k), '{}')
    into v_kinds
  from regexp_matches(coalesce(v_def, ''), '''([^'']*)''', 'g') as m,
       lateral unnest(string_to_array(btrim(m[1], '{}'), ',')) as k
  where k ~ '^[a-z][a-z0-9_]*$';

  -- 0052's list, restated: a database that somehow lost the constraint gets all of it back.
  v_kinds := v_kinds || array['course_paid', 'subscription_paid', 'workout_assigned',
                              'weekly_winner', 'support_reply', 'referral_reward', 'duo_nudge',
                              'club_task', 'club_reminder', 'club_recap'];
  -- New in 0054.
  v_kinds := v_kinds || array['subscription_ending', 'club_trial_tomorrow',
                              'session_confirmed', 'session_reminder', 'session_moved',
                              'session_cancelled'];
  select array_agg(distinct k order by k) into v_kinds from unnest(v_kinds) as k;

  execute 'alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check';
  execute format(
    'alter table public.telegram_outbox add constraint telegram_outbox_kind_check check (kind = any (%L::text[]))',
    v_kinds
  );
end $$;

-- -----------------------------------------------------------------------------
-- 2. Queue the access warnings that are due.
--
-- Service role only, like `club_enqueue_daily` (Actions through the Management API has empty
-- claims). Returns how many rows were queued — the only thing the workflow prints.
--
-- `p_at` is «what time it is» for the windows; the real time by default. The tests
-- (`supabase/tests/93_outbox_kinds.sql`) and a manual dry run need it. Deduplication does not
-- depend on it: the key is the period, not the hour.
-- -----------------------------------------------------------------------------
create or replace function public.club_enqueue_access_ending(p_at timestamptz default now())
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_at     timestamptz := coalesce(p_at, now());
  v_queued int := 0;
  v_row    record;
  v_key    text;
begin
  -- As in `club_enqueue_daily` (0052): a person's session — no; empty claims and service role — yes.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
     not in ('', 'service_role') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  -- --- subscription_ending: live, ends within three days --------------------
  for v_row in
    select s.id, s.email, s.expires_at
    from public.subscriptions s
    where s.status in ('active', 'cancelled')
      and s.expires_at is not null
      and s.expires_at > v_at
      and s.expires_at <= v_at + interval '3 days'
      -- A period no longer than the warning itself gets no warning (see the header).
      and coalesce(s.started_at, s.created_at) < s.expires_at - interval '3 days'
      and not exists (select 1 from public.admins a where a.email = s.email)
    order by s.expires_at
  loop
    begin
      v_key := 'subscription_ending:' || v_row.id::text || ':'
               || floor(extract(epoch from v_row.expires_at))::bigint::text;
      -- Already queued for this period (an earlier hour): skip. Checked before, not after, so
      -- that a repeat within one transaction — the tests' — is not counted as new either.
      continue when exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key);
      perform public.enqueue_telegram(
        v_row.email::text,
        'subscription_ending',
        v_key,
        jsonb_build_object('expires_at', v_row.expires_at),
        now(),
        -- Never outlives the period it warns about (the sender also re-checks, see the header).
        least(interval '2 days', v_row.expires_at - now())
      );
      -- enqueue_telegram drops a malformed address without a word: count only a row that landed.
      if exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key) then
        v_queued := v_queued + 1;
      end if;
    exception when others then
      -- One person loses one message, not the whole run.
      null;
    end;
  end loop;

  -- --- club_trial_tomorrow: the newest course's free week ends within a day --
  -- Tied to the club being gated: `GAME_REQUIRES_SUBSCRIPTION` (content/site/plans.ts, equal to
  -- `PLANS_ENABLED`). While it is true the club closes when the week ends; if it is ever switched
  -- off, nothing ends, and this block must be switched off with it.
  for v_row in
    select n.id, n.email, n.activated_at + interval '7 days' as ends_at
    from (
      select distinct on (p.email) p.id, p.email, p.activated_at
      from public.purchases p
      where p.status = 'active'
        and p.activated_at is not null
      order by p.email, p.activated_at desc
    ) n
    where n.activated_at + interval '7 days' > v_at
      and n.activated_at + interval '7 days' <= v_at + interval '1 day'
      and not exists (select 1 from public.admins a where a.email = n.email)
      -- A subscription that outlives the trial: nothing ends tomorrow.
      and not exists (
        select 1 from public.subscriptions s
        where s.email = n.email
          and s.status in ('active', 'cancelled')
          and s.expires_at is not null
          and s.expires_at > n.activated_at + interval '7 days'
      )
      -- Only someone who is in the club (see the header).
      and exists (
        select 1
        from public.marathon_members mem
        join public.marathons m on m.id = mem.marathon_id
        where mem.email = n.email
          and mem.status = 'active'
          and m.is_club
      )
    order by n.activated_at
  loop
    begin
      v_key := 'club_trial_tomorrow:' || v_row.id::text;
      continue when exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key);
      perform public.enqueue_telegram(
        v_row.email::text,
        'club_trial_tomorrow',
        v_key,
        jsonb_build_object('ends_at', v_row.ends_at),
        now(),
        -- Never outlives the week itself: a first run with two hours left gets a two-hour row.
        least(interval '20 hours', v_row.ends_at - now())
      );
      if exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key) then
        v_queued := v_queued + 1;
      end if;
    exception when others then
      null;
    end;
  end loop;

  return v_queued;
end;
$$;

revoke execute on function public.club_enqueue_access_ending(timestamptz) from public, anon, authenticated;
grant execute on function public.club_enqueue_access_ending(timestamptz) to service_role;

comment on function public.club_enqueue_access_ending(timestamptz) is
  'Queue subscription_ending (3 days before expires_at) and club_trial_tomorrow (a day before a course''s free club week ends), once per period (0054). Service role only; returns how many rows were queued.';

notify pgrst, 'reload schema';
