-- =============================================================================
-- Реферальная пара (0051 + 0053): позвавшая попадает в клуб и в пару с подругой.
-- Запускать после миграций и 10_smoke.sql на той же базе (клубы соло и дуо уже есть).
--
-- Проверяется то, на чём это может соврать:
--   * позвавшая, которая ни разу не открывала клуб, после оплаты подруги — в обоих кругах и
--     в выбранной (не автоматической) паре с ней;
--   * ушедшая из круга (`removed`) обратно не записывается и пары не получает;
--   * позвавшая сверх лимита (12 наград за год) в клуб не записывается — даже с живой подпиской;
--   * выбранная пара позвавшей остаётся как была, подруга остаётся без пары.
--
-- Коды и привязки заводятся напрямую, суперпользователем: как человек получает код и
-- привязывается, проверено в самих функциях 0051; здесь важна награда — момент оплаты.
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

reset role;
select set_config('request.jwt.claims', '{}', false);

-- Клубы на месте: без них проверять нечего, и лучше упасть здесь, чем молча пройти.
do $$ begin
  assert public.club_marathon(false) is not null, 'соло-клуб не нашёлся';
  assert public.club_marathon(true) is not null, 'дуо-клуб не нашёлся';
end $$;

-- Коды четырёх позвавших; привязки четырёх подруг.
insert into public.referral_codes (code, owner_email) values
  ('ref53aaa', 'ref53-a-owner@example.com'),
  ('ref53bbb', 'ref53-b-owner@example.com'),
  ('ref53ccc', 'ref53-c-owner@example.com'),
  ('ref53ddd', 'ref53-d-owner@example.com')
on conflict do nothing;

insert into public.referrals (referred_email, code) values
  ('ref53-a-friend@example.com', 'ref53aaa'),
  ('ref53-b-friend@example.com', 'ref53bbb'),
  ('ref53-c-friend@example.com', 'ref53ccc'),
  ('ref53-d-friend@example.com', 'ref53ddd')
on conflict do nothing;

-- --- A. Позвавшая вне клуба: после оплаты подруги обе в кругах и в одной паре ----------
do $$
declare v_n int; begin
  select count(*) into v_n from public.marathon_members where email = 'ref53-a-owner@example.com';
  assert v_n = 0, 'позвавшая A не должна быть в клубе до оплаты подруги';
  assert not exists (select 1 from public.subscriptions where email = 'ref53-a-owner@example.com'),
    'у позвавшей A не должно быть подписки до награды';
end $$;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('ref53-a-friend@example.com', 'monthly', 'active', now(), now() + interval '30 days');

do $$
declare
  v_solo uuid := public.club_marathon(false);
  v_duo  uuid := public.club_marathon(true);
  v_n    int;
  v_ot   uuid;
  v_ft   uuid;
  v_auto boolean;
begin
  assert (select rewarded_at is not null and owner_days = 30 from public.referrals
           where referred_email = 'ref53-a-friend@example.com'),
    'награда A должна быть начислена обеим';

  select count(*) into v_n from public.marathon_members
   where email = 'ref53-a-owner@example.com' and status = 'active'
     and marathon_id in (v_solo, v_duo);
  assert v_n = 2, 'позвавшая A должна быть в обоих кругах, строк ' || v_n::text;

  select team_id into v_ot from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-a-owner@example.com';
  select team_id into v_ft from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-a-friend@example.com';
  assert v_ot is not null and v_ot = v_ft, 'позвавшая A и подруга должны быть в одной паре';

  select is_auto into v_auto from public.marathon_teams where id = v_ot;
  assert v_auto = false, 'реферальная пара — выбранная, не автоматическая';
end $$;

-- --- B. Ушедшая из круга: не возвращается и пары не получает ------------------------------
insert into public.marathon_members (marathon_id, email, status)
select id, 'ref53-b-owner@example.com', 'removed'
from unnest(array[public.club_marathon(false), public.club_marathon(true)]) as id
on conflict (marathon_id, email) do update set status = 'removed';

insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('ref53-b-friend@example.com', 'monthly', 'active', now(), now() + interval '30 days');

do $$
declare v_n int; v_ft uuid; begin
  -- Дни ей положены — это награда, а не клуб.
  assert (select owner_days = 30 from public.referrals
           where referred_email = 'ref53-b-friend@example.com'),
    'ушедшая из круга всё равно получает свои +30 дней';

  select count(*) into v_n from public.marathon_members
   where email = 'ref53-b-owner@example.com' and status <> 'removed';
  assert v_n = 0, 'ушедшая B не должна вернуться ни в один круг, активных строк ' || v_n::text;

  select team_id into v_ft from public.marathon_members
   where marathon_id = public.club_marathon(true) and email = 'ref53-b-friend@example.com';
  assert v_ft is null, 'подруга B не должна оказаться в паре с ушедшей';
end $$;

-- --- C. Сверх лимита: двенадцать наград за год — тринадцатая без дней и без клуба ----------
-- Живая подписка у позвавшей есть: запись в клуб держится именно на награде, а не на доступе.
insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('ref53-c-owner@example.com', 'annual', 'active', now() - interval '1 day',
        now() + interval '300 days')
on conflict (email) do update set status = 'active', expires_at = now() + interval '300 days';

insert into public.referrals (referred_email, code, rewarded_at, owner_days)
select 'ref53-c-past' || i::text || '@example.com', 'ref53ccc', now() - interval '10 days', 30
from generate_series(1, 12) as i
on conflict do nothing;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('ref53-c-friend@example.com', 'monthly', 'active', now(), now() + interval '30 days');

do $$
declare v_n int; begin
  assert (select rewarded_at is not null and owner_days = 0 from public.referrals
           where referred_email = 'ref53-c-friend@example.com'),
    'тринадцатая награда за год: подруга получает, позвавшая — нет';

  select count(*) into v_n from public.marathon_members where email = 'ref53-c-owner@example.com';
  assert v_n = 0, 'позвавшая сверх лимита не должна записываться в клуб, строк ' || v_n::text;

  select count(*) into v_n from public.marathon_members
   where email = 'ref53-c-friend@example.com' and status = 'active';
  assert v_n = 2, 'подруга C сама в клуб записывается, строк ' || v_n::text;
end $$;

-- --- D. Выбранная пара позвавшей остаётся ---------------------------------------------------
insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['ref53-d-owner@example.com', 'ref53-d-mate@example.com']::citext[]) as e
on conflict (email) do update set status = 'active', expires_at = now() + interval '30 days';

insert into public.marathon_members (marathon_id, email, status)
select c.id, e.email, 'active'
from unnest(array[public.club_marathon(false), public.club_marathon(true)]) as c(id)
cross join unnest(array['ref53-d-owner@example.com', 'ref53-d-mate@example.com']::citext[])
  as e(email)
on conflict (marathon_id, email) do nothing;

do $$
declare
  v_duo  uuid := public.club_marathon(true);
  v_a    uuid;
  v_b    uuid;
  v_team uuid;
begin
  select id into v_a from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-d-owner@example.com';
  select id into v_b from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-d-mate@example.com';
  v_team := public.club_duo_pair(v_duo, v_a, v_b, false);
  create temp table ref53_team as select v_team as id;
end $$;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
values ('ref53-d-friend@example.com', 'monthly', 'active', now(), now() + interval '30 days');

do $$
declare
  v_duo  uuid := public.club_marathon(true);
  v_team uuid;
  v_ot   uuid;
  v_mt   uuid;
  v_ft   uuid;
begin
  select id into v_team from ref53_team;
  select team_id into v_ot from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-d-owner@example.com';
  select team_id into v_mt from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-d-mate@example.com';
  select team_id into v_ft from public.marathon_members
   where marathon_id = v_duo and email = 'ref53-d-friend@example.com';

  assert v_ot = v_team and v_mt = v_team, 'выбранная пара позвавшей D должна остаться как была';
  assert v_ft is null, 'подруга D не должна разбивать чужую выбранную пару';
  assert (select owner_days = 30 from public.referrals
           where referred_email = 'ref53-d-friend@example.com'),
    'награда D начисляется, пара — нет';
end $$;

select 'referral pairing: ALL PASSED';
