-- =============================================================================
-- 0046 — the person page: everything the admin knows about one address, in one call.
--
-- The owner answers «что у этого человека?» several times a day — somebody wrote in support,
-- somebody paid and says nothing opened, somebody asks why they are not on the board. Until now
-- that answer lived in five screens (purchases, subscriptions, the club's people, analytics,
-- the payment log that only the SQL editor could read), each searched by typing the address again.
--
-- `admin_person(p_email)` returns the whole picture as one JSON object, so the page is one round
-- trip and one loading state rather than eight, and the shape can grow without a signature change:
--
--   email            the address asked about, normalised
--   profile          null when nobody has signed in with it (a pre-sale grant is a real case)
--   purchases        every course row, any status
--   subscription     the one row per email, with `live` computed by subscription_live()
--   club_access      the same rule as club_access(), for this address rather than the caller
--   memberships      every marathon row, the club's two circles first, with the partner(s)
--   proofs           the last 10 submissions with their review state
--   assigned         custom workouts given by hand, with whether they were done
--   activity         totals over completed sessions
--   sessions         the last 10 sessions, custom ones with their title
--   support          the last 20 support_requests rows (the rate-limit log: who and when, never
--                    the text) — as whole rows, so columns a later migration adds arrive too
--   payment_emails   addresses linked to the account through claim_payment()
--   payments         payments under the address, under a linked address, or claimed by the account
--   can_end_subscription  whether admin_end_subscription(p_email) exists on this database, so the
--                    page can offer «Закрыть доступ» only where the server can do it
--
-- Read-only. SECURITY DEFINER and guarded by is_admin(), like every admin_* reader: `payments` and
-- `support_requests` have no policies at all, and that stays so.
--
-- Requires 0001, 0005, 0006, 0011, 0016, 0020, 0024, 0026, 0027, 0033, 0034, 0038, 0042, 0043.
-- Not destructive: one new function. Idempotent.
-- =============================================================================

create or replace function public.admin_person(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email   citext := lower(btrim(coalesce(p_email, '')));
  v_profile public.profiles%rowtype;
  v_uid     uuid;
  v_linked  citext[];
  v_result  jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_email = '' or length(v_email::text) > 254 or position('@' in v_email::text) = 0 then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles p where p.email = v_email limit 1;
  v_uid := v_profile.id;

  select coalesce(array_agg(pe.email order by pe.linked_at), array[]::citext[])
    into v_linked
  from public.payment_emails pe
  where v_uid is not null and pe.user_id = v_uid;

  v_result := jsonb_build_object(
    'email', v_email,

    'profile', case when v_uid is null then null else jsonb_build_object(
      'display_name',    v_profile.display_name,
      'locale',          v_profile.locale,
      'created_at',      v_profile.created_at,
      'onboarded_at',    v_profile.onboarded_at,
      'fitness_level',   v_profile.fitness_level,
      'fitness_index',   v_profile.fitness_index,
      -- Whether, not which: the id is of no use on this page and is somebody's Telegram account.
      'telegram_linked', v_profile.telegram_id is not null
    ) end,

    'purchases', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',           pu.id,
        'course_id',    pu.course_id,
        'status',       pu.status,
        'source',       pu.source,
        'note',         pu.note,
        'created_at',   pu.created_at,
        'activated_at', pu.activated_at
      ) order by pu.created_at desc)
      from public.purchases pu
      where pu.email = v_email
    ), '[]'::jsonb),

    'subscription', (
      select jsonb_build_object(
        'id',         s.id,
        'plan',       s.plan,
        'status',     s.status,
        'started_at', s.started_at,
        'expires_at', s.expires_at,
        'source',     s.source,
        'note',       s.note,
        'live',       public.subscription_live(s.status, s.expires_at)
      )
      from public.subscriptions s
      where s.email = v_email
    ),

    -- club_access() reads the caller; this is the same two facts for the address asked about.
    -- Keep the two in step (and with GAME_TRIAL_DAYS in gameAccess.ts).
    'club_access', (
      exists (
        select 1 from public.subscriptions s
        where s.email = v_email and public.subscription_live(s.status, s.expires_at)
      )
      or exists (
        select 1 from public.purchases pu
        where pu.email = v_email
          and pu.status = 'active'
          and pu.activated_at is not null
          and pu.activated_at > now() - interval '7 days'
      )
    ),

    'memberships', coalesce((
      select jsonb_agg(jsonb_build_object(
        'member_id',      m.id,
        'marathon_id',    mk.id,
        'marathon_title', mk.title,
        'is_club',        mk.is_club,
        'solo',           mk.team_size <= 1,
        'status',         m.status,
        'joined_at',      m.created_at,
        'team_name',      t.name,
        'partners', coalesce((
          select jsonb_agg(jsonb_build_object(
            'email',        o.email,
            'display_name', coalesce(nullif(btrim(o.display_name), ''), op.display_name)
          ) order by o.created_at)
          from public.marathon_members o
          left join public.profiles op on op.email = o.email
          where m.team_id is not null
            and o.team_id = m.team_id
            and o.id <> m.id
            and o.status = 'active'
        ), '[]'::jsonb)
      ) order by mk.is_club desc, mk.team_size, m.created_at desc)
      from public.marathon_members m
      join public.marathons mk on mk.id = m.marathon_id
      left join public.marathon_teams t on t.id = m.team_id
      where m.email = v_email
    ), '[]'::jsonb),

    'proofs', coalesce((
      select jsonb_agg(x.j order by x.submitted_at desc)
      from (
        select
          su.submitted_at,
          jsonb_build_object(
            'id',             su.id,
            'marathon_title', mk.title,
            'is_club',        mk.is_club,
            'day_index',      su.day_index,
            'task_title',     tk.title,
            'submitted_at',   su.submitted_at,
            'voided_at',      su.voided_at,
            'void_reason',    su.void_reason,
            'attempt',        su.attempt,
            'reviewed_at',    su.reviewed_at
          ) as j
        from public.marathon_submissions su
        join public.marathon_members m on m.id = su.member_id
        join public.marathons mk on mk.id = su.marathon_id
        join public.marathon_tasks tk on tk.id = su.task_id
        where m.email = v_email
        order by su.submitted_at desc
        limit 10
      ) x
    ), '[]'::jsonb),

    'assigned', coalesce((
      select jsonb_agg(jsonb_build_object(
        'workout_id',  cw.id,
        'short_id',    cw.short_id,
        'title',       cw.title,
        'title_en',    cw.title_en,
        'note',        a.note,
        'assigned_at', a.created_at,
        'done', v_uid is not null and exists (
          select 1 from public.workout_sessions ws
          where ws.user_id = v_uid
            and ws.course_id = 'custom'
            and ws.node_id = cw.short_id
            and ws.completed_at is not null
        )
      ) order by a.created_at desc)
      from public.assigned_workouts a
      join public.custom_workouts cw on cw.id = a.custom_workout_id
      where a.email = v_email
    ), '[]'::jsonb),

    'activity', (
      select jsonb_build_object(
        'sessions',          count(*) filter (where ws.completed_at is not null),
        'started',           count(*),
        'days',              count(distinct ws.local_date) filter (where ws.completed_at is not null),
        'points',            coalesce(sum(ws.points) filter (where ws.completed_at is not null), 0),
        'last_completed_at', max(ws.completed_at)
      )
      from public.workout_sessions ws
      where v_uid is not null and ws.user_id = v_uid
    ),

    'sessions', coalesce((
      select jsonb_agg(x.j order by x.started_at desc)
      from (
        select
          ws.started_at,
          jsonb_build_object(
            'id',           ws.id,
            'course_id',    ws.course_id,
            'node_id',      ws.node_id,
            'workout_id',   ws.workout_id,
            'custom_title', cw.title,
            'points',       ws.points,
            'feeling',      ws.feeling,
            'started_at',   ws.started_at,
            'completed_at', ws.completed_at
          ) as j
        from public.workout_sessions ws
        left join public.custom_workouts cw
          on ws.course_id = 'custom' and cw.short_id = ws.node_id
        where v_uid is not null and ws.user_id = v_uid
        order by ws.started_at desc
        limit 10
      ) x
    ), '[]'::jsonb),

    -- Whole rows minus who: a later migration may add columns here (a status, a reply), and the
    -- page reads whichever it knows. The ids are dropped — the person is the page itself.
    'support', coalesce((
      select jsonb_agg(x.j order by x.created_at desc)
      from (
        select sr.created_at, to_jsonb(sr) - 'user_id' - 'telegram_id' as j
        from public.support_requests sr
        where (v_uid is not null and sr.user_id = v_uid)
           or (v_profile.telegram_id is not null and sr.telegram_id = v_profile.telegram_id)
        order by sr.created_at desc
        limit 20
      ) x
    ), '[]'::jsonb),

    'payment_emails', to_jsonb(v_linked),

    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',           py.id,
        -- The address typed at checkout — often not the account's, which is the whole reason
        -- this list exists.
        'email',        py.email,
        'amount',       py.amount,
        'currency',     py.currency,
        'intent',       py.intent,
        'provider',     py.provider,
        'provider_ref', py.provider_ref,
        'paid_at',      py.paid_at,
        'applied',      py.applied,
        'claimed_at',   py.claimed_at
      ) order by py.paid_at desc)
      from public.payments py
      where py.email = v_email
         or py.email = any (v_linked)
         or (v_uid is not null and py.claimed_by = v_uid)
    ), '[]'::jsonb),

    -- «Закрыть доступ» is a separate migration's RPC. Ask the catalogue rather than assume: a page
    -- shipped before that migration is applied then simply does not offer the button.
    'can_end_subscription', exists (
      select 1
      from pg_proc pr
      where pr.pronamespace = 'public'::regnamespace
        and pr.proname = 'admin_end_subscription'
        and pr.proargnames is not null
        and pr.proargnames[1] = 'p_email'
        and pr.pronargs - pr.pronargdefaults = 1
    )
  );

  return v_result;
end;
$$;

comment on function public.admin_person(text) is
  'Admin-only: one person by email — profile, grants, club, proofs, workouts, activity, support, payments (0046).';

revoke execute on function public.admin_person(text) from public, anon;
grant execute on function public.admin_person(text) to authenticated;

notify pgrst, 'reload schema';
