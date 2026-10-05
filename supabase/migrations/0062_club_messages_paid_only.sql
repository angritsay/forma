-- =============================================================================
-- 0062 — club messages go only to paying club members.
--
-- Owner: nobody is in the club yet, so nobody outside the club should hear from it. Until now the
-- bot's club messages also reached course buyers during their free club week (0052's
-- `club_member_reachable`: admin, live subscription, or a course activated within seven days):
--
--   * the daily touches (0052): `club_task`, `club_reminder`, `club_recap`;
--   * «your free week ends tomorrow — subscribe» (`club_trial_tomorrow`, 0054);
--   * edge cases: the duo nudge (0051) to a partner without a subscription, the weekly winner
--     (0029/0035) without one, and the referral "thank you" without days (0051/0053) to an
--     inviter who has none.
--
-- ## The rule
--
-- A club message goes to an address only when `club_paid_reachable(email)` is true: the address
-- is an admin's, or its subscription is live (`subscription_live`, 0005 — a cancelled one keeps its
-- paid period). A course buyer's free week no longer counts for messages.
--
-- `club_member_reachable` (0052) is **not** changed: it is the twin of `club_access()` and the app's
-- own club access (the free week inside the app) still follows it. Only who the bot writes to
-- changes.
--
-- ## What changes
--
--   1. New `club_paid_reachable(text)`.
--   2. `club_enqueue_daily` (0052): the member filter uses it.
--   3. `club_enqueue_access_ending` (0054): the `club_trial_tomorrow` block is gone; only
--      `subscription_ending` is queued, which by construction reaches subscribers only. The kind
--      stays in the outbox check and in `telegram-notify` (old rows, harmless), it is just never
--      queued again.
--   4. `club_duo_nudge` (0051): a partner who does not pay gets nothing; the call still succeeds,
--      so the button in the app does not turn into an error.
--   5. `marathon_winners_notify` (0035): a winner who does not pay gets no bot message. The
--      announcement itself (the row in `marathon_winners`) is untouched.
--   6. `referral_reward` (0053): the inviter's message is queued only when the inviter pays. An
--      inviter who earned days has a live subscription by then, so in practice this drops only the
--      no-days "thank you" to an inviter outside the club.
--   7. A one-off purge of rows already queued (`status = 'pending'`) of these kinds whose recipient
--      does not pay, so nothing already waiting goes out after this migration.
--
-- Transactional messages are untouched: course and subscription paid, workout assigned, support
-- replies, coach sessions, and everything in the admin channel.
--
-- Each function is restated from its latest definition (0052, 0054, 0051, 0035, 0053 — none is
-- redefined in 0055–0061) with the same signature, `security definer`, `search_path` and grants.
--
-- Requires 0005, 0029, 0035, 0051, 0052, 0053, 0054. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Who the bot may write to about the club: an admin or a live subscription.
-- -----------------------------------------------------------------------------
create or replace function public.club_paid_reachable(p_email text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select nullif(btrim(p_email), '') is not null and (
    exists (select 1 from public.admins a where a.email = p_email::citext)
    or exists (
      select 1 from public.subscriptions s
      where s.email = p_email::citext
        and public.subscription_live(s.status, s.expires_at)
    )
  );
$$;

revoke execute on function public.club_paid_reachable(text) from public, anon, authenticated;

comment on function public.club_paid_reachable(text) is
  'Whether the bot may send this address club messages (0062): an admin or a live subscription. Unlike club_member_reachable, a course''s free week does not count. Service-side only.';

-- -----------------------------------------------------------------------------
-- 2. Daily touches (0052), restated with `club_paid_reachable` as the member filter.
-- -----------------------------------------------------------------------------
create or replace function public.club_enqueue_daily(p_kind text, p_at timestamptz default now())
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind   text := btrim(coalesce(p_kind, ''));
  v_queued int  := 0;
  v_round  record;
  v_member record;
  v_task   record;
  v_local  timestamp;
  v_date   date;
  v_hour   int;
  v_day    int;
  v_week   int;
  v_key    text;
  v_ttl    interval;
  v_params jsonb;
  v_streak int;
  v_uid    uuid;
  v_claims text;
  v_place  bigint;
  v_points bigint;
  v_done   int;
  v_total  int;
begin
  -- As in `apply_subscription_payment` (0005): a person's session — no; the SQL editor and the
  -- Management API (empty claims) and the service role — yes.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
     not in ('', 'service_role') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_kind not in ('club_task', 'club_reminder', 'club_recap') then
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;

  for v_round in
    select m.id, m.starts_on, m.days, m.timezone
    from public.marathons m
    where m.is_club and m.status = 'active'
    -- Solo first: the default tab; the weekly recap follows it and the second round is skipped.
    order by m.team_size, m.starts_on desc
  loop
    v_local := coalesce(p_at, now()) at time zone v_round.timezone;
    v_date  := v_local::date;
    v_hour  := extract(hour from v_local)::int;
    v_day   := (v_date - v_round.starts_on) + 1;
    if v_day < 1 or v_day > v_round.days then
      continue;
    end if;
    v_week := public.marathon_week_of(v_day);

    -- The round's hour. A two-hour window (see 0052): Actions cron runs late, and the key by date
    -- prevents a second message.
    if v_kind = 'club_task' and v_hour not in (8, 9) then
      continue;
    end if;
    if v_kind = 'club_reminder' and v_hour not in (20, 21) then
      continue;
    end if;
    if v_kind = 'club_recap' and (extract(isodow from v_date) <> 7 or v_hour not in (21, 22)) then
      continue;
    end if;

    for v_member in
      select mem.id, mem.email
      from public.marathon_members mem
      where mem.marathon_id = v_round.id
        and mem.status = 'active'
        -- 0062: paying members and admins only; a course's free week does not count.
        and public.club_paid_reachable(mem.email::text)
        -- Switched off in their account.
        and not exists (
          select 1
          from public.feature_flags f
          join public.profiles p on p.id = f.user_id
          where f.flag = 'club_quiet' and p.email = mem.email
        )
        -- Already got this kind today — from another round or an earlier run in the window.
        and not exists (
          select 1 from public.telegram_outbox o
          where o.email = mem.email
            and o.kind = v_kind
            and o.created_at > now() - interval '20 hours'
        )
      order by mem.created_at
    loop
      begin
        v_key := null;

        if v_kind = 'club_task' then
          -- One task per message: the one that earns points first, then the coach's order. A day
          -- with no task for this person gets no message: there is nothing to say.
          select t.title, t.title_en, t.rule, t.points
            into v_task
          from public.marathon_tasks t
          where t.marathon_id = v_round.id
            and t.day_index = v_day
            and public.club_task_for_member(t.id, v_member.id)
          order by (t.rule = 'none'), t.sort_order, t.created_at
          limit 1;
          if v_task.title is null then
            continue;
          end if;
          v_key := 'club_task:' || v_round.id::text || ':' || v_member.id::text || ':' || v_date::text;
          v_ttl := interval '12 hours';
          v_params := jsonb_build_object(
            'title', v_task.title,
            'title_en', v_task.title_en,
            'points', case when v_task.rule = 'none' then 0 else v_task.points end,
            'day', v_day
          );

        elsif v_kind = 'club_reminder' then
          -- Already checked in today — silence. No streak — nothing to save.
          if exists (select 1 from public.club_days_of(v_member.email, v_date) d where d = v_date) then
            continue;
          end if;
          v_streak := public.club_streak_of(v_member.email, v_date);
          if v_streak < 1 then
            continue;
          end if;
          v_key := 'club_reminder:' || v_round.id::text || ':' || v_member.id::text || ':' || v_date::text;
          v_ttl := interval '4 hours';
          v_params := jsonb_build_object('streak', v_streak);

        else
          -- The recap uses the same functions that draw the board, as the member (see 0052).
          select p.id into v_uid from public.profiles p where p.email = v_member.email limit 1;
          if v_uid is null then
            continue;
          end if;
          v_claims := coalesce(current_setting('request.jwt.claims', true), '');
          perform set_config('request.jwt.claims',
            json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
          begin
            select s.rank, s.points into v_place, v_points
            from public.marathon_scores(v_round.id, v_week) s
            where s.is_mine
            limit 1;
            select coalesce(sum(p.tasks_done), 0)::int, coalesce(sum(p.tasks_total), 0)::int
              into v_done, v_total
            from public.marathon_my_points(v_round.id) p
            where p.week = v_week;
          exception when others then
            perform set_config('request.jwt.claims', v_claims, true);
            raise;
          end;
          perform set_config('request.jwt.claims', v_claims, true);

          if coalesce(v_points, 0) = 0 and coalesce(v_total, 0) = 0 then
            continue;
          end if;
          v_key := 'club_recap:' || v_round.id::text || ':' || v_member.id::text || ':' || v_week::text;
          v_ttl := interval '24 hours';
          v_params := jsonb_build_object(
            'week', v_week,
            'place', v_place,
            'points', coalesce(v_points, 0),
            'done', coalesce(v_done, 0),
            'total', coalesce(v_total, 0),
            'streak', public.club_streak_of(v_member.email, v_date)
          );
        end if;

        perform public.enqueue_telegram(v_member.email::text, v_kind, v_key, v_params, now(), v_ttl);
        -- `on conflict do nothing` in enqueue_telegram is silent about a repeat; this run's row is
        -- recognised by `created_at = now()`, which is one instant within the transaction.
        if exists (
          select 1 from public.telegram_outbox o
          where o.dedupe_key = v_key and o.created_at = now()
        ) then
          v_queued := v_queued + 1;
        end if;
      exception when others then
        -- One person loses one message, not the whole club's morning.
        null;
      end;
    end loop;
  end loop;

  return v_queued;
end;
$$;

revoke execute on function public.club_enqueue_daily(text, timestamptz) from public, anon, authenticated;
grant execute on function public.club_enqueue_daily(text, timestamptz) to service_role;

comment on function public.club_enqueue_daily(text, timestamptz) is
  'Queue the club''s daily bot message of this kind (club_task 08:00, club_reminder 20:00, club_recap Sunday 21:00, local to each round) for every paying member or admin without club_quiet (0052, paid-only since 0062). Service role only; returns how many rows were queued.';

-- -----------------------------------------------------------------------------
-- 3. Access warnings (0054), restated without `club_trial_tomorrow`.
--
-- `subscription_ending` is unchanged: it only ever reaches a live subscription. The free-week
-- warning was a pitch to someone outside the club, which is exactly what 0062 stops.
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
      -- A period no longer than the warning itself gets no warning (see 0054).
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
        -- Never outlives the period it warns about (the sender also re-checks, see 0054).
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

  -- `club_trial_tomorrow` (0054) is no longer queued (0062): club messages go to paying members
  -- only, and a course buyer's free week is not paid membership.

  return v_queued;
end;
$$;

revoke execute on function public.club_enqueue_access_ending(timestamptz) from public, anon, authenticated;
grant execute on function public.club_enqueue_access_ending(timestamptz) to service_role;

comment on function public.club_enqueue_access_ending(timestamptz) is
  'Queue subscription_ending (3 days before expires_at), once per period (0054). Since 0062 club_trial_tomorrow is no longer queued: club messages go to paying members only. Service role only; returns how many rows were queued.';

-- -----------------------------------------------------------------------------
-- 4. Duo nudge (0051): only to a paying partner.
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_nudge()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid   := public.club_marathon(true);
  v_me    record;
  v_mate  citext;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if not public.club_access() then
    raise exception 'no_club_access' using errcode = 'P0001';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;

  select m.id, m.team_id,
         left(coalesce(nullif(trim(m.display_name), ''), nullif(trim(p.display_name), ''), 'Участник'), 60)
           as name
    into v_me
  from public.marathon_members m
  left join public.profiles p on p.email = m.email
  where m.marathon_id = v_club and m.email = v_email and m.status = 'active';

  if v_me.id is null or v_me.team_id is null then
    raise exception 'no_pair' using errcode = 'P0001';
  end if;

  select mate.email into v_mate
  from public.marathon_members mate
  where mate.team_id = v_me.team_id and mate.id <> v_me.id and mate.status = 'active'
  limit 1;

  if v_mate is null then
    raise exception 'no_pair' using errcode = 'P0001';
  end if;

  -- 0062: a partner outside the paid club gets no club message. The call still succeeds: the
  -- caller did nothing wrong, and an error here would only confuse the button.
  if not public.club_paid_reachable(v_mate::text) then
    return;
  end if;

  perform public.enqueue_telegram(
    v_mate::text,
    'duo_nudge',
    'duo_nudge:' || v_me.team_id::text || ':' || v_me.id::text || ':' || current_date::text,
    jsonb_build_object('name', v_me.name),
    now(),
    interval '1 day'
  );
end;
$$;

revoke execute on function public.club_duo_nudge() from public, anon;
grant execute on function public.club_duo_nudge() to authenticated;

comment on function public.club_duo_nudge() is
  'Queue «{name} уже сделал(а) задание — твоя очередь» to the caller''s duo partner, once a day per direction (0051), only when the partner pays or is an admin (0062). no_pair when unpaired.';

-- -----------------------------------------------------------------------------
-- 5. Weekly winner (0029, body from 0035): only to a paying winner.
--
-- Only the body changes; the trigger (`after insert or update of member_id`, 0029) keeps pointing
-- here and is deliberately not recreated (see the note at the end of 0035).
-- -----------------------------------------------------------------------------
create or replace function public.marathon_winners_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email    citext;
  v_prize    text;
  v_prize_en text;
begin
  -- The member's address is the only link between the winner and the queue: the queue lives on
  -- addresses because the sender resolves the recipient (0027).
  select mem.email into v_email
  from public.marathon_members mem
  where mem.id = new.member_id;

  if v_email is null then
    return new;
  end if;

  -- 0062: a winner outside the paid club gets no bot message; the announcement stands.
  if not public.club_paid_reachable(v_email::text) then
    return new;
  end if;

  select m.prize, m.prize_en into v_prize, v_prize_en
  from public.marathons m where m.id = new.marathon_id;

  perform public.enqueue_telegram(
    v_email::text,
    'weekly_winner',
    'weekly_winner:' || new.marathon_id::text || ':' || new.week::text
      || ':' || new.member_id::text,
    jsonb_build_object(
      'prize', coalesce(v_prize, ''),
      'prize_en', coalesce(v_prize_en, ''),
      'note', coalesce(new.note, '')
    ),
    now(),
    interval '1 day'
  );
  return new;
end;
$$;

comment on function public.marathon_winners_notify() is
  'Turns an announcement (0028) into a queued bot message (0027). Keyed on the member, so changing the winner writes to the new one and never un-sends to the old (0029). Since 0062 only a paying winner (or an admin) is written to.';

-- -----------------------------------------------------------------------------
-- 6. Referral reward (0051, body from 0053): the inviter's message only when the inviter pays.
--
-- Everything else is 0053 word for word. An inviter who earned days has a live subscription by
-- the time the message is queued, so the gate in practice drops only the no-days "thank you"
-- (`referralOwnerNoDays` in `telegram-notify/copy.ts`) to an inviter outside the club.
-- -----------------------------------------------------------------------------
create or replace function public.referral_reward(p_email citext)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ref        record;
  v_owner      citext;
  v_days       int;
  v_year       int;
  v_owner_days int;
  v_os         public.subscriptions%rowtype;
  v_oid        uuid;
  v_oexp       timestamptz;
  v_key        text;
  v_club       uuid;
  v_id         uuid;
  v_om         record;
  v_fm         record;
  v_owner_live boolean := false;
begin
  select r.referred_email, r.reward_days, c.owner_email
    into v_ref
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where r.referred_email = p_email and r.rewarded_at is null
  for update of r;

  if v_ref.referred_email is null then
    return 0;
  end if;
  v_owner := v_ref.owner_email;
  v_days  := v_ref.reward_days;

  -- The inviter's limit: twelve rewards in a rolling year.
  select count(*) into v_year
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where c.owner_email = v_owner
    and r.owner_days > 0
    and r.rewarded_at > now() - interval '1 year';
  v_owner_days := case when v_year < 12 then v_days else 0 end;

  update public.referrals
     set rewarded_at = now(), owner_days = v_owner_days
   where referred_email = p_email;

  -- The inviter's days: extend a live subscription, otherwise create (or revive) a month's row.
  if v_owner_days > 0 then
    select * into v_os from public.subscriptions s where s.email = v_owner;
    if found and public.subscription_live(v_os.status, v_os.expires_at) then
      update public.subscriptions
         set expires_at = expires_at + make_interval(days => v_owner_days),
             updated_at = now()
       where email = v_owner
      returning id, expires_at into v_oid, v_oexp;
    else
      insert into public.subscriptions (email, plan, status, started_at, expires_at, source, note)
      values (v_owner, 'annual', 'active', now(), now() + make_interval(days => v_owner_days),
              'referral', 'referral')
      on conflict (email) do update
        set plan       = 'annual',
            status     = 'active',
            started_at = coalesce(public.subscriptions.started_at, excluded.started_at),
            expires_at = excluded.expires_at,
            source     = 'referral',
            note       = 'referral',
            updated_at = now()
      returning id, expires_at into v_oid, v_oexp;
    end if;

    -- That write has just told the inviter «payment received» (0027) and the owner «club paid /
    -- renewed» (0040). The inviter did not pay — both rows are withdrawn; her own message follows.
    begin
      v_key := v_oid::text || ':' || coalesce(v_oexp::text, 'none');
      delete from public.telegram_outbox
       where dedupe_key = 'subscription_paid:' || v_key and status = 'pending';
      delete from public.admin_outbox
       where dedupe_key in ('club_paid:' || v_key, 'club_renewed:' || v_key) and status = 'pending';
    exception when others then
      null;
    end;
  end if;

  -- Messages to both and to the channel. The key uses a hash of the address: up to 254 characters
  -- do not fit in 200.
  begin
    perform public.enqueue_telegram(
      p_email::text,
      'referral_reward',
      'referral_reward:' || md5(lower(p_email::text)) || ':friend',
      jsonb_build_object('role', 'friend', 'days', v_days),
      now(),
      interval '7 days'
    );
    -- 0062: the inviter hears about it only from inside the paid club.
    if public.club_paid_reachable(v_owner::text) then
      perform public.enqueue_telegram(
        v_owner::text,
        'referral_reward',
        'referral_reward:' || md5(lower(p_email::text)) || ':owner',
        jsonb_build_object('role', 'owner', 'days', v_owner_days),
        now(),
        interval '7 days'
      );
    end if;
    perform public.enqueue_admin(
      'club',
      'referral_paid',
      'referral_paid:' || md5(lower(p_email::text)),
      jsonb_build_object(
        'inviter', v_owner::text,
        'friend', p_email::text,
        'days', v_days,
        'inviterDays', v_owner_days
      )
    );
  exception when others then
    null;
  end;

  -- The pair: both in the duo club means together. The friend is enrolled in both rounds, as in
  -- `join_club`. Since 0053 the inviter too, if she was rewarded and her club is live (see 0053).
  begin
    v_club := public.club_marathon(true);
    if v_club is not null then
      select * into v_os from public.subscriptions s where s.email = v_owner;
      v_owner_live := coalesce(
        v_owner_days > 0 and found and public.subscription_live(v_os.status, v_os.expires_at),
        false
      );

      foreach v_id in array array[public.club_marathon(false), v_club] loop
        continue when v_id is null;
        insert into public.marathon_members (marathon_id, email, status)
        values (v_id, p_email, 'active')
        on conflict (marathon_id, email) do nothing;
        -- One who left (a `removed` row) does not come back: `do nothing`, not `do update`.
        if v_owner_live then
          insert into public.marathon_members (marathon_id, email, status)
          values (v_id, v_owner, 'active')
          on conflict (marathon_id, email) do nothing;
        end if;
      end loop;

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_om
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = v_owner and m.status = 'active';

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_fm
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = p_email and m.status = 'active';

      -- An automatic pair is not a choice and gives way to a chosen one (0034). A chosen one stays.
      if v_om.id is not null and v_fm.id is not null
         and (v_om.team_id is null or v_om.is_auto)
         and (v_fm.team_id is null or v_fm.is_auto) then
        perform public.club_duo_pair(v_club, v_om.id, v_fm.id, false);
      end if;
    end if;
  exception when others then
    null;
  end;

  return v_days;
end;
$$;

revoke execute on function public.referral_reward(citext) from public, anon, authenticated;

comment on function public.referral_reward(citext) is
  'Pay the referral reward for this newcomer''s first club payment (0051). Trigger-only; returns the days to add to the newcomer''s row. Since 0053 it also enrols a rewarded inviter with live access in both club circles (never one who left), so the pair can form. Since 0062 the inviter''s bot message is queued only when the inviter pays or is an admin.';

-- -----------------------------------------------------------------------------
-- 7. One-off purge: club messages already waiting for someone who does not pay.
--
-- Only unsent rows (`pending`); sent, skipped and failed rows are history and stay. A row a sender
-- run has claimed (`claimed_until`, 0059) is pending too and is removed the same way: the sender's
-- final update then matches nothing. `club_trial_tomorrow` is removed for everyone: the kind is
-- never queued again, and for a subscriber the sender would drop it anyway (0054). For
-- `referral_reward`, only the inviter's row (`role = 'owner'`): the friend has just paid.
-- Running this again finds nothing new to remove.
-- -----------------------------------------------------------------------------
delete from public.telegram_outbox o
where o.status = 'pending'
  and (
    o.kind = 'club_trial_tomorrow'
    or (
      (
        o.kind in ('club_task', 'club_reminder', 'club_recap', 'duo_nudge', 'weekly_winner')
        or (o.kind = 'referral_reward' and o.params ->> 'role' = 'owner')
      )
      and not public.club_paid_reachable(o.email::text)
    )
  );

notify pgrst, 'reload schema';
