-- =============================================================================
-- 0042 — «Обращения»: вопросы людей в тему группы владельца.
--
-- Тема «Обращения» заведена в 0040 и до сих пор пустая: `admin_outbox` её принимает,
-- `telegram-notify` умеет её назвать, а писать в неё некому. Здесь появляются два входа.
--
--   1. **Бот.** Человек пишет основному боту обычный текст, не команду. Раньше в ответ приходило
--      всё рекламное приветствие целиком — на «а можно заниматься с больным коленом?». Теперь
--      функция `telegram-bot` передаёт текст сюда (`support_from_telegram`, сервисным ключом) и
--      отвечает коротко: «Передали тренеру — он ответит тебе здесь, в Телеграме».
--   2. **Приложение.** Кнопка «Написать тренеру» на вкладке «Тренер» и в «Данных и согласиях»
--      открывает поле ввода и зовёт `support_message` от имени вошедшего человека. Это вход для
--      тех, кто пришёл с сайта, а не из телеграма, и чей телеграм мы не знаем.
--
-- ## Почему не выдать `enqueue_admin` наружу
--
-- 0040 закрыла её от всех намеренно: иначе канал владельца стал бы тем, что можно вызвать снаружи
-- с любой темой и любым текстом. Здесь две узкие двери вместо одной широкой: тема всегда
-- `support`, вид всегда `support_message`, текст режется по длине, частота — по человеку.
--
-- ## Частота
--
-- Не больше пяти обращений в час от одного человека (`SUPPORT_PER_HOUR` ниже, в двух местах).
-- Этого с запасом хватает, чтобы задать вопрос и дописать забытое, и не хватает, чтобы залить
-- тему, которую читают двое. Журнал частоты — `support_requests`: кто и когда, **без текста**.
-- Текст живёт только в очереди сообщений, откуда уходит в закрытую группу.
--
-- Боту важен ещё один ответ: «лимит только что кончился» отличается от «лимит давно кончился».
-- На первое бот один раз вежливо говорит «подожди немного», на второе молчит — иначе поток из
-- ста сообщений получил бы сто ответов, и защита от спама сама стала бы спамом.
--
-- ## Повтор доставки
--
-- Телеграм повторяет доставку, если функция не ответила вовремя. Ключ дедупликации для бота —
-- id чата и id сообщения, так что повтор не создаёт второго обращения и второго ответа.
--
-- Не деструктивна: новая таблица и две новые функции, ничего существующего не меняется.
-- Требует 0001_init.sql, 0026_telegram_link.sql, 0040_admin_channel.sql. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Журнал частоты. Кто и когда — и ничего больше.
-- -----------------------------------------------------------------------------
create table if not exists public.support_requests (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null check (channel in ('app', 'telegram')),
  -- Ровно одно из двух: вошедший в приложение человек или телеграм-аккаунт.
  user_id     uuid references auth.users (id) on delete cascade,
  telegram_id bigint,
  -- false — обращение не принято из-за частоты. Такая строка нужна, чтобы бот сказал «подожди»
  -- один раз, а не на каждое следующее сообщение.
  accepted    boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint support_requests_who check ((user_id is null) <> (telegram_id is null))
);

comment on table public.support_requests is
  'Rate-limit log for support messages (0042): who and when, never the text.';

create index if not exists support_requests_user_idx
  on public.support_requests (user_id, created_at)
  where user_id is not null;
create index if not exists support_requests_telegram_idx
  on public.support_requests (telegram_id, created_at)
  where telegram_id is not null;

alter table public.support_requests enable row level security;

-- Ни одной политики: читать это через API незачем никому. Пишут только функции ниже.
revoke all on public.support_requests from anon, authenticated;
grant select, insert, update, delete on public.support_requests to service_role;

-- -----------------------------------------------------------------------------
-- 2. Текст, который поместится в очередь.
--
-- `admin_outbox.params` ограничен 4096 байтами (0040). Длина в символах этого не гарантирует:
-- эмодзи — четыре байта, кириллица — два. Поэтому сначала тысяча символов, потом — пока не
-- влезет в 2800 байт, оставляя место остальным полям.
-- -----------------------------------------------------------------------------
create or replace function public.support_clip(p_text text)
returns text
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  v text := left(btrim(coalesce(p_text, '')), 1000);
begin
  while octet_length(v) > 2800 loop
    v := left(v, length(v) - 50);
  end loop;
  return v;
end;
$$;

revoke execute on function public.support_clip(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Из приложения: вошедший человек пишет тренеру.
--
-- Имя, почта и язык — из профиля, а не из аргументов: иначе в канал можно было бы написать от
-- чужого имени. Если к профилю привязан телеграм (0026), его id уходит в сообщение, и тренер
-- может ответить там; если нет — отвечают на почту.
--
-- Ошибки — короткими словами, которые приложение переводит (`src/lib/api/support.ts`):
--   text_empty, text_too_long, rate_limited.
-- -----------------------------------------------------------------------------
create or replace function public.support_message(p_text text, p_context text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_uid     uuid := auth.uid();
  v_text    text := btrim(coalesce(p_text, ''));
  v_recent  int;
  v_profile record;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if length(v_text) = 0 then
    raise exception 'text_empty';
  end if;
  -- Приложение режет на 1000 само; больше — значит пришло не из приложения.
  if length(v_text) > 1000 then
    raise exception 'text_too_long';
  end if;

  -- SUPPORT_PER_HOUR = 5.
  select count(*) into v_recent
  from public.support_requests r
  where r.user_id = v_uid
    and r.accepted
    and r.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'rate_limited';
  end if;

  select p.display_name, p.email::text as email, p.locale, p.telegram_id
    into v_profile
  from public.profiles p
  where p.id = v_uid;

  insert into public.support_requests (channel, user_id) values ('app', v_uid);

  perform public.enqueue_admin(
    'support',
    'support_message',
    'support:app:' || gen_random_uuid()::text,
    jsonb_build_object(
      'source', 'app',
      'name', left(coalesce(v_profile.display_name, ''), 60),
      'email', coalesce(v_profile.email, ''),
      'locale', coalesce(v_profile.locale, ''),
      'tgId', coalesce(v_profile.telegram_id::text, ''),
      'account', 'yes',
      'context', left(btrim(coalesce(p_context, '')), 80),
      'text', public.support_clip(v_text)
    )
  );
end;
$$;

revoke execute on function public.support_message(text, text) from public, anon;
grant execute on function public.support_message(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Из бота: человек написал основному боту в личку.
--
-- Зовёт только функция `telegram-bot` сервисным ключом: имя и @username приходят из апдейта
-- телеграма, подписанного секретом вебхука, и больше им взяться неоткуда.
--
-- Ответ — одно слово, по которому бот выбирает, что сказать человеку:
--   queued     — передано;
--   duplicate  — это повтор доставки того же сообщения, отвечать второй раз не нужно;
--   limited    — лимит только что кончился: один раз вежливо попросить подождать;
--   muted      — лимит кончился давно: молчать;
--   empty      — нечего передавать.
-- -----------------------------------------------------------------------------
create or replace function public.support_from_telegram(
  p_telegram_id bigint,
  p_message_id  bigint,
  p_name        text,
  p_username    text,
  p_locale      text,
  p_text        text,
  p_attachment  text default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_key      text;
  v_text     text := public.support_clip(p_text);
  v_recent   int;
  v_refused  int;
  v_email    text;
  v_username text := coalesce(substring(btrim(coalesce(p_username, '')) from '^@?([A-Za-z0-9_]{3,32})$'), '');
begin
  if p_telegram_id is null or p_telegram_id <= 0 then
    raise exception 'invalid_telegram_id';
  end if;
  if length(v_text) = 0 then
    return 'empty';
  end if;

  v_key := 'support:tg:' || p_telegram_id::text || ':' || coalesce(p_message_id::text, gen_random_uuid()::text);
  if exists (select 1 from public.admin_outbox o where o.dedupe_key = v_key) then
    return 'duplicate';
  end if;

  -- SUPPORT_PER_HOUR = 5.
  select count(*) filter (where r.accepted), count(*) filter (where not r.accepted)
    into v_recent, v_refused
  from public.support_requests r
  where r.telegram_id = p_telegram_id
    and r.created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    if v_refused > 0 then
      return 'muted';
    end if;
    insert into public.support_requests (channel, telegram_id, accepted)
    values ('telegram', p_telegram_id, false);
    return 'limited';
  end if;

  -- Есть ли у человека аккаунт в приложении — по привязанному телеграму (0026).
  select p.email::text into v_email
  from public.profiles p
  where p.telegram_id = p_telegram_id;

  insert into public.support_requests (channel, telegram_id) values ('telegram', p_telegram_id);

  perform public.enqueue_admin(
    'support',
    'support_message',
    v_key,
    jsonb_build_object(
      'source', 'telegram',
      'name', left(btrim(coalesce(p_name, '')), 60),
      'username', v_username,
      'tgId', p_telegram_id::text,
      'locale', left(coalesce(p_locale, ''), 8),
      'account', case when v_email is null then 'no' else 'yes' end,
      'email', coalesce(v_email, ''),
      'attachment', left(coalesce(p_attachment, ''), 20),
      'text', v_text
    )
  );
  return 'queued';
end;
$$;

revoke execute on function public.support_from_telegram(bigint, bigint, text, text, text, text, text)
  from public, anon, authenticated;
-- Явно, а не по умолчанию: функции, созданные через Management API, умолчаний Supabase не
-- получают (см. 0031).
grant execute on function public.support_from_telegram(bigint, bigint, text, text, text, text, text)
  to service_role;

notify pgrst, 'reload schema';
