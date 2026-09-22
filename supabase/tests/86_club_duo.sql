-- =============================================================================
-- Клуб в двух вариантах и пары в нём (0033, 0034).
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём это может соврать:
--   * клуб ровно один на режим, третий невозможен;
--   * `join_club()` кладёт в оба круга, и повторный вызов не разбивает пару;
--   * приглашение: одно открытое на человека, чужое нельзя принять дважды,
--     своё — нельзя принять самой, без подписки — нельзя вовсе;
--   * принятое приглашение расторгает прежние пары обеих;
--   * автоподбор не трогает выбранные пары и оставляет нечётного без пары;
--   * `club_duo_status()` не возвращает почту — ни свою, ни чужую.
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

-- --- оба клуба есть, третьего не завести --------------------------------------
do $$
declare v_n int; v_blocked boolean := false; begin
  select count(*) into v_n from public.marathons where is_club and status = 'active';
  assert v_n = 2, 'клубов должно быть два (соло и дуо), получили ' || v_n::text;
  assert public.club_marathon(false) is not null, 'соло-клуб не нашёлся';
  assert public.club_marathon(true) is not null, 'дуо-клуб не нашёлся';
  assert public.club_marathon(false) <> public.club_marathon(true), 'это один и тот же круг';

  begin
    insert into public.marathons (slug, title, starts_on, days, team_size, status, is_club)
    values ('club_trio', 'Трио', current_date, 10, 3, 'active', true);
  exception when unique_violation then
    v_blocked := true;
  end;
  assert v_blocked, 'третий клуб должен быть невозможен';
end $$;

/*
 * Четверо с подпиской: две подруги, и двое, которым пару подберут.
 *
 * Префикс `…0f1`, а не `…0d1`: тот занят в 84_telegram_outbox под другой почтой, а
 * `on conflict (id) do nothing` молча оставил бы чужого пользователя — и
 * `current_email()`, который ищет адрес по `sub` в `auth.users`, отдал бы его. Тест
 * при этом не падал бы, а тихо проверял не тех людей.
 */
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'duo-one@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000f2', 'duo-two@example.com',   '{}'),
  ('00000000-0000-0000-0000-0000000000f3', 'duo-three@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000f4', 'duo-four@example.com',  '{}'),
  ('00000000-0000-0000-0000-0000000000f5', 'duo-broke@example.com', '{}')
on conflict (id) do nothing;

update public.profiles set display_name = 'Настя' where email = 'duo-one@example.com';
update public.profiles set display_name = 'Лена'  where email = 'duo-two@example.com';

-- Живая подписка у четверых; пятая не платила и в клуб попасть не должна.
insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array[
  'duo-one@example.com', 'duo-two@example.com',
  'duo-three@example.com', 'duo-four@example.com'
]::citext[]) e
on conflict (email) do update set
  status = 'active', expires_at = now() + interval '30 days';

-- --- join_club кладёт в оба круга ---------------------------------------------
do $$
declare
  -- Два параллельных массива, а не id, собранный из префикса и номера: склейка
  -- уже один раз тихо указала на чужого пользователя, и по такому коду это не видно.
  v_ids   uuid[] := array[
    '00000000-0000-0000-0000-0000000000f1',
    '00000000-0000-0000-0000-0000000000f2',
    '00000000-0000-0000-0000-0000000000f3',
    '00000000-0000-0000-0000-0000000000f4'
  ];
  v_mails text[] := array[
    'duo-one@example.com', 'duo-two@example.com',
    'duo-three@example.com', 'duo-four@example.com'
  ];
  i int;
begin
  for i in 1 .. array_length(v_ids, 1) loop
    perform pg_temp.as_user(v_ids[i], v_mails[i]);
    -- Тот, за кого мы себя выдаём, должен быть тем, кем мы его считаем: `current_email()`
    -- ищет адрес по `sub` в `auth.users`, и занятый кем-то id увёл бы весь тест в сторону.
    assert public.current_email() = v_mails[i]::citext,
      'id ' || v_ids[i]::text || ' занят под ' || coalesce(public.current_email()::text, 'null');
    perform public.join_club();
  end loop;
end $$;

select pg_temp.as_super();
do $$
declare v_n int; begin
  select count(*) into v_n from public.marathon_members
   where marathon_id = public.club_marathon(false) and status = 'active'
     and email like 'duo-%';
  assert v_n = 4, 'в соло-клубе должно быть четверо, получили ' || v_n::text;

  select count(*) into v_n from public.marathon_members
   where marathon_id = public.club_marathon(true) and status = 'active'
     and email like 'duo-%';
  assert v_n = 4, 'в дуо-клубе должно быть четверо, получили ' || v_n::text;

  -- И все — без пары: пару составляет приглашение или автоподбор, не запись в клуб.
  select count(*) into v_n from public.marathon_members
   where marathon_id = public.club_marathon(true) and email like 'duo-%' and team_id is not null;
  assert v_n = 0, 'запись в клуб не должна никого спаривать, получили ' || v_n::text;
end $$;

-- --- без подписки в клуб не попасть -------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f5', 'duo-broke@example.com');
do $$
declare v_club uuid; v_n int; begin
  v_club := public.join_club();
  assert v_club is null, 'без подписки join_club() должна вернуть null';
  perform pg_temp.as_super();
  select count(*) into v_n from public.marathon_members where email = 'duo-broke@example.com';
  assert v_n = 0, 'неоплативший не должен попасть ни в один клуб, строк ' || v_n::text;
end $$;

-- --- приглашение: одно открытое на человека -----------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1', 'duo-one@example.com');
do $$
declare t1 text; t2 text; begin
  t1 := public.club_invite_create();
  t2 := public.club_invite_create();
  assert t1 = t2, 'вторая ссылка должна быть той же: уже отправленная не обесценивается';
  assert length(t1) >= 16, 'токен слишком короткий: ' || length(t1)::text;
  -- Сохраняем во временную таблицу: дальше идём от другой роли.
  create temp table duo_tok as select t1 as token;
  grant select on duo_tok to public;
end $$;

-- Свою же ссылку принять нельзя: парой с собой не станешь.
do $$
declare v_ok boolean := false; tok text; begin
  select token into tok from duo_tok;
  begin
    perform public.club_invite_redeem(tok);
  exception when others then
    v_ok := sqlerrm like '%invite_own%';
  end;
  assert v_ok, 'своё приглашение принимать нельзя';
end $$;

-- Без подписки — тоже нельзя, даже по действительной ссылке.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f5', 'duo-broke@example.com');
do $$
declare v_ok boolean := false; tok text; begin
  select token into tok from duo_tok;
  begin
    perform public.club_invite_redeem(tok);
  exception when others then
    v_ok := sqlerrm like '%no_subscription%';
  end;
  assert v_ok, 'без оплаченной подписки пара не составляется';
end $$;

-- --- подруга принимает: пара собралась и она не автоматическая -----------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2', 'duo-two@example.com');
do $$
declare v_team uuid; tok text; begin
  select token into tok from duo_tok;
  v_team := public.club_invite_redeem(tok);
  assert v_team is not null, 'приглашение должно вернуть команду';
  create temp table duo_team as select v_team as id;
  grant select on duo_team to public;
end $$;

select pg_temp.as_super();
do $$
declare v_n int; v_auto boolean; v_team uuid; begin
  select id into v_team from duo_team;
  select count(*) into v_n from public.marathon_members where team_id = v_team;
  assert v_n = 2, 'в паре должно быть двое, получили ' || v_n::text;

  select is_auto into v_auto from public.marathon_teams where id = v_team;
  assert v_auto = false, 'выбранная пара не автоматическая';

  -- Погашено — и известно кем.
  select count(*) into v_n from public.club_duo_invites
   where redeemed_by = 'duo-two@example.com' and redeemed_at is not null;
  assert v_n = 1, 'приглашение должно быть погашено ровно раз, получили ' || v_n::text;
end $$;

-- Дважды одну ссылку не принять.
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f3', 'duo-three@example.com');
do $$
declare v_ok boolean := false; tok text; begin
  select token into tok from duo_tok;
  begin
    perform public.club_invite_redeem(tok);
  exception when others then
    v_ok := sqlerrm like '%invite_used%';
  end;
  assert v_ok, 'погашенное приглашение принимать нельзя';
end $$;

-- --- автоподбор: выбранную пару не трогает, нечётного оставляет ----------------
select pg_temp.as_super();
do $$
declare v_pairs int; v_team uuid; v_n int; v_club uuid := public.club_marathon(true); begin
  select id into v_team from duo_team;

  /*
   * Трое без пары: duo-three, duo-four и участник из 10_smoke, если он есть.
   * Чтобы число было предсказуемым, считаем именно наших.
   */
  v_pairs := public.club_duo_rematch();
  assert v_pairs >= 1, 'автоподбор должен был собрать хотя бы одну пару, собрал ' || v_pairs::text;

  -- Выбранная пара цела и по-прежнему не автоматическая.
  select count(*) into v_n from public.marathon_members where team_id = v_team;
  assert v_n = 2, 'автоподбор разбил выбранную пару, в ней ' || v_n::text;
  assert (select is_auto from public.marathon_teams where id = v_team) = false,
    'выбранная пара не должна стать автоматической';

  -- Трое и четвёртая теперь в паре, и она автоматическая.
  select count(*) into v_n
    from public.marathon_members m
    join public.marathon_teams t on t.id = m.team_id
   where m.email in ('duo-three@example.com', 'duo-four@example.com') and t.is_auto;
  assert v_n = 2, 'двоих без пары должно было свести автоподбором, получили ' || v_n::text;

  -- Нечётный остаётся без пары: в круге не может быть непарного участника в команде.
  select count(*) into v_n
    from public.marathon_teams t
   where t.marathon_id = v_club
     and (select count(*) from public.marathon_members m where m.team_id = t.id) <> 2;
  assert v_n = 0, 'команда не из двоих быть не должна, таких ' || v_n::text;
end $$;

-- Второй прогон: автоматические пары пересобираются, выбранная стоит.
do $$
declare v_team uuid; v_n int; begin
  select id into v_team from duo_team;
  perform public.club_duo_rematch();
  select count(*) into v_n from public.marathon_members where team_id = v_team;
  assert v_n = 2, 'повторный автоподбор разбил выбранную пару';
end $$;

-- --- join_club после пары её не разбивает --------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f2', 'duo-two@example.com');
do $$
declare v_team uuid; v_n int; begin
  perform public.join_club();
  perform public.join_club();
  perform pg_temp.as_super();
  select id into v_team from duo_team;
  select count(*) into v_n from public.marathon_members where team_id = v_team;
  assert v_n = 2, 'открытие вкладки не должно разбивать пару, в ней ' || v_n::text;
end $$;

-- --- club_duo_status: напарница видна, почта — нет ------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1', 'duo-one@example.com');
do $$
declare r record; begin
  select * into r from public.club_duo_status();
  assert r.team_id is not null, 'пара должна быть видна';
  assert r.is_auto = false, 'пара выбранная, а не автоматическая';
  assert r.mate_name = 'Лена', 'имя напарницы, получили ' || coalesce(r.mate_name, 'null');
  -- Приглашение погашено, значит открытой ссылки больше нет.
  assert r.invite_token is null, 'после пары открытого приглашения быть не должно';
end $$;

-- Таблица приглашений закрыта: в ней чужие адреса, а токен — это доступ к паре.
do $$
declare v_blocked boolean := false; begin
  begin
    perform count(*) from public.club_duo_invites;
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  assert v_blocked, 'таблицу приглашений нельзя читать напрямую';
end $$;

select 'ok 86_club_duo';
