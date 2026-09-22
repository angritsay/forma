-- =============================================================================
-- marathon_winners (0028) — победитель недели.
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём это может соврать:
--   * **один победитель на неделю**: повторное объявление заменяет, а не добавляет;
--   * снять объявление можно (тренер нажал не на ту строку);
--   * участник чужого круга победителем не становится — это опечатка, а не данные;
--   * объявлять может только админ;
--   * `club_winner()` отдаёт **последнего объявленного**, а не победителя текущей
--     недели: идущая неделя победителя ещё не имеет, и в понедельник на экране
--     висит тот, кто выиграл в воскресенье;
--   * видят его только те, кто в том круге был;
--   * `is_me` правдив, и адрес не возвращается никогда.
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

insert into public.admins (email) values ('winner-admin@example.com')
on conflict (email) do nothing;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000e0', 'winner-admin@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000e1', 'win-one@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000e2', 'win-two@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000e3', 'win-out@example.com',   '{}')
on conflict (id) do nothing;

update public.profiles set display_name = 'Настя' where email = 'win-one@example.com';

-- Клуб — **одна** строка (`marathons_one_club_idx` запрещает вторую), недели
-- внутри него. Плюс посторонний марафон, чтобы проверить, что чужие не мешаются.
do $$
declare
  v_club uuid; v_other uuid;
  v_m1 uuid; v_m2 uuid; v_mo uuid;
begin
  -- 10_smoke мог уже завести клуб: берём его, если он есть.
  select id into v_club from public.marathons where is_club limit 1;
  if v_club is null then
    insert into public.marathons (slug, title, starts_on, days, team_size, status, is_club, prize)
    values ('win_club', 'Клуб маленьких шагов', current_date - 14, 365, 1, 'active', true,
            'Час с Сергеем')
    returning id into v_club;
  else
    update public.marathons
       set starts_on = current_date - 14, prize = 'Час с Сергеем'
     where id = v_club;
  end if;

  insert into public.marathons (slug, title, starts_on, days, team_size, status, is_club)
  values ('win_other', 'Не клуб', current_date - 7, 7, 1, 'finished', false)
  on conflict (slug) do update set status = 'finished' returning id into v_other;

  insert into public.marathon_members (marathon_id, email) values (v_club, 'win-one@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_m1;
  insert into public.marathon_members (marathon_id, email) values (v_club, 'win-two@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_m2;
  insert into public.marathon_members (marathon_id, email) values (v_other, 'win-out@example.com')
  on conflict (marathon_id, email) do update set status = 'active' returning id into v_mo;

  -- Кладу id во временную таблицу: следующие блоки идут от других ролей.
  create temp table win_ids as
    select v_club as club, v_other as other, v_m1 as m1, v_m2 as m2, v_mo as mo;
  grant select on win_ids to public;
end $$;

-- --- объявлять может только админ ---------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1', 'win-one@example.com');
do $$
declare v_ok boolean := false; i record; begin
  select * into i from win_ids;
  begin
    perform public.admin_set_winner(i.club, 1, i.m1, null);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  assert v_ok, 'обычный участник не должен объявлять победителя';

  v_ok := false;
  begin
    perform * from public.admin_marathon_winner(i.club, 1);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  assert v_ok, 'обычный участник не должен читать админскую сводку';
end $$;

-- --- один победитель на неделю -------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e0', 'winner-admin@example.com');
do $$
declare i record; v_n int; r record; begin
  select * into i from win_ids;

  /*
   * Считаем через `admin_marathon_winner()`, а не `select` из таблицы: напрямую
   * её не читает даже админ — он тоже роль `authenticated`, а с таблицы всё
   * отозвано. Это и есть настоящий интерфейс, так что тест идёт по нему.
   */

  -- Неделя 2 клуба: победила Настя.
  perform public.admin_set_winner(i.club, 2, i.m1, 'три дня подряд');
  select count(*) into v_n from public.admin_marathon_winner(i.club, 2);
  assert v_n = 1, 'объявление ставит одну строку, получили ' || v_n::text;

  -- Передумал: это та же строка, а не вторая рядом.
  perform public.admin_set_winner(i.club, 2, i.m2, 'всё-таки она');
  select count(*) into v_n from public.admin_marathon_winner(i.club, 2);
  assert v_n = 1, 'второй победитель той же недели невозможен, получили ' || v_n::text;

  select * into r from public.admin_marathon_winner(i.club, 2);
  assert r.member_id = i.m2, 'объявлен последний названный';
  assert r.note = 'всё-таки она', 'заметка тренера сохраняется';

  -- Неделя 1 — своя строка рядом: ключ (круг, неделя), а не круг.
  perform public.admin_set_winner(i.club, 1, i.m1, null);
  select count(*) into v_n from public.admin_marathon_winner(i.club, 1);
  assert v_n = 1, 'у первой недели свой победитель, получили ' || v_n::text;
  select count(*) into v_n from public.admin_marathon_winner(i.club, 2);
  assert v_n = 1, 'и у второй свой, объявление первой её не тронуло';

  -- Снять объявление.
  perform public.admin_set_winner(i.club, 1, null, null);
  select count(*) into v_n from public.admin_marathon_winner(i.club, 1);
  assert v_n = 0, 'снятие удаляет строку, получили ' || v_n::text;
  select count(*) into v_n from public.admin_marathon_winner(i.club, 2);
  assert v_n = 1, 'снятие одной недели не трогает соседнюю';

  -- Последним объявляю Настю за вторую неделю: её и должен показать club_winner().
  perform public.admin_set_winner(i.club, 2, i.m1, 'три дня подряд');
end $$;

-- --- участник чужого круга победителем не становится ---------------------------
do $$
declare i record; v_ok boolean := false; begin
  select * into i from win_ids;
  begin
    perform public.admin_set_winner(i.club, 3, i.mo, null);
  exception when others then
    v_ok := sqlerrm like '%member_not_in_marathon%';
  end;
  assert v_ok, 'участник другого марафона не может быть победителем клуба';

  -- И нулевая неделя — не неделя.
  v_ok := false;
  begin
    perform public.admin_set_winner(i.club, 0, i.m1, null);
  exception when others then
    v_ok := sqlerrm like '%invalid_week%';
  end;
  assert v_ok, 'неделя меньше первой — это ошибка вызова';
end $$;

-- --- club_winner: последний объявленный, и только своим -------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1', 'win-one@example.com');
do $$
declare r record; begin
  select * into r from public.club_winner();
  assert r.week = 2,
    'показывается последняя объявленная неделя, получили ' || coalesce(r.week::text, 'null');
  assert r.display_name = 'Настя', 'имя из профиля, получили ' || coalesce(r.display_name, 'null');
  assert r.is_me = true, 'победитель — это я, и это должно быть видно';
  assert r.prize = 'Час с Сергеем', 'приз круга показывается рядом';
  assert r.note = 'три дня подряд', 'заметка тренера доезжает';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000000e2', 'win-two@example.com');
do $$
declare r record; begin
  select * into r from public.club_winner();
  assert r.week = 2, 'участник клуба победителя видит';
  assert r.is_me = false, 'чужая победа не должна отмечаться как своя';
end $$;

-- Человек не из клуба не видит ничего: победитель — новость для тех, кто был внутри.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e3', 'win-out@example.com');
do $$
declare v_n int; begin
  select count(*) into v_n from public.club_winner();
  assert v_n = 0, 'посторонний не должен видеть победителя клуба, получили ' || v_n::text;
end $$;

-- --- таблица закрыта напрямую ----------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1', 'win-one@example.com');
do $$
declare v_blocked boolean := false; begin
  begin
    perform count(*) from public.marathon_winners;
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  assert v_blocked, 'рядом лежит member_id — читать таблицу напрямую нельзя';
end $$;

-- --- объявление становится сообщением в боте (0029) ------------------------------
--
-- Стык двух машин: 0028 объявляет, 0027 отправляет. Проверяется то, что легко
-- сломать при следующей правке любой из них.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000e0', 'winner-admin@example.com');
do $$
declare i record; begin
  select * into i from win_ids;
  -- Неделя 5, чтобы не пересекаться с тем, что объявлено выше.
  perform public.admin_set_winner(i.club, 5, i.m1, 'неделя без пропусков');
  perform public.admin_set_winner(i.club, 5, i.m1, 'поправил заметку');
  -- Передумал: победа уходит другому.
  perform public.admin_set_winner(i.club, 5, i.m2, 'всё-таки она');
end $$;

select pg_temp.as_super();
do $$
declare i record; v_n int; v_key text; begin
  select * into i from win_ids;
  -- Считаем только пятую неделю: выше по файлу тот же человек объявлялся за
  -- первую и вторую, и это тоже поводы — просто другие.
  v_key := 'weekly_winner:' || i.club::text || ':5:';

  -- Настя: одно сообщение, хотя объявляли её дважды (второй раз — правка заметки).
  select count(*) into v_n from public.telegram_outbox
   where dedupe_key = v_key || i.m1::text;
  assert v_n = 1, 'повторное объявление того же человека не удваивает, получили ' || v_n::text;

  -- Второй участник: своё сообщение, потому что теперь победитель он.
  select count(*) into v_n from public.telegram_outbox
   where dedupe_key = v_key || i.m2::text;
  assert v_n = 1, 'новому победителю сообщение уходит, получили ' || v_n::text;

  /*
   * И ничего не отзывается у прежнего: его строка по-прежнему ждёт отправки.
   * Телеграм не умеет забирать отправленное, а «извини, не ты» роботом — это то,
   * что тренер должен сказать сам.
   */
  assert (select status from public.telegram_outbox where dedupe_key = v_key || i.m1::text)
         = 'pending',
    'у прежнего победителя ничего не отзывается';

  -- Приз круга едет в параметрах: текст подставит отправитель.
  assert (select params ->> 'prize' from public.telegram_outbox
           where dedupe_key = v_key || i.m2::text) = 'Час с Сергеем',
    'приз должен попасть в параметры';

  -- Сутки, а не трое: поздравление на третий день поздравлением не является.
  assert (select expires_at - send_after from public.telegram_outbox
           where dedupe_key = v_key || i.m2::text) <= interval '1 day',
    'у поздравления срок сутки';
end $$;

select 'ok 85_weekly_winner';
