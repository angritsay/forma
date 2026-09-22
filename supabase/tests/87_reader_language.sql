-- =============================================================================
-- Половина на языке читателя (0035).
-- Запускать после 10_smoke.sql на той же базе.
--
-- Проверяется то, на чём это может соврать:
--   * `my_locale()` берёт язык из профиля, а не из claim;
--   * `pick_l10n()` отдаёт английское только англичанину и только когда оно есть;
--   * пустая и пробельная английская половина одинаково означают «не перевели»;
--   * `my_marathons()` и `club_winner()` выбирают половину, а не отдают русскую всем;
--   * у анонима язык русский и функции ему не открыты.
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

/*
 * Двое: одна читает по-русски, вторая по-английски.
 *
 * Идентификаторы `…0c3`/`…0c4` — свободные; занятые уже дважды молча подменили, кого проверяет
 * тест. `current_email()` ищет адрес по `sub` в `auth.users`, а `on conflict (id) do nothing`
 * оставляет чужую строку, так что тест не падает — он тихо проверяет другого человека. Поэтому
 * первое, что здесь утверждается, — что мы разговариваем с тем, с кем собирались. Свободные
 * диапазоны на сегодня: …0a4–a9, …0b3–bf, …0c5–cf, …0d2–df, …0e4–ef, …0f6–fe.
 */
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c3', 'lang-ru@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000c4', 'lang-en@example.com', '{}')
on conflict (id) do nothing;

update public.profiles set locale = 'ru' where email = 'lang-ru@example.com';
update public.profiles set locale = 'en' where email = 'lang-en@example.com';

-- --- my_locale и pick_l10n ----------------------------------------------------
do $$
begin
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c3', 'lang-ru@example.com');
  assert public.current_email() = 'lang-ru@example.com',
    'тест проверяет не того человека: ' || coalesce(public.current_email()::text, 'null');
  assert public.my_locale() = 'ru', 'язык должен быть русским, получили ' || public.my_locale();
  assert public.pick_l10n('Час с тренером', 'An hour with the coach') = 'Час с тренером',
    'русскому читателю отдали английское';

  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c4', 'lang-en@example.com');
  assert public.current_email() = 'lang-en@example.com',
    'тест проверяет не того человека: ' || coalesce(public.current_email()::text, 'null');
  assert public.my_locale() = 'en', 'язык должен быть английским, получили ' || public.my_locale();
  assert public.pick_l10n('Час с тренером', 'An hour with the coach') = 'An hour with the coach',
    'английскому читателю не отдали английское';

  -- Пустая половина — это «не перевели», и тогда читатель видит слова тренера, а не пустоту.
  assert public.pick_l10n('Час с тренером', null) = 'Час с тренером',
    'без перевода должно остаться русское';
  assert public.pick_l10n('Час с тренером', '') = 'Час с тренером',
    'пустая строка — это тоже «не перевели»';
  -- Пробелы приходят от формы, а не от переводчика.
  assert public.pick_l10n('Час с тренером', '   ') = 'Час с тренером',
    'строка из пробелов — это тоже «не перевели»';
end $$;

select pg_temp.as_super();

-- --- язык доезжает до круга и до приза -----------------------------------------
do $$
declare
  v_club   uuid := public.club_marathon(false);
  v_title  text;
  v_prize  text;
begin
  assert v_club is not null, 'соло-клуб не нашёлся';
  update public.marathons
  set title = 'Клуб', title_en = 'Solo club',
      prize = 'Час с тренером', prize_en = 'An hour with the coach'
  where id = v_club;

  -- Обе в клубе, иначе `my_marathons()` им ничего не вернёт.
  insert into public.marathon_members (marathon_id, email, status)
  values (v_club, 'lang-ru@example.com', 'active'),
         (v_club, 'lang-en@example.com', 'active')
  on conflict do nothing;

  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c3', 'lang-ru@example.com');
  select m.title, m.prize into v_title, v_prize
  from public.my_marathons() m where m.id = v_club;
  assert v_title = 'Клуб', 'русской читательнице название пришло как ' || coalesce(v_title, 'null');
  assert v_prize = 'Час с тренером', 'русской читательнице приз пришёл как ' || coalesce(v_prize, 'null');

  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c4', 'lang-en@example.com');
  select m.title, m.prize into v_title, v_prize
  from public.my_marathons() m where m.id = v_club;
  assert v_title = 'Solo club', 'английской читательнице название пришло как ' || coalesce(v_title, 'null');
  assert v_prize = 'An hour with the coach',
    'английской читательнице приз пришёл как ' || coalesce(v_prize, 'null');

  -- Приз без перевода остаётся русским у обеих: это та же строка, что видит тренер.
  perform pg_temp.as_super();
  update public.marathons set prize_en = null where id = v_club;
  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c4', 'lang-en@example.com');
  select m.prize into v_prize from public.my_marathons() m where m.id = v_club;
  assert v_prize = 'Час с тренером', 'без перевода приз должен остаться русским, пришло ' ||
    coalesce(v_prize, 'null');
end $$;

select pg_temp.as_super();

-- --- победитель недели: приз на языке того, кто его читает ---------------------
do $$
declare
  v_club  uuid := public.club_marathon(false);
  v_mem   uuid;
  v_prize text;
begin
  update public.marathons set prize_en = 'An hour with the coach' where id = v_club;
  select id into v_mem from public.marathon_members
  where marathon_id = v_club and email = 'lang-ru@example.com';

  insert into public.marathon_winners (marathon_id, week, member_id, note)
  values (v_club, 1, v_mem, 'Молодец')
  on conflict (marathon_id, week) do update set member_id = excluded.member_id;

  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c4', 'lang-en@example.com');
  select w.prize into v_prize from public.club_winner(false) w;
  assert v_prize = 'An hour with the coach',
    'в плашке победителя приз пришёл как ' || coalesce(v_prize, 'null');

  perform pg_temp.as_user('00000000-0000-0000-0000-0000000000c3', 'lang-ru@example.com');
  select w.prize into v_prize from public.club_winner(false) w;
  assert v_prize = 'Час с тренером',
    'русской читательнице в плашке победителя приз пришёл как ' || coalesce(v_prize, 'null');
end $$;

select pg_temp.as_super();

/*
 * Сообщение победителю уходит с обеими половинами: письмо кладёт в очередь тренер, а прочитает
 * его победитель, и язык у них разный. Выбор делает отправщик в момент отправки.
 */
do $$
declare v_params jsonb; begin
  select params into v_params from public.telegram_outbox
  where kind = 'weekly_winner' order by created_at desc limit 1;
  assert v_params is not null, 'сообщение победителю не встало в очередь';
  assert v_params ? 'prize', 'в очереди нет русского приза';
  assert v_params ? 'prize_en', 'в очереди нет английского приза';
  assert v_params ->> 'prize_en' = 'An hour with the coach',
    'английский приз в очереди: ' || coalesce(v_params ->> 'prize_en', 'null');
end $$;

-- --- аноним: язык русский, функции закрыты ------------------------------------
do $$
declare v_denied boolean := false; begin
  perform pg_temp.as_super();
  perform set_config('request.jwt.claims', '{}', false);
  set role anon;
  begin
    perform public.my_locale();
  exception when insufficient_privilege then
    v_denied := true;
  end;
  assert v_denied, 'my_locale() не должна быть открыта анониму';
end $$;

select pg_temp.as_super();
select 'ok: 87_reader_language' as result;
