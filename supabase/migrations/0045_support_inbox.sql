-- =============================================================================
-- 0045 — «Обращения» в админке и ответ через бота; «Записи» к тренеру.
--
-- До сих пор обращение (0042) жило только сообщением в теме группы владельца: `support_requests`
-- помнила «кто и когда» ради частоты, а текст уходил в очередь и дальше в телеграм. Ответить
-- можно было только из своего аккаунта, и только тому, у кого есть @username. Здесь:
--
--   1. `support_requests` хранит само обращение: текст (до 1000 символов), имя, язык, @username,
--      id сообщения в чате с ботом, откуда написано в приложении, и статус «новое / отвечено /
--      закрыто» с ответом, кто и когда ответил.
--   2. `support_message` и `support_from_telegram` пересозданы с теми же аргументами и правами —
--      они просто записывают текст в строку, которую и так вставляли.
--   3. Очередь бота людям (`telegram_outbox`, 0027) умеет адресата по id чата: у написавшего боту
--      может не быть аккаунта в приложении, а значит и почты. Новая колонка `chat_id`, почта
--      становится необязательной (одно из двух обязательно), вид `support_reply`, место под текст
--      ответа в `params`. `telegram_outbox_due` отдаёт и такие строки — возвращаемые колонки те же.
--   4. Админские функции: `admin_support_list`, `admin_support_set_status`, `admin_support_reply`.
--      Ответ не отправляется из базы — он ставится в очередь, и `telegram-notify` приносит его
--      человеку в чат с ботом с подписью «Ответ тренера:» на его языке.
--   5. `admin_coach_bookings(scope)` — записи к тренеру для экрана «Записи».
--
-- ## Почему ответ идёт через очередь, а не прямо из админки
--
-- Токена бота нет ни в базе, ни в приложении — он секрет edge-функций (довод 0027). Очередь уже
-- умеет всё остальное: повтор при 429, «человек заблокировал бота» → `skipped`, срок жизни.
-- Цена — до десяти минут до доставки (расписание `telegram-notify`); экран так и говорит.
--
-- ## Частота ответов
--
-- Не больше 60 ответов в час на всех (`SUPPORT_REPLIES_PER_HOUR` ниже) — чтобы случайный цикл или
-- чужой украденный вход админа не превратил бота в рассылку. Один и тот же текст на одно обращение
-- второй раз не ставится (ключ дедупликации — хеш текста): двойное нажатие не даёт двух сообщений.
--
-- Не деструктивна: новые колонки и функции; `telegram_outbox.email` теряет `not null` (вместо него —
-- «почта или чат»), ограничение `params` расширено с 2048 до 4096 байт, к видам добавлен один.
-- Список видов дополняется, а не переписывается: он читается из действующего ограничения, так что
-- вид, добавленный соседней миграцией, не теряется. Старые обращения без текста помечаются
-- «закрыто» — показывать в «Новых» пустые карточки незачем.
-- Требует 0001, 0014, 0026, 0027, 0040, 0042, 0043. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Само обращение.
-- -----------------------------------------------------------------------------
alter table public.support_requests add column if not exists text text;
alter table public.support_requests add column if not exists name text;
alter table public.support_requests add column if not exists lang text;
alter table public.support_requests add column if not exists telegram_username text;
alter table public.support_requests add column if not exists telegram_message_id bigint;
alter table public.support_requests add column if not exists context text;
alter table public.support_requests add column if not exists attachment text;
alter table public.support_requests add column if not exists status text not null default 'new';
alter table public.support_requests add column if not exists answered_at timestamptz;
alter table public.support_requests add column if not exists answered_by citext;
alter table public.support_requests add column if not exists reply_text text;
-- Последний ответ в очереди бота: по нему экран показывает «дошло / ждёт / не дошло».
alter table public.support_requests add column if not exists reply_outbox_id uuid;

alter table public.support_requests drop constraint if exists support_requests_status_check;
alter table public.support_requests add constraint support_requests_status_check
  check (status in ('new', 'answered', 'closed'));
alter table public.support_requests drop constraint if exists support_requests_text_len;
alter table public.support_requests add constraint support_requests_text_len
  check (text is null or length(text) <= 1000) not valid;
alter table public.support_requests drop constraint if exists support_requests_reply_len;
alter table public.support_requests add constraint support_requests_reply_len
  check (reply_text is null or length(reply_text) <= 1000) not valid;
alter table public.support_requests drop constraint if exists support_requests_small_fields;
alter table public.support_requests add constraint support_requests_small_fields
  check (
    (name is null or length(name) <= 60)
    and (lang is null or length(lang) <= 8)
    and (context is null or length(context) <= 80)
    and (attachment is null or length(attachment) <= 20)
    and (telegram_username is null or telegram_username ~ '^[A-Za-z0-9_]{3,32}$')
  ) not valid;

comment on table public.support_requests is
  'Support messages (0042, text since 0045): who, when, what, and whether it was answered. Also the rate-limit log.';

-- Обращения до 0045 текста не имеют; в «Новых» им делать нечего.
update public.support_requests
   set status = 'closed'
 where text is null and status = 'new';

create index if not exists support_requests_inbox_idx
  on public.support_requests (status, created_at desc)
  where accepted;

-- -----------------------------------------------------------------------------
-- 2. Из приложения — то же, что в 0042, плюс текст в строке.
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
  v_clip    text;
  v_context text := left(btrim(coalesce(p_context, '')), 80);
  v_recent  int;
  v_profile record;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if length(v_text) = 0 then
    raise exception 'text_empty';
  end if;
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

  v_clip := public.support_clip(v_text);

  insert into public.support_requests (channel, user_id, text, name, lang, context)
  values (
    'app',
    v_uid,
    v_clip,
    nullif(left(btrim(coalesce(v_profile.display_name, '')), 60), ''),
    nullif(left(coalesce(v_profile.locale::text, ''), 8), ''),
    nullif(v_context, '')
  );

  perform public.enqueue_admin(
    'support',
    'support_message',
    'support:app:' || gen_random_uuid()::text,
    jsonb_build_object(
      'source', 'app',
      'name', left(coalesce(v_profile.display_name, ''), 60),
      'email', coalesce(v_profile.email, ''),
      'locale', coalesce(v_profile.locale::text, ''),
      'tgId', coalesce(v_profile.telegram_id::text, ''),
      'account', 'yes',
      'context', v_context,
      'text', v_clip
    )
  );
end;
$$;

revoke execute on function public.support_message(text, text) from public, anon;
grant execute on function public.support_message(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Из бота — то же, что в 0042, плюс текст, имя, @username, язык и id сообщения в строке.
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
  v_name     text := left(btrim(coalesce(p_name, '')), 60);
  v_locale   text := left(coalesce(p_locale, ''), 8);
  v_attach   text := left(coalesce(p_attachment, ''), 20);
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

  select p.email::text into v_email
  from public.profiles p
  where p.telegram_id = p_telegram_id;

  insert into public.support_requests (
    channel, telegram_id, text, name, lang, telegram_username, telegram_message_id, attachment
  )
  values (
    'telegram',
    p_telegram_id,
    v_text,
    nullif(v_name, ''),
    nullif(v_locale, ''),
    nullif(v_username, ''),
    case when p_message_id > 0 then p_message_id end,
    nullif(v_attach, '')
  );

  perform public.enqueue_admin(
    'support',
    'support_message',
    v_key,
    jsonb_build_object(
      'source', 'telegram',
      'name', v_name,
      'username', v_username,
      'tgId', p_telegram_id::text,
      'locale', v_locale,
      'account', case when v_email is null then 'no' else 'yes' end,
      'email', coalesce(v_email, ''),
      'attachment', v_attach,
      'text', v_text
    )
  );
  return 'queued';
end;
$$;

revoke execute on function public.support_from_telegram(bigint, bigint, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.support_from_telegram(bigint, bigint, text, text, text, text, text)
  to service_role;

-- -----------------------------------------------------------------------------
-- 4. Очередь бота: адресат по id чата.
-- -----------------------------------------------------------------------------
alter table public.telegram_outbox add column if not exists chat_id bigint;
alter table public.telegram_outbox alter column email drop not null;
alter table public.telegram_outbox drop constraint if exists telegram_outbox_recipient;
alter table public.telegram_outbox add constraint telegram_outbox_recipient
  check (email is not null or (chat_id is not null and chat_id > 0));

-- Ответ до 1000 символов кириллицей — это 2000 байт одного текста; 2048 на всё не хватало.
alter table public.telegram_outbox drop constraint if exists telegram_outbox_params_check;
alter table public.telegram_outbox add constraint telegram_outbox_params_check
  check (octet_length(params::text) <= 4096);

/*
 * Вид `support_reply` — дописывается к тому, что уже разрешено.
 *
 * Список читается из действующего ограничения, а не переписывается целиком: соседняя миграция
 * того же дня может добавить свой вид, и переписанный здесь список молча бы его выкинул.
 */
do $$
declare
  v_def   text;
  v_kinds text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
  from pg_constraint c
  where c.conrelid = 'public.telegram_outbox'::regclass
    and c.conname = 'telegram_outbox_kind_check';

  -- Оба вида записи: `ARRAY['a'::text, 'b'::text]` и `'{a,b}'::text[]` (так пишет этот блок).
  select coalesce(array_agg(distinct k), '{}')
    into v_kinds
  from regexp_matches(coalesce(v_def, ''), '''([^'']*)''', 'g') as m,
       lateral unnest(string_to_array(btrim(m[1], '{}'), ',')) as k
  where k ~ '^[a-z][a-z0-9_]*$';

  v_kinds := v_kinds || array['course_paid', 'subscription_paid', 'workout_assigned',
                              'weekly_winner', 'support_reply'];
  select array_agg(distinct k order by k) into v_kinds from unnest(v_kinds) as k;

  execute 'alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check';
  execute format(
    'alter table public.telegram_outbox add constraint telegram_outbox_kind_check check (kind = any (%L::text[]))',
    v_kinds
  );
end $$;

/*
 * Та же функция 0043, те же колонки ответа. Разница одна: строка с `chat_id` отдаётся сразу, с ним
 * как `telegram_id`, — искать получателя по почте ей не нужно. Язык у такой строки — тот, на
 * котором человек написал (`params.locale`), и только без него — язык профиля.
 */
create or replace function public.telegram_outbox_due(p_limit int default 50)
returns table (
  id          uuid,
  email       text,
  kind        text,
  params      jsonb,
  attempts    int,
  expires_at  timestamptz,
  telegram_id bigint,
  locale      text
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select o.id, o.email::text, o.kind, o.params, o.attempts, o.expires_at,
         coalesce(o.chat_id, p.telegram_id),
         case
           when o.chat_id is not null then coalesce(nullif(o.params ->> 'locale', ''), p.locale::text)
           else p.locale::text
         end
  from public.telegram_outbox o
  left join lateral (
    select pr.telegram_id, pr.locale
    from public.profiles pr
    where (o.chat_id is null and pr.email = o.email and pr.telegram_id is not null)
       or (o.chat_id is not null and pr.telegram_id = o.chat_id)
    limit 1
  ) p on true
  where o.status = 'pending'
    and o.send_after <= now()
    and o.expires_at >= now()
    and (o.chat_id is not null or p.telegram_id is not null)
  order by o.send_after
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

revoke execute on function public.telegram_outbox_due(int) from public, anon, authenticated;
grant execute on function public.telegram_outbox_due(int) to service_role;

-- -----------------------------------------------------------------------------
-- 5. Админка: список обращений.
--
-- `p_status`: 'new' — новые; 'answered' — отвеченные и закрытые; 'all' — все. Отказанные по
-- частоте (`accepted = false`) не показываются никогда: в них нет текста.
-- `total` — сколько всего строк под этим фильтром, для счётчика на вкладке.
-- `reply_status` — что с последним ответом в очереди бота: pending / sent / skipped / failed.
-- -----------------------------------------------------------------------------
create or replace function public.admin_support_list(
  p_status text default 'new',
  p_limit  int  default 50,
  p_offset int  default 0
)
returns table (
  id                uuid,
  created_at        timestamptz,
  channel           text,
  status            text,
  name              text,
  email             text,
  telegram_id       bigint,
  telegram_username text,
  lang              text,
  context           text,
  text              text,
  attachment        text,
  answered_at       timestamptz,
  answered_by       text,
  reply_text        text,
  reply_status      text,
  can_reply         boolean,
  total             bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_status text := coalesce(p_status, 'new');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_status not in ('new', 'answered', 'all') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  return query
  select r.id, r.created_at, r.channel, r.status,
         coalesce(r.name, pr.display_name)::text,
         pr.email::text,
         coalesce(r.telegram_id, pr.telegram_id),
         r.telegram_username,
         coalesce(r.lang, pr.locale::text),
         r.context, r.text, r.attachment,
         r.answered_at, r.answered_by::text, r.reply_text,
         o.status,
         (coalesce(r.telegram_id, pr.telegram_id) is not null or pr.email is not null),
         count(*) over ()
  from public.support_requests r
  left join lateral (
    select p.display_name, p.email, p.telegram_id, p.locale
    from public.profiles p
    where (r.user_id is not null and p.id = r.user_id)
       or (r.user_id is null and p.telegram_id = r.telegram_id)
    limit 1
  ) pr on true
  left join public.telegram_outbox o on o.id = r.reply_outbox_id
  where r.accepted
    and (
      v_status = 'all'
      or (v_status = 'new' and r.status = 'new')
      or (v_status = 'answered' and r.status in ('answered', 'closed'))
    )
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke execute on function public.admin_support_list(text, int, int) from public, anon;
grant execute on function public.admin_support_list(text, int, int) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Админка: статус руками — «отметить отвеченным», «закрыть», «вернуть в новые».
-- -----------------------------------------------------------------------------
create or replace function public.admin_support_set_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('new', 'answered', 'closed') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  update public.support_requests r
     set status      = p_status,
         answered_at = case when p_status = 'new' then null else coalesce(r.answered_at, now()) end,
         answered_by = case when p_status = 'new' then null
                            else coalesce(r.answered_by, public.current_email()) end
   where r.id = p_id and r.accepted;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.admin_support_set_status(uuid, text) from public, anon;
grant execute on function public.admin_support_set_status(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. Админка: ответить.
--
-- Куда: в чат с ботом — по id из обращения (написал боту) или из профиля (написал из приложения
-- и привязал телеграм). Если телеграма нет вовсе, строка встаёт в очередь по почте и уйдёт, когда
-- человек откроет приложение из телеграма (0026), — не дольше недели.
--
-- Ответ одним словом: `sent` — в очереди с адресатом, уйдёт в ближайший запуск рассыльщика;
-- `waiting` — адресата в телеграме пока нет. Ошибки: text_empty, text_too_long, not_found,
-- no_address, rate_limited.
-- -----------------------------------------------------------------------------
create or replace function public.admin_support_reply(p_id uuid, p_text text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_text    text := btrim(coalesce(p_text, ''));
  v_clip    text;
  v_req     public.support_requests%rowtype;
  v_email   citext;
  v_chat    bigint;
  v_locale  text;
  v_recent  int;
  v_key     text;
  v_outbox  uuid;
  v_params  jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if length(v_text) = 0 then
    raise exception 'text_empty' using errcode = 'P0001';
  end if;
  if length(v_text) > 1000 then
    raise exception 'text_too_long' using errcode = 'P0001';
  end if;

  select * into v_req from public.support_requests r where r.id = p_id and r.accepted;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  -- SUPPORT_REPLIES_PER_HOUR = 60, на всех.
  select count(*) into v_recent
  from public.telegram_outbox o
  where o.kind = 'support_reply'
    and o.created_at > now() - interval '1 hour';
  if v_recent >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select p.email, p.telegram_id, p.locale::text
    into v_email, v_chat, v_locale
  from public.profiles p
  where (v_req.user_id is not null and p.id = v_req.user_id)
     or (v_req.user_id is null and p.telegram_id = v_req.telegram_id)
  limit 1;

  v_chat := coalesce(v_req.telegram_id, v_chat);
  v_locale := coalesce(v_req.lang, v_locale, 'ru');
  if v_chat is null and v_email is null then
    raise exception 'no_address' using errcode = 'P0001';
  end if;

  v_clip := public.support_clip(v_text);
  v_params := jsonb_build_object('text', v_clip, 'locale', left(v_locale, 8));
  -- Ответ цитирует вопрос в чате с ботом — только если вопрос был задан там.
  if v_req.channel = 'telegram' and v_req.telegram_message_id is not null then
    v_params := v_params || jsonb_build_object('replyTo', v_req.telegram_message_id);
  end if;

  v_key := 'support_reply:' || v_req.id::text || ':' || md5(v_clip);

  insert into public.telegram_outbox (email, chat_id, kind, params, send_after, expires_at, dedupe_key)
  values (v_email, v_chat, 'support_reply', v_params, now(), now() + interval '7 days', v_key)
  on conflict (dedupe_key) do nothing
  returning id into v_outbox;

  if v_outbox is null then
    select o.id into v_outbox from public.telegram_outbox o where o.dedupe_key = v_key;
  end if;

  update public.support_requests r
     set status          = 'answered',
         answered_at     = now(),
         answered_by     = public.current_email(),
         reply_text      = v_clip,
         reply_outbox_id = v_outbox
   where r.id = v_req.id;

  return case when v_chat is null then 'waiting' else 'sent' end;
end;
$$;

revoke execute on function public.admin_support_reply(uuid, text) from public, anon;
grant execute on function public.admin_support_reply(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Админка: записи к тренеру.
--
-- `p_scope`: 'upcoming' — не отменённые и ещё не закончившиеся, ближайшие первыми; 'past' —
-- не отменённые и прошедшие, последние первыми; 'cancelled' — отменённые, последние первыми.
-- Имя — из профиля по почте записи, если такой профиль есть.
-- -----------------------------------------------------------------------------
create or replace function public.admin_coach_bookings(p_scope text default 'upcoming')
returns table (
  id            uuid,
  starts_at     timestamptz,
  ends_at       timestamptz,
  status        text,
  source        text,
  event_name    text,
  email         text,
  name          text,
  join_url      text,
  location_text text,
  cancel_reason text,
  created_at    timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_scope text := coalesce(p_scope, 'upcoming');
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if v_scope not in ('upcoming', 'past', 'cancelled') then
    raise exception 'invalid_scope' using errcode = 'P0001';
  end if;

  return query
  select b.id, b.starts_at, b.ends_at, b.status, b.source, b.event_name,
         b.email::text,
         (select p.display_name from public.profiles p where p.email = b.email limit 1)::text,
         b.join_url, b.location_text, b.cancel_reason, b.created_at
  from public.coach_bookings b
  where case v_scope
          when 'upcoming' then b.status = 'active' and b.ends_at > now()
          when 'past' then b.status = 'active' and b.ends_at <= now()
          else b.status = 'cancelled'
        end
  order by
    case when v_scope = 'upcoming' then b.starts_at end asc,
    b.starts_at desc
  limit 200;
end;
$$;

revoke execute on function public.admin_coach_bookings(text) from public, anon;
grant execute on function public.admin_coach_bookings(text) to authenticated;

notify pgrst, 'reload schema';
