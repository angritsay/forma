-- =============================================================================
-- Управление клубом из админки (миграция 0047).
--
-- Запуск: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/97_club_admin.sql
-- на базе, где применены 00_shim.sql и все миграции. Всё в одной транзакции, в конце rollback.
--
-- Проверяется:
--   * все функции закрыты для не-админа;
--   * задание можно поставить на 101-й день и дальше;
--   * `admin_copy_tasks`: пробный прогон ничего не пишет и считает то же, что потом случится;
--     занятый день пропускается; с заменой — заменяется, но не день с пруфами; адресаты
--     копируются внутри круга и не копируются в другой; пересекающиеся диапазоны отвергаются;
--   * пары: пересобрать, разбить, поставить в пару — только двоих без пары;
--   * живой клуб: режим обязан совпадать, прежний клуб завершается, клуб режима один;
--   * очередь «Не просмотрено»: только оба живых клуба, новые сначала, без отклонённых и
--     просмотренных; по id открывается любой; «всё просмотрено» чистит очередь.
-- =============================================================================
begin;

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;
\o /dev/null

create or replace function pg_temp.as_user(p_id uuid, p_email text) returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function pg_temp.as_super() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
end $$;

select pg_temp.as_super();

insert into public.admins (email) values ('ca-admin@example.com') on conflict (email) do nothing;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000047a0', 'ca-admin@example.com', now()),
  ('00000000-0000-0000-0000-0000000047a1', 'ca-one@example.com',   now()),
  ('00000000-0000-0000-0000-0000000047a2', 'ca-two@example.com',   now()),
  ('00000000-0000-0000-0000-0000000047a3', 'ca-three@example.com', now()),
  ('00000000-0000-0000-0000-0000000047a4', 'ca-four@example.com',  now())
on conflict (id) do nothing;

insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['ca-one@example.com', 'ca-two@example.com', 'ca-three@example.com',
                  'ca-four@example.com']::citext[]) e
on conflict (email) do update set status = 'active', expires_at = now() + interval '30 days';

-- Все четверо в обоих клубах, пар пока нет.
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a1', 'ca-one@example.com');   select public.join_club();
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a2', 'ca-two@example.com');   select public.join_club();
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a3', 'ca-three@example.com'); select public.join_club();
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a4', 'ca-four@example.com');  select public.join_club();

select pg_temp.as_super();
update public.marathon_members set team_id = null where marathon_id = public.club_marathon(true);
delete from public.marathon_teams where marathon_id = public.club_marathon(true);

-- ---------------------------------------------------------------------------
-- 0. Не-админу закрыто всё.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a1', 'ca-one@example.com');
do $$
declare v_denied int := 0;
begin
  begin perform public.admin_copy_tasks(public.club_marathon(false), 1, 7, public.club_marathon(false), 8);
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_duo_rematch();
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_duo_split(gen_random_uuid());
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_duo_pair('a@example.com', 'b@example.com');
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_set_live_club(public.club_marathon(false), false);
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_proof_queue();
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  begin perform public.admin_proofs_mark_reviewed(array[gen_random_uuid()]);
  exception when insufficient_privilege then v_denied := v_denied + 1; end;
  assert v_denied = 7, 'не-админ должен получать отказ везде, отказов: ' || v_denied;
end $$;

-- ---------------------------------------------------------------------------
-- 1. Копирование недель.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000047a0', 'ca-admin@example.com');

do $$
declare
  v_solo uuid := public.club_marathon(false);
  v_duo  uuid := public.club_marathon(true);
  v_one  uuid;
  v_task uuid;
  r      record;
  v_n    int;
begin
  -- Чистый лист в обоих клубах на неделях 101-103 (дни 701-721): никакой сид сюда не достаёт.
  delete from public.marathon_tasks where marathon_id in (v_solo, v_duo) and day_index > 700;

  -- Сотый день больше не потолок.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_solo, 101, 'День сто один', 'per_member', 1);

  select id into v_one from public.marathon_members
   where marathon_id = v_solo and email = 'ca-one@example.com';

  -- Неделя 101: задания на 701, 702 (два), 703; на 702 одно — только для ca-one.
  insert into public.marathon_tasks (marathon_id, day_index, sort_order, title, title_en, rule, points)
  values (v_solo, 701, 0, 'Планка', 'Plank', 'per_member', 2),
         (v_solo, 702, 0, 'Присед', null, 'per_member', 2),
         (v_solo, 703, 0, 'Отдых', null, 'none', 0);
  insert into public.marathon_tasks (marathon_id, day_index, sort_order, title, rule, points)
  values (v_solo, 702, 1, 'Лично Насте', 'per_member', 5)
  returning id into v_task;
  insert into public.marathon_task_targets (task_id, member_id) values (v_task, v_one);

  -- На неделе 102 день 710 уже занят.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_solo, 710, 'Уже было', 'per_member', 1);

  -- Пробный прогон: 3 дня, но 710 (=702+7…) — проверяем по дням: 701→708, 702→709, 703→710.
  select * into r from public.admin_copy_tasks(v_solo, 701, 7, v_solo, 708, false, true);
  assert r.days_copied = 2 and r.days_skipped = 1 and r.tasks_copied = 3 and r.tasks_replaced = 0,
    format('пробный прогон: %s', r);
  select count(*) into v_n from public.marathon_tasks where marathon_id = v_solo and day_index between 708 and 714;
  assert v_n = 1, 'пробный прогон ничего не пишет, заданий: ' || v_n;

  -- По-настоящему — ровно то, что обещал пробный.
  select * into r from public.admin_copy_tasks(v_solo, 701, 7, v_solo, 708);
  assert r.days_copied = 2 and r.days_skipped = 1 and r.tasks_copied = 3, format('копия: %s', r);
  select count(*) into v_n from public.marathon_tasks where marathon_id = v_solo and day_index = 709;
  assert v_n = 2, 'на 709 два задания, есть ' || v_n;
  assert (select title from public.marathon_tasks where marathon_id = v_solo and day_index = 710) = 'Уже было',
    'занятый день не тронут';
  assert (select title_en from public.marathon_tasks where marathon_id = v_solo and day_index = 708) = 'Plank',
    'английская половина копируется';
  select count(*) into v_n
  from public.marathon_task_targets g join public.marathon_tasks t on t.id = g.task_id
  where t.marathon_id = v_solo and t.day_index = 709 and g.member_id = v_one;
  assert v_n = 1, 'адресат копируется внутри круга';

  -- С заменой: 703→710 заменяется.
  select * into r from public.admin_copy_tasks(v_solo, 703, 1, v_solo, 710, true);
  assert r.days_copied = 1 and r.tasks_replaced = 1, format('замена: %s', r);
  assert (select title from public.marathon_tasks where marathon_id = v_solo and day_index = 710) = 'Отдых',
    'занятый день заменён';

  -- День с пруфом не заменяется даже с заменой.
  insert into public.marathon_submissions (task_id, member_id, value_text)
  select t.id, v_one, 'сделала' from public.marathon_tasks t
  where t.marathon_id = v_solo and t.day_index = 710;
  select * into r from public.admin_copy_tasks(v_solo, 701, 1, v_solo, 710, true);
  assert r.days_locked = 1 and r.days_copied = 0, format('день с пруфом: %s', r);
  select count(*) into v_n from public.marathon_submissions s
   join public.marathon_tasks t on t.id = s.task_id where t.marathon_id = v_solo and t.day_index = 710;
  assert v_n = 1, 'пруф на месте';

  -- В другой клуб: задания есть, адресатов нет.
  select * into r from public.admin_copy_tasks(v_solo, 701, 3, v_duo, 701);
  assert r.days_copied = 3 and r.tasks_copied = 4, format('в дуо: %s', r);
  select count(*) into v_n
  from public.marathon_task_targets g join public.marathon_tasks t on t.id = g.task_id
  where t.marathon_id = v_duo and t.day_index between 701 and 703;
  assert v_n = 0, 'в другом клубе задание уходит всем';

  -- Пересечение и выход за границы.
  begin
    perform public.admin_copy_tasks(v_solo, 701, 7, v_solo, 705);
    assert false, 'пересечение должно отвергаться';
  exception when raise_exception then
    assert sqlerrm = 'overlap', 'код: ' || sqlerrm;
  end;
  begin
    perform public.admin_copy_tasks(v_solo, 701, 7, v_solo, 3650);
    assert false, 'выход за последний день должен отвергаться';
  exception when raise_exception then
    assert sqlerrm = 'out_of_range', 'код: ' || sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Пары.
-- ---------------------------------------------------------------------------
do $$
declare
  v_duo   uuid := public.club_marathon(true);
  v_pairs int;
  v_team  uuid;
  v_n     int;
  v_code  text;
begin
  -- Посторонние участники дуо из других тестов не должны мешать счёту: оставляем только наших.
  update public.marathon_members set status = 'removed'
   where marathon_id = v_duo and email not like 'ca-%@example.com';

  v_pairs := public.admin_duo_rematch();
  assert v_pairs = 2, 'четверо без пары — две пары, собралось ' || v_pairs;
  select count(*) into v_n from public.marathon_teams where marathon_id = v_duo and is_auto;
  assert v_n = 2, 'пары автоматические';

  select team_id into v_team from public.marathon_members
   where marathon_id = v_duo and email = 'ca-one@example.com';
  perform public.admin_duo_split(v_team);
  select count(*) into v_n from public.marathon_members
   where marathon_id = v_duo and team_id is null and status = 'active';
  assert v_n = 2, 'после разбивки двое без пары, есть ' || v_n;

  -- Поставить в пару можно только двоих без пары.
  begin
    perform public.admin_duo_pair('ca-one@example.com',
      (select email::text from public.marathon_members
        where marathon_id = v_duo and team_id is not null and status = 'active' limit 1));
  exception when raise_exception then v_code := sqlerrm; end;
  assert v_code = 'already_paired', 'чужую пару не разбивают побочно: ' || coalesce(v_code, 'null');

  v_team := public.admin_duo_pair(
    'ca-one@example.com',
    (select email::text from public.marathon_members
      where marathon_id = v_duo and team_id is null and status = 'active'
        and email <> 'ca-one@example.com' limit 1),
    true);
  assert (select not is_auto from public.marathon_teams where id = v_team), 'p_keep — постоянная пара';
  select count(*) into v_n from public.marathon_members where team_id = v_team;
  assert v_n = 2, 'в паре двое';

  -- Пересборка не трогает постоянную пару.
  perform public.admin_duo_rematch();
  assert exists (select 1 from public.marathon_teams where id = v_team), 'постоянная пара пережила пересборку';

  v_code := null;
  begin perform public.admin_duo_split(gen_random_uuid());
  exception when raise_exception then v_code := sqlerrm; end;
  assert v_code = 'team_not_found', 'чужая команда: ' || coalesce(v_code, 'null');
end $$;

-- ---------------------------------------------------------------------------
-- 3. Живой клуб.
-- ---------------------------------------------------------------------------
do $$
declare
  v_old  uuid := public.club_marathon(false);
  v_new  uuid;
  v_prev uuid;
  v_code text;
begin
  insert into public.marathons (slug, title, status, starts_on, days, team_size)
  values ('ca_round_two', 'Второй круг', 'draft', current_date, 3650, 1)
  returning id into v_new;

  begin perform public.admin_set_live_club(v_new, true);
  exception when raise_exception then v_code := sqlerrm; end;
  assert v_code = 'mode_mismatch', 'соло-круг не становится дуо-клубом: ' || coalesce(v_code, 'null');

  v_prev := public.admin_set_live_club(v_new, false);
  assert v_prev = v_old, 'возвращается прежний клуб';
  assert public.club_marathon(false) = v_new, 'клубом стал новый';
  assert (select status from public.marathons where id = v_new) = 'active', 'новый клуб идёт';
  assert (select status from public.marathons where id = v_old) = 'finished', 'прежний завершён';
  assert (select count(*) from public.marathons where is_club and team_size = 1) = 1, 'соло-клуб один';
  assert public.club_marathon(true) is not null, 'дуо-клуб не задет';

  -- Повторное нажатие — не ошибка.
  v_prev := public.admin_set_live_club(v_new, false);
  assert v_prev is null, 'повтор ничего не меняет';

  -- Вернуть как было.
  perform public.admin_set_live_club(v_old, false);
  assert public.club_marathon(false) = v_old, 'вернулся прежний';
end $$;

-- ---------------------------------------------------------------------------
-- 4. Очередь «Не просмотрено».
-- ---------------------------------------------------------------------------
do $$
declare
  v_solo  uuid := public.club_marathon(false);
  v_duo   uuid := public.club_marathon(true);
  v_other uuid;
  v_a     uuid;
  v_b     uuid;
  v_c     uuid;
  v_d     uuid;
  v_ids   uuid[];
  r       record;
  v_n     int;
begin
  -- Старое из других тестов в очередь не попадает.
  update public.marathon_submissions set reviewed_at = now() where reviewed_at is null;

  select id into v_other from public.marathons where slug = 'ca_round_two';

  -- Пруф в соло (старый), в дуо (новее), в постороннем круге и отклонённый.
  insert into public.marathon_submissions (task_id, member_id, value_text, submitted_at)
  select t.id, m.id, 'соло', now() - interval '2 hours'
  from public.marathon_tasks t, public.marathon_members m
  where t.marathon_id = v_solo and t.day_index = 708 and m.marathon_id = v_solo and m.email = 'ca-two@example.com'
  returning id into v_a;

  insert into public.marathon_submissions (task_id, member_id, value_text, submitted_at)
  select t.id, m.id, 'дуо', now() - interval '1 hour'
  from public.marathon_tasks t, public.marathon_members m
  where t.marathon_id = v_duo and t.day_index = 701 and m.marathon_id = v_duo and m.email = 'ca-two@example.com'
  returning id into v_b;

  insert into public.marathon_submissions (task_id, member_id, value_text, submitted_at, voided_at, void_reason)
  select t.id, m.id, 'отклонён', now(), now(), 'не видно'
  from public.marathon_tasks t, public.marathon_members m
  where t.marathon_id = v_solo and t.day_index = 708 and m.marathon_id = v_solo and m.email = 'ca-three@example.com'
  returning id into v_c;

  insert into public.marathon_members (marathon_id, email) values (v_other, 'ca-one@example.com');
  insert into public.marathon_tasks (marathon_id, day_index, title) values (v_other, 1, 'Посторонний');
  insert into public.marathon_submissions (task_id, member_id, value_text)
  select t.id, m.id, 'посторонний'
  from public.marathon_tasks t, public.marathon_members m
  where t.marathon_id = v_other and m.marathon_id = v_other
  returning id into v_d;

  select array_agg(q.id order by ord), max(q.total), count(*)
    into v_ids, v_n, v_n
  from (select x.*, row_number() over () as ord from public.admin_proof_queue(50) x) q;
  assert v_ids = array[v_b, v_a], format('в очереди оба клуба, новые сначала: %s', v_ids);

  select * into r from public.admin_proof_queue(1) limit 1;
  assert r.id = v_b and r.total = 2 and r.duo, format('лимит и total: %s', r);
  assert r.member_name is not null and r.task_title is not null, 'с именами';

  -- По id — любой, даже отклонённый и в постороннем круге.
  select * into r from public.admin_proof_queue(50, v_c);
  assert r.id = v_c and r.voided_at is not null, 'отклонённый открывается по ссылке';
  select * into r from public.admin_proof_queue(50, v_d);
  assert r.id = v_d, 'посторонний открывается по ссылке';

  -- «Всё просмотрено» — по показанным; отклонённый не трогается.
  v_n := public.admin_proofs_mark_reviewed(array[v_a, v_b, v_c]);
  assert v_n = 2, 'отмечено двое, а не ' || v_n;
  select count(*) into v_n from public.admin_proof_queue(50);
  assert v_n = 0, 'очередь пуста';
  assert (select reviewed_by from public.marathon_submissions where id = v_a)
         = '00000000-0000-0000-0000-0000000047a0', 'кто смотрел — записано';
end $$;

\o
\echo 'CLUB ADMIN 0047 TESTS PASSED'
rollback;
