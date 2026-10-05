-- =============================================================================
-- Ежедневные касания клуба (0052): утро, вечер, воскресенье.
-- Запускать после 10_smoke.sql и 86_club_duo.sql на той же базе.
--
-- Проверяется то, на чём эта машинка может соврать:
--   * `club_task` ложится только в свой час, один раз в день, и только тем, кому можно писать:
--     без подписки — нет, с `club_quiet` — нет; в сообщении — задание, которое приносит баллы,
--     а не «Доброе утро»;
--   * `club_reminder` — только тем, у кого серия есть и сегодня не отмечено; кто отметил — молчим,
--     у кого серии нет — тоже;
--   * `club_recap` — по воскресеньям, с местом и баллами той же доски;
--   * вошедший человек функцию вызвать не может; свой флаг он ставит только `club_quiet`.
--
-- Since 0062 (the last section, in English): club messages go to paying members and admins only —
-- a course buyer in the free club week gets none of them, nor the duo nudge, the winner message or
-- the free-week warning; the one-off purge of 0062 removes what was already queued for them.
--
-- Текста сообщений здесь нет — он в `telegram-notify/copy.ts` и покрыт своими тестами.
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

-- Четверо в клубе: у троих подписка, у одной нет. Один из троих замолчал сам.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000052a1', 'daily-alice@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000052a2', 'daily-bob@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000052a3', 'daily-carol@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000052a4', 'daily-dan@example.com',   '{}')
on conflict (id) do nothing;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['daily-alice@example.com', 'daily-bob@example.com', 'daily-dan@example.com']) as e
on conflict (email) do update
  set status = 'active', expires_at = now() + interval '30 days';

-- --- свой флаг: только club_quiet, и только вошедшему ------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000052a2', 'daily-bob@example.com');
do $$
declare v_blocked boolean := false;
begin
  assert public.set_my_feature_flag('club_quiet', true), 'set_my_feature_flag должен ответить true';
  assert 'club_quiet' = any (public.my_feature_flags()), 'флаг должен появиться в my_feature_flags';
  begin
    perform public.set_my_feature_flag('coach_nastia', true);
  exception when others then
    v_blocked := sqlstate = '22023';
  end;
  assert v_blocked, 'чужой флаг человек включить себе не может';
end $$;

select pg_temp.as_super();
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.set_my_feature_flag('club_quiet', true);
  exception when others then
    v_blocked := true;
  end;
  assert v_blocked, 'без входа флаг не ставится';
end $$;

-- --- вошедший функцию рассылки не вызовет ---------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000052a1', 'daily-alice@example.com');
do $$
declare v_blocked boolean := false;
begin
  begin
    perform public.club_enqueue_daily('club_task');
  exception when others then
    v_blocked := sqlstate = '42501';
  end;
  assert v_blocked, 'club_enqueue_daily открыта вошедшему';
end $$;
select pg_temp.as_super();

-- --- круг, задания, пруфы ------------------------------------------------------
-- Соло-клуб уже есть (0016). Его старт сдвигается на две недели назад, чтобы «вчера» и
-- «позавчера» были днями круга, даже когда тест идёт в понедельник.
do $$
declare
  v_club  uuid := public.club_marathon(false);
  v_tz    text;
  v_today date;
  v_day   int;
  v_ma    uuid;
  v_mb    uuid;
  v_mc    uuid;
  v_md    uuid;
  v_t     uuid;
  v_y1    uuid;
  v_y2    uuid;
  v_hello uuid;
  v_n     int;
  v_row   record;
  v_at    timestamptz;
  v_sunday date;
begin
  assert v_club is not null, 'соло-клуба нет';
  update public.marathons set starts_on = starts_on - 14 where id = v_club;
  select m.timezone into v_tz from public.marathons m where m.id = v_club;
  v_today := (now() at time zone v_tz)::date;
  select (v_today - m.starts_on) + 1 into v_day from public.marathons m where m.id = v_club;
  assert v_day >= 3, 'день круга должен быть не меньше третьего, получили ' || v_day::text;

  insert into public.marathon_members (marathon_id, email) values (v_club, 'daily-alice@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_ma;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'daily-bob@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_mb;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'daily-carol@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_mc;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'daily-dan@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_md;

  -- Сегодня: «Доброе утро» без баллов первым по порядку и задание за 12 баллов вторым. Порядок
  -- отрицательный: другие наборы могли оставить в этом же клубе свои задания на этот день.
  insert into public.marathon_tasks (marathon_id, day_index, sort_order, title, rule, points)
  values (v_club, v_day, -20, 'Доброе утро', 'none', 0) returning id into v_hello;
  insert into public.marathon_tasks (marathon_id, day_index, sort_order, title, title_en, rule, points, late_counts)
  values (v_club, v_day, -10, '20 приседаний <и> вода', '20 squats & water', 'per_member', 12, true)
  returning id into v_t;
  -- Вчера и позавчера — по заданию, чтобы было чему стать серией.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, late_counts)
  values (v_club, v_day - 1, 'Вчера', 'per_member', 10, true) returning id into v_y1;
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, late_counts)
  values (v_club, v_day - 2, 'Позавчера', 'per_member', 10, true) returning id into v_y2;

  -- Алиса: позавчера и вчера, сегодня нет. Дэн: только сегодня. Боб и Кэрол — ничего.
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_y1, v_ma, v_club, v_day - 1), (v_y2, v_ma, v_club, v_day - 2);
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_t, v_md, v_club, v_day);

  assert public.club_streak_of('daily-alice@example.com', v_today) = 2,
    'серия Алисы — два дня, получили ' || public.club_streak_of('daily-alice@example.com', v_today)::text;
  assert public.club_streak_of('daily-dan@example.com', v_today) = 1, 'серия Дэна — сегодняшний день';
  assert public.club_streak_of('daily-bob@example.com', v_today) = 0, 'у Боба серии нет';
  assert public.club_member_reachable('daily-alice@example.com'), 'Алисе можно писать';
  assert not public.club_member_reachable('daily-carol@example.com'), 'Кэрол без подписки';

  -- --- утро ------------------------------------------------------------------
  v_at := (v_today::timestamp + time '12:30') at time zone v_tz;
  assert public.club_enqueue_daily('club_task', v_at) = 0, 'в полдень задание не рассылается';

  -- Счётчик — по своим четверым: другие наборы оставили в этом же клубе своих людей с подпиской,
  -- и им утреннее тоже положено.
  v_at := (v_today::timestamp + time '08:30') at time zone v_tz;
  v_n := public.club_enqueue_daily('club_task', v_at);
  assert v_n >= 2, 'утром должно лечь хотя бы два сообщения, получили ' || v_n::text;
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_task' and o.email in ('daily-alice@example.com', 'daily-dan@example.com');
  assert v_n = 2, 'утром должны получить Алиса и Дэн, получили ' || v_n::text;

  select o.params, o.expires_at into v_row from public.telegram_outbox o
  where o.email = 'daily-alice@example.com' and o.kind = 'club_task';
  assert v_row.params ->> 'title' = '20 приседаний <и> вода', 'в сообщении — задание с баллами, а не «Доброе утро»';
  assert v_row.params ->> 'title_en' = '20 squats & water', 'английская половина едет рядом';
  assert (v_row.params ->> 'points')::int = 12, 'баллы задания';
  assert (v_row.params ->> 'day')::int = v_day, 'номер дня';
  assert v_row.expires_at <= now() + interval '12 hours 1 minute', 'утреннее живёт полдня';

  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_task' and o.email in ('daily-bob@example.com', 'daily-carol@example.com');
  assert v_n = 0, 'замолчавший и человек без подписки утреннего не получают';

  -- Второй запуск в том же окне и час спустя — ничего нового.
  assert public.club_enqueue_daily('club_task', v_at) = 0, 'повтор в окне даёт ноль';
  v_at := (v_today::timestamp + time '09:15') at time zone v_tz;
  assert public.club_enqueue_daily('club_task', v_at) = 0, 'опоздавший запуск после первого даёт ноль';

  -- --- вечер -----------------------------------------------------------------
  v_at := (v_today::timestamp + time '20:30') at time zone v_tz;
  v_n := public.club_enqueue_daily('club_reminder', v_at);
  assert v_n >= 1, 'вечером напоминание должно лечь, получили ' || v_n::text;
  select o.params into v_row from public.telegram_outbox o
  where o.email = 'daily-alice@example.com' and o.kind = 'club_reminder';
  assert (v_row.params ->> 'streak')::int = 2, 'серия в напоминании — два дня';
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_reminder' and o.email like 'daily-%' and o.email <> 'daily-alice@example.com';
  assert v_n = 0, 'кто отметил сегодня или без серии — без напоминания';
  assert public.club_enqueue_daily('club_reminder', v_at) = 0, 'повтор напоминания даёт ноль';

  -- --- воскресенье -------------------------------------------------------------
  -- Воскресенье этой недели круга по местному календарю; итоги считаются за текущую неделю.
  v_sunday := v_today + (7 - extract(isodow from v_today)::int);
  v_at := (v_sunday::timestamp + time '21:30') at time zone v_tz;
  v_n := public.club_enqueue_daily('club_recap', v_at);
  assert v_n >= 2, 'итоги должны лечь, получили ' || v_n::text;
  -- Алисе и Дэну; Боб замолчал, Кэрол без подписки.
  select count(*) into v_n from public.telegram_outbox o
  where o.kind = 'club_recap' and o.email like 'daily-%';
  assert v_n = 2, 'итоги — Алисе и Дэну, получили ' || v_n::text;
  select o.params into v_row from public.telegram_outbox o
  where o.email = 'daily-alice@example.com' and o.kind = 'club_recap';
  -- Сколько пруфов Алисы легло в текущую неделю круга: в понедельник вчера — ещё прошлая неделя.
  select count(*) into v_n from public.marathon_submissions s
  where s.member_id = v_ma and public.marathon_week_of(s.day_index) = public.marathon_week_of(v_day);
  assert (v_row.params ->> 'points')::int = v_n * 10,
    'баллы Алисы — те же, что на доске: ' || (v_n * 10)::text || ', получили ' || (v_row.params ->> 'points');
  assert (v_row.params ->> 'done')::int = v_n, 'сделано — столько же пруфов';
  assert (v_row.params ->> 'place')::int >= 1, 'место на доске';
  assert (v_row.params ->> 'total')::int >= (v_row.params ->> 'done')::int, 'всего — не меньше сделанного';
  assert (v_row.params ->> 'week')::int = public.marathon_week_of(v_day), 'неделя круга';
  -- Серия в итогах — на воскресенье, а не на сегодня. У Алисы позавчера и вчера, сегодня нет:
  -- если сегодня и есть воскресенье, серия — два дня; воскресенье позже — вчера для него не
  -- отмечено, и серии нет. Жёсткое «2» падало всю неделю, кроме воскресенья.
  assert (v_row.params ->> 'streak')::int = case when v_sunday = v_today then 2 else 0 end,
    'серия в итогах на воскресенье ' || v_sunday::text || ', получили ' || (v_row.params ->> 'streak');
  assert (v_row.params ->> 'streak')::int = public.club_streak_of('daily-alice@example.com', v_sunday),
    'серия в итогах — та же, что club_streak_of на воскресенье';

  -- Не воскресенье — молчим.
  v_at := ((v_sunday - 1)::timestamp + time '21:30') at time zone v_tz;
  delete from public.telegram_outbox where kind = 'club_recap';
  assert public.club_enqueue_daily('club_recap', v_at) = 0, 'в субботу итогов нет';

  -- Неизвестный вид — ошибка, не тихий ноль.
  begin
    perform public.club_enqueue_daily('club_breakfast');
    assert false, 'неизвестный вид должен быть отвергнут';
  exception when others then
    assert sqlstate = 'P0001', 'неизвестный вид: P0001, получили ' || sqlstate;
  end;

  -- Никаких сырых адресов в params: очередь хранит адрес в своей колонке, а не в тексте.
  select count(*) into v_n from public.telegram_outbox o
  where o.email like 'daily-%' and o.params::text ilike '%@example.com%';
  assert v_n = 0, 'в params не должно быть адресов';
end $$;


-- =============================================================================
-- 0062: club messages go only to paying members (and admins).
--
--   paid-sub    a live subscription                       → gets the club messages
--   paid-admin  an admin, no subscription                 → gets them
--   paid-trial  a course 6.5 days ago (free club week),   → gets none of them, although the app
--               an active member of both club rounds         still lets them into the club
--   paid-mate   a live subscription, the positive control for the duo nudge
-- =============================================================================
select pg_temp.as_super();

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000062a1', 'paid-sub@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000062a2', 'paid-trial@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000062a3', 'paid-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000062a4', 'paid-mate@example.com',  '{}')
on conflict (id) do nothing;

insert into public.admins (email) values ('paid-admin@example.com') on conflict (email) do nothing;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['paid-sub@example.com', 'paid-mate@example.com']) as e
on conflict (email) do update set status = 'active', expires_at = excluded.expires_at;

insert into public.purchases (email, course_id, status, activated_at)
values ('paid-trial@example.com', 'start', 'active', now() - interval '6 days 12 hours')
on conflict (email, course_id) do update
  set status = 'active', activated_at = excluded.activated_at;

create temporary table paid_ids (club uuid, duo uuid, sub uuid, trial uuid, admin uuid,
                                 sunday_task uuid) on commit preserve rows;

-- --- the daily touches and the free-week warning ---------------------------------
do $$
declare
  v_club   uuid := public.club_marathon(false);
  v_duo    uuid := public.club_marathon(true);
  v_tz     text;
  v_today  date;
  v_sunday date;
  v_day    int;
  v_y1     uuid;
  v_sun    uuid;
  v_sub    uuid;
  v_trial  uuid;
  v_admin  uuid;
  v_at     timestamptz;
  v_n      int;
begin
  select m.timezone into v_tz from public.marathons m where m.id = v_club;
  v_today  := (now() at time zone v_tz)::date;
  v_sunday := v_today + (7 - extract(isodow from v_today)::int);
  select (v_today - m.starts_on) + 1 into v_day from public.marathons m where m.id = v_club;

  -- The rule itself: the app still lets the course buyer in, the bot does not write to them.
  assert public.club_member_reachable('paid-trial@example.com'), 'the free week still opens the club in the app';
  assert not public.club_paid_reachable('paid-trial@example.com'), 'the free week is not paid membership';
  assert public.club_paid_reachable('paid-sub@example.com'), 'a subscriber is a paying member';
  assert public.club_paid_reachable('PAID-SUB@example.com'), 'addresses compare case-insensitively';
  assert public.club_paid_reachable('paid-admin@example.com'), 'an admin is written to';
  assert not public.club_paid_reachable(null), 'no address — no';
  assert not public.club_paid_reachable(''), 'an empty address — no';
  assert not has_function_privilege('authenticated', 'public.club_paid_reachable(text)', 'execute'),
    'club_paid_reachable is service-side only';

  insert into public.marathon_members (marathon_id, email) values (v_club, 'paid-sub@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_sub;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'paid-trial@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_trial;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'paid-admin@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_admin;
  -- The course buyer is in the duo round too, as `join_club()` would put them.
  insert into public.marathon_members (marathon_id, email) values (v_duo, 'paid-trial@example.com')
  on conflict (marathon_id, email) do update set status = 'active';

  -- Yesterday done (a streak to save in the evening), today not yet. Plus a task on this week's
  -- Sunday, so the recap has something to count whatever weekday the suite runs on.
  select t.id into v_y1 from public.marathon_tasks t
  where t.marathon_id = v_club and t.day_index = v_day - 1 and t.title = 'Вчера' limit 1;
  assert v_y1 is not null, 'yesterday''s task from the block above is expected';
  insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index)
  values (v_y1, v_sub, v_club, v_day - 1), (v_y1, v_trial, v_club, v_day - 1),
         (v_y1, v_admin, v_club, v_day - 1);
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, late_counts)
  values (v_club, v_day + (v_sunday - v_today), 'paid-sunday', 'per_member', 10, true)
  returning id into v_sun;

  insert into paid_ids values (v_club, v_duo, v_sub, v_trial, v_admin, v_sun);

  -- Morning, evening, Sunday night: each run queues for the payer and the admin, not the buyer.
  v_at := (v_today::timestamp + time '08:30') at time zone v_tz;
  perform public.club_enqueue_daily('club_task', v_at);
  v_at := (v_today::timestamp + time '20:30') at time zone v_tz;
  perform public.club_enqueue_daily('club_reminder', v_at);
  v_at := (v_sunday::timestamp + time '21:30') at time zone v_tz;
  perform public.club_enqueue_daily('club_recap', v_at);

  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-trial@example.com'
    and o.kind in ('club_task', 'club_reminder', 'club_recap');
  assert v_n = 0, 'a course buyer in the free week gets no daily club message, got ' || v_n::text;

  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-sub@example.com' and o.kind in ('club_task', 'club_reminder', 'club_recap');
  assert v_n = 3, 'a subscriber still gets the task, the reminder and the recap, got ' || v_n::text;

  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-admin@example.com' and o.kind in ('club_task', 'club_reminder', 'club_recap');
  assert v_n = 3, 'an admin still gets the task, the reminder and the recap, got ' || v_n::text;

  -- The free week ends within a day, and the buyer is in the club: still no warning.
  perform public.club_enqueue_access_ending();
  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-trial@example.com' and o.kind = 'club_trial_tomorrow';
  assert v_n = 0, 'no free-week warning since 0062, got ' || v_n::text;
end $$;

-- --- the duo nudge: nothing to a partner who does not pay --------------------------
do $$
declare
  i   record;
  v_a uuid;
  v_b uuid;
  v_c uuid;
begin
  select * into i from paid_ids;
  insert into public.marathon_members (marathon_id, email) values (i.duo, 'paid-sub@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_a;
  select id into v_b from public.marathon_members where marathon_id = i.duo and email = 'paid-trial@example.com';
  insert into public.marathon_members (marathon_id, email) values (i.duo, 'paid-mate@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_c;
  perform public.club_duo_pair(i.duo, v_a, v_b, false);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000062a1', 'paid-sub@example.com');
do $$ begin perform public.club_duo_nudge(); end $$;
select pg_temp.as_super();

do $$
declare v_n int;
begin
  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-trial@example.com' and o.kind = 'duo_nudge';
  assert v_n = 0, 'a nudge to a partner without a subscription queues nothing, got ' || v_n::text;
end $$;

-- Positive control: re-paired with a subscriber, the same call queues one nudge.
do $$
declare i record; v_a uuid; v_c uuid;
begin
  select * into i from paid_ids;
  select id into v_a from public.marathon_members where marathon_id = i.duo and email = 'paid-sub@example.com';
  select id into v_c from public.marathon_members where marathon_id = i.duo and email = 'paid-mate@example.com';
  perform public.club_duo_pair(i.duo, v_a, v_c, false);
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000062a1', 'paid-sub@example.com');
do $$ begin perform public.club_duo_nudge(); end $$;
select pg_temp.as_super();

do $$
declare v_n int;
begin
  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-mate@example.com' and o.kind = 'duo_nudge';
  assert v_n = 1, 'a nudge to a paying partner is queued, got ' || v_n::text;
end $$;

-- --- the weekly winner: nothing to a winner who does not pay ------------------------
do $$
declare i record; v_n int;
begin
  select * into i from paid_ids;
  insert into public.marathon_winners (marathon_id, week, member_id, note)
  values (i.club, 900, i.trial, 'paid-only test');
  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-trial@example.com' and o.kind = 'weekly_winner';
  assert v_n = 0, 'a winner without a subscription gets no bot message, got ' || v_n::text;

  -- The coach changes their mind: the win moves to the subscriber, who is written to.
  update public.marathon_winners set member_id = i.sub where marathon_id = i.club and week = 900;
  select count(*) into v_n from public.telegram_outbox o
  where o.email = 'paid-sub@example.com' and o.kind = 'weekly_winner';
  assert v_n = 1, 'a paying winner gets the message, got ' || v_n::text;
end $$;

-- --- the one-off purge -------------------------------------------------------------
-- Rows as a database before 0062 could hold them: queued club messages for the buyer, plus rows
-- the purge must leave alone.
insert into public.telegram_outbox (email, kind, params, dedupe_key, status) values
  ('paid-trial@example.com', 'club_task',           '{}', 'paid-purge:trial:task',        'pending'),
  ('paid-trial@example.com', 'club_reminder',       '{}', 'paid-purge:trial:reminder',    'pending'),
  ('paid-trial@example.com', 'club_recap',          '{}', 'paid-purge:trial:recap',       'pending'),
  ('paid-trial@example.com', 'club_trial_tomorrow', '{}', 'paid-purge:trial:tomorrow',    'pending'),
  ('paid-trial@example.com', 'duo_nudge',           '{}', 'paid-purge:trial:nudge',       'pending'),
  ('paid-trial@example.com', 'weekly_winner',       '{}', 'paid-purge:trial:winner',      'pending'),
  ('paid-trial@example.com', 'referral_reward',     '{"role":"owner","days":0}',  'paid-purge:trial:owner',  'pending'),
  -- Kept: the friend's referral row, a transactional message, history.
  ('paid-trial@example.com', 'referral_reward',     '{"role":"friend","days":30}', 'paid-purge:trial:friend', 'pending'),
  ('paid-trial@example.com', 'course_paid',         '{}', 'paid-purge:trial:course',      'pending'),
  ('paid-trial@example.com', 'club_task',           '{}', 'paid-purge:trial:sent',        'sent'),
  -- Kept: the subscriber's and the admin's queued club messages.
  ('paid-sub@example.com',   'club_task',           '{}', 'paid-purge:sub:task',          'pending'),
  ('paid-sub@example.com',   'weekly_winner',       '{}', 'paid-purge:sub:winner',        'pending'),
  ('paid-admin@example.com', 'club_reminder',       '{}', 'paid-purge:admin:reminder',    'pending');

-- Applied twice: the migration is idempotent and the second pass finds nothing new.
\ir ../migrations/0062_club_messages_paid_only.sql
\ir ../migrations/0062_club_messages_paid_only.sql
select pg_temp.as_super();

do $$
declare v_left text;
begin
  select string_agg(o.dedupe_key, ',' order by o.dedupe_key) into v_left
  from public.telegram_outbox o where o.dedupe_key like 'paid-purge:%';
  assert v_left = 'paid-purge:admin:reminder,paid-purge:sub:task,paid-purge:sub:winner,'
                  'paid-purge:trial:course,paid-purge:trial:friend,paid-purge:trial:sent',
    'the purge removes the buyer''s queued club rows and nothing else, left: ' || coalesce(v_left, 'none');
end $$;

-- --- clean up: the suites after this one count club members and outbox rows -------
do $$
declare i record; v_team uuid;
begin
  select * into i from paid_ids;
  delete from public.marathon_winners where marathon_id = i.club and week = 900;
  for v_team in
    select distinct m.team_id from public.marathon_members m
    where m.email like 'paid-%' and m.team_id is not null
  loop
    perform public.club_duo_break(v_team);
  end loop;
  delete from public.marathon_submissions s
  using public.marathon_members m
  where s.member_id = m.id and m.email like 'paid-%';
  delete from public.marathon_members where email like 'paid-%';
  delete from public.marathon_tasks where id = i.sunday_task;
  delete from public.telegram_outbox where email like 'paid-%';
  delete from public.purchases where email like 'paid-%';
  delete from public.subscriptions where email like 'paid-%';
  delete from public.admins where email = 'paid-admin@example.com';
end $$;

select 'ALL TESTS PASSED';
