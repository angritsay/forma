-- =============================================================================
-- profiles.telegram_id (0026) — столбец, который клиенту писать нельзя.
-- Запускать после 10_smoke.sql на той же базе.
--
-- Здесь ровно одно утверждение, и оно несёт всю схему безопасности связки:
-- **вошедший человек не может поставить себе telegram_id**. Если он это может,
-- он может назвать чужой номер — и увести на себя чужие уведомления, включая
-- сообщения об оплате. Тогда вся проверка подписи в edge-функции бессмысленна:
-- её просто обходят мимо.
--
-- Свойство держится колоночным грантом из 0001, который перечисляет разрешённые
-- поля поимённо, — то есть оно держится тем, что кто-то **не** дописал имя в
-- список. Такое ломается молча и при первой же правке соседней миграции; поэтому
-- тест, а не комментарий.
--
-- Заодно проверяется unique: один телеграм-аккаунт — не больше одного профиля.
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

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000b1', 'tg-one@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000b2', 'tg-two@example.com', '{}')
on conflict (id) do nothing;

-- --- клиент не может назначить себе телеграм ---------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1', 'tg-one@example.com');
do $$
declare v_blocked boolean := false; begin
  begin
    update public.profiles set telegram_id = 777001 where id = auth.uid();
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  assert v_blocked, 'вошедший не должен уметь писать telegram_id — иначе он назовёт чужой';

  -- И соседние поля по-прежнему пишутся: грант сужен, а не снят.
  update public.profiles set display_name = 'Настя' where id = auth.uid();
  assert (select display_name from public.profiles where id = auth.uid()) = 'Настя',
    'своё имя человек менять может';
end $$;

-- --- один телеграм — один профиль --------------------------------------------
select pg_temp.as_super();
do $$
declare v_unique boolean := false; begin
  update public.profiles set telegram_id = 777001 where email = 'tg-one@example.com';

  begin
    update public.profiles set telegram_id = 777001 where email = 'tg-two@example.com';
  exception when unique_violation then
    v_unique := true;
  end;
  assert v_unique, 'один телеграм-аккаунт не может стоять на двух профилях';

  -- Частичный индекс: null'ов может быть сколько угодно, иначе сайт перестал бы
  -- пускать второго человека без телеграма.
  update public.profiles set telegram_id = null where email in ('tg-one@example.com', 'tg-two@example.com');
  assert (select count(*) from public.profiles where telegram_id is null) >= 2,
    'непривязанных профилей может быть много';
end $$;

select 'ok 83_telegram_link';
