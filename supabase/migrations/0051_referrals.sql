-- =============================================================================
-- 0051 — рефералы: «+30 дней тебе и другу».
--
-- Владелец: «Очень важен реферальный аспект… надо увеличить LTV». Клуб живёт на подписке, а
-- подписку продают не баннеры, а подруга, которая уже в клубе. Её решение — **бесплатный месяц
-- обоим**: тому, кто позвал, и тому, кто пришёл и оплатил.
--
-- ## Три факта, три таблицы-с-половиной
--
--   1. `referral_codes` — у человека один код, короткий и в ссылке (`?startapp=ref_<код>`,
--      `#/ref/<код>`). Заводится при первом «поделиться» и больше не меняется: отправленная
--      вчера ссылка обязана работать сегодня.
--   2. `referrals` — кто по чьему коду пришёл. Ключ — почта пришедшего, и это весь механизм
--      «первый код побеждает»: вторая ссылка от другой подруги просто не вставится. Живёт на
--      почте, как покупки и как приглашения в пару (0011, 0034): пришедшая ещё ничего не купила.
--   3. Награда — момент, когда строка пришедшей в `subscriptions` **становится оплаченной**.
--      Это триггер на `subscriptions`, а не правка функций оплаты: путей к «доступ открылся»
--      несколько (вебхук, админка, SQL-редактор), и дописывать вызов в каждый значит однажды
--      забыть один — ровно довод 0027.
--
-- ## Награда — before, а не after
--
-- Дни подруге добавляются в **той же** строке, которую пишет оплата: триггер `before` правит
-- `new.expires_at`, и запись одна. После неё срабатывают 0027 и 0040 и видят уже продлённую
-- дату — одно «оплата дошла» подруге, одно «клуб оплачен» в канал. Триггер `after` с
-- отдельным `update` дал бы подруге два сообщения об оплате, а в канал — «продлён» вместо
-- «оплачен» на первой же покупке.
--
-- Дни позвавшей — отдельная запись в её строку, и её 0027/0040 тоже видят: «оплата дошла —
-- клуб открыт» человеку, который ничего не платил, — ложь, поэтому ровно эти две записи
-- (ключи известны) снимаются из очередей здесь же. Вместо них уходит своё сообщение
-- `referral_reward` обоим и `referral_paid` в тему «Клуб».
--
-- ## Что не награда
--
--   * Подписка от самой награды (`source = 'referral'`). Иначе цепочка: А позвала Б, Б позвала
--     В; В оплатила → Б получила месяц → строка Б стала активной → А получила месяц за Б, которая
--     не платила.
--   * Кто уже был в клубе. `referral_attach` не привязывает того, у кого подписка когда-либо
--     была активна: он не новый клиент, и это защита от «оформи по моей ссылке, продлишься
--     бесплатно».
--   * Тринадцатая за год. Больше двенадцати наград позвавшей за скользящий год — подруга своё
--     получает, позвавшая нет. Иначе один код в объявлении превращается в бесконечную подписку.
--
-- ## Пара
--
-- Если обе в дуо-клубе, то после оплаты они в одной паре — выбранной, не автоматической
-- (`club_duo_pair(..., false)`), и автоматическая у любой из них уступает, как задумано в 0034.
-- Подруга в клуб заводится здесь же, как в `club_invite_redeem`: она только что оплатила и
-- вкладку ещё не открывала. Сбой пары не ломает награду — свой `exception` блок.
--
-- ## Безопасность
--
-- Обе таблицы закрыты наглухо (RLS без политик): в них чужие адреса. Наружу — четыре функции,
-- и ни одна не возвращает почту: свой код, «привязаться к коду», три числа, «подтолкнуть
-- напарника». Награду начисляет только триггер; `referral_reward` не выдана никому. Ничего в
-- этой миграции не ломает оплату: всё, что уведомляет и сводит пары, обёрнуто в `exception
-- when others then null`, как в 0040.
--
-- Требует 0005_subscriptions.sql, 0027_telegram_outbox.sql, 0034_club_pairs.sql,
-- 0040_admin_channel.sql, 0045_support_inbox.sql. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Коды и привязки.
-- -----------------------------------------------------------------------------
create table if not exists public.referral_codes (
  code        text primary key check (code ~ '^[a-z0-9]{8}$'),
  owner_email citext not null unique check (length(owner_email::text) <= 254),
  created_at  timestamptz not null default now()
);

comment on table public.referral_codes is
  'One referral code per person (0051). The code is what travels in the link; it never changes.';

create table if not exists public.referrals (
  -- Кто пришёл. Первичный ключ и есть правило «первый код побеждает».
  referred_email citext primary key check (length(referred_email::text) <= 254),
  code           text not null references public.referral_codes (code),
  attached_at    timestamptz not null default now(),
  rewarded_at    timestamptz,
  -- Сколько дней получает пришедшая. Позвавшая — `owner_days`: ноль, если лимит за год исчерпан.
  reward_days    int not null default 30 check (reward_days between 1 and 365),
  owner_days     int not null default 0 check (owner_days between 0 and 365)
);

comment on table public.referrals is
  'Who came by whose code (0051). Keyed on the newcomer''s email: the first code wins, and the reward is paid once.';

create index if not exists referrals_code_idx on public.referrals (code);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
revoke all on public.referral_codes from anon, authenticated;
revoke all on public.referrals from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Свой код. Заводится при первом вызове, дальше тот же.
--
-- Восемь знаков из `[a-z0-9]` — 36^8 ≈ 2.8 триллиона: столкновение практически невозможно, а
-- если случится, вставка упадёт на первичном ключе и цикл возьмёт следующий. Остаток от деления
-- байта на 36 чуть неровен (256 = 7·36 + 4) — для кода, который не секрет, а адрес, это ничего.
-- -----------------------------------------------------------------------------
create or replace function public.my_referral_code()
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email    citext := public.current_email();
  v_code     text;
  v_bytes    bytea;
  v_alphabet constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;

  select c.code into v_code from public.referral_codes c where c.owner_email = v_email;
  if v_code is not null then
    return v_code;
  end if;

  for v_i in 1..10 loop
    v_bytes := gen_random_bytes(8);
    v_code := '';
    for v_j in 0..7 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_j) % 36) + 1, 1);
    end loop;
    begin
      insert into public.referral_codes (code, owner_email) values (v_code, v_email);
      return v_code;
    exception when unique_violation then
      -- Либо код совпал, либо второй вызов того же человека успел раньше: тогда его код и отдаём.
      select c.code into v_code from public.referral_codes c where c.owner_email = v_email;
      if v_code is not null then
        return v_code;
      end if;
    end;
  end loop;

  raise exception 'code_exhausted' using errcode = 'P0001';
end;
$$;

revoke execute on function public.my_referral_code() from public, anon;
grant execute on function public.my_referral_code() to authenticated;

comment on function public.my_referral_code() is
  'The caller''s referral code, created on first call (0051). Idempotent.';

-- -----------------------------------------------------------------------------
-- 3. Привязаться к коду.
--
-- Ошибками — только то, что человек может исправить: код не тот (`invalid_code`) или свой
-- (`own_code`). Всё остальное — молча: у него уже есть код (первый побеждает) или он уже был в
-- клубе (не новый клиент). Экран об этом не говорит, потому что человек не нажимал ничего: код
-- приехал вместе со ссылкой, и «не получилось» здесь не на что ответить.
-- -----------------------------------------------------------------------------
create or replace function public.referral_attach(p_code text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_code  text   := lower(btrim(coalesce(p_code, '')));
  v_owner citext;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if v_code !~ '^[a-z0-9]{8}$' then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;

  select c.owner_email into v_owner from public.referral_codes c where c.code = v_code;
  if v_owner is null then
    raise exception 'invalid_code' using errcode = 'P0001';
  end if;
  if v_owner = v_email then
    raise exception 'own_code' using errcode = 'P0001';
  end if;

  -- Уже пришёл по чьему-то коду: первый побеждает.
  if exists (select 1 from public.referrals r where r.referred_email = v_email) then
    return;
  end if;
  -- Уже был в клубе — не новый клиент. Незавершённое намерение (`pending`, 0005) не считается:
  -- человек открыл форму оплаты, но не платил.
  if exists (
    select 1 from public.subscriptions s
    where s.email = v_email
      and (s.status <> 'pending' or s.started_at is not null)
  ) then
    return;
  end if;

  insert into public.referrals (referred_email, code)
  values (v_email, v_code)
  on conflict (referred_email) do nothing;
end;
$$;

revoke execute on function public.referral_attach(text) from public, anon;
grant execute on function public.referral_attach(text) to authenticated;

comment on function public.referral_attach(text) is
  'Attach the caller to a referral code (0051). Silent when already attached or already a customer; invalid_code / own_code otherwise.';

-- -----------------------------------------------------------------------------
-- 4. Что показать на экране «Позови друга»: три числа, ни одной почты.
-- -----------------------------------------------------------------------------
create or replace function public.my_referrals()
returns table (attached int, rewarded int, days_earned int)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    count(*)::int,
    count(r.rewarded_at)::int,
    coalesce(sum(r.owner_days) filter (where r.rewarded_at is not null), 0)::int
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where c.owner_email = public.current_email();
$$;

revoke execute on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;

comment on function public.my_referrals() is
  'How many came by the caller''s code, how many paid, how many days that earned (0051). Counts only.';

-- -----------------------------------------------------------------------------
-- 5. Виды сообщений бота: награда и «подтолкнуть напарника».
--
-- Список читается из действующего ограничения и дописывается, а не переписывается (0045).
-- -----------------------------------------------------------------------------
do $$
declare
  v_def   text;
  v_kinds text[];
begin
  select pg_get_constraintdef(c.oid) into v_def
  from pg_constraint c
  where c.conrelid = 'public.telegram_outbox'::regclass
    and c.conname = 'telegram_outbox_kind_check';

  select coalesce(array_agg(distinct k), '{}')
    into v_kinds
  from regexp_matches(coalesce(v_def, ''), '''([^'']*)''', 'g') as m,
       lateral unnest(string_to_array(btrim(m[1], '{}'), ',')) as k
  where k ~ '^[a-z][a-z0-9_]*$';

  v_kinds := v_kinds || array['course_paid', 'subscription_paid', 'workout_assigned',
                              'weekly_winner', 'support_reply',
                              'referral_reward', 'duo_nudge'];
  select array_agg(distinct k order by k) into v_kinds from unnest(v_kinds) as k;

  execute 'alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check';
  execute format(
    'alter table public.telegram_outbox add constraint telegram_outbox_kind_check check (kind = any (%L::text[]))',
    v_kinds
  );
end $$;

-- -----------------------------------------------------------------------------
-- 6. Награда.
--
-- Зовётся только триггером ниже, с почтой пришедшей и её строкой подписки, которую он как раз
-- пишет. Возвращает, на сколько дней продлить эту строку: ноль — награды нет.
--
-- Порядок внутри — от важного к необязательному. Сначала отметка «награждено» и дни позвавшей:
-- это данные. Потом сообщения и пара: это зеркало, и каждое в своём `exception` блоке, чтобы
-- трещина в зеркале не стоила оплаты (0040).
-- -----------------------------------------------------------------------------
create or replace function public.referral_reward(p_email citext)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ref        record;
  v_owner      citext;
  v_days       int;
  v_year       int;
  v_owner_days int;
  v_os         public.subscriptions%rowtype;
  v_oid        uuid;
  v_oexp       timestamptz;
  v_key        text;
  v_club       uuid;
  v_id         uuid;
  v_om         record;
  v_fm         record;
begin
  select r.referred_email, r.reward_days, c.owner_email
    into v_ref
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where r.referred_email = p_email and r.rewarded_at is null
  for update of r;

  if v_ref.referred_email is null then
    return 0;
  end if;
  v_owner := v_ref.owner_email;
  v_days  := v_ref.reward_days;

  -- Лимит позвавшей: двенадцать наград за скользящий год.
  select count(*) into v_year
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where c.owner_email = v_owner
    and r.owner_days > 0
    and r.rewarded_at > now() - interval '1 year';
  v_owner_days := case when v_year < 12 then v_days else 0 end;

  update public.referrals
     set rewarded_at = now(), owner_days = v_owner_days
   where referred_email = p_email;

  -- Дни позвавшей: продлить живую подписку, иначе завести (или оживить) строку на месяц.
  if v_owner_days > 0 then
    select * into v_os from public.subscriptions s where s.email = v_owner;
    if found and public.subscription_live(v_os.status, v_os.expires_at) then
      update public.subscriptions
         set expires_at = expires_at + make_interval(days => v_owner_days),
             updated_at = now()
       where email = v_owner
      returning id, expires_at into v_oid, v_oexp;
    else
      insert into public.subscriptions (email, plan, status, started_at, expires_at, source, note)
      values (v_owner, 'annual', 'active', now(), now() + make_interval(days => v_owner_days),
              'referral', 'referral')
      on conflict (email) do update
        set plan       = 'annual',
            status     = 'active',
            started_at = coalesce(public.subscriptions.started_at, excluded.started_at),
            expires_at = excluded.expires_at,
            source     = 'referral',
            note       = 'referral',
            updated_at = now()
      returning id, expires_at into v_oid, v_oexp;
    end if;

    -- Та запись только что сказала позвавшей «оплата дошла» (0027) и владельцу «клуб оплачен /
    -- продлён» (0040). Она не платила — эти две строки снимаются, своё сообщение идёт ниже.
    begin
      v_key := v_oid::text || ':' || coalesce(v_oexp::text, 'none');
      delete from public.telegram_outbox
       where dedupe_key = 'subscription_paid:' || v_key and status = 'pending';
      delete from public.admin_outbox
       where dedupe_key in ('club_paid:' || v_key, 'club_renewed:' || v_key) and status = 'pending';
    exception when others then
      null;
    end;
  end if;

  -- Сообщения обоим и в канал. Ключ — по хэшу почты: адрес длиной до 254 не влезает в 200.
  begin
    perform public.enqueue_telegram(
      p_email::text,
      'referral_reward',
      'referral_reward:' || md5(lower(p_email::text)) || ':friend',
      jsonb_build_object('role', 'friend', 'days', v_days),
      now(),
      interval '7 days'
    );
    perform public.enqueue_telegram(
      v_owner::text,
      'referral_reward',
      'referral_reward:' || md5(lower(p_email::text)) || ':owner',
      jsonb_build_object('role', 'owner', 'days', v_owner_days),
      now(),
      interval '7 days'
    );
    perform public.enqueue_admin(
      'club',
      'referral_paid',
      'referral_paid:' || md5(lower(p_email::text)),
      jsonb_build_object(
        'inviter', v_owner::text,
        'friend', p_email::text,
        'days', v_days,
        'inviterDays', v_owner_days
      )
    );
  exception when others then
    null;
  end;

  -- Пара: обе в дуо-клубе — значит вместе. Подруга заводится в оба круга, как в `join_club`.
  begin
    v_club := public.club_marathon(true);
    if v_club is not null then
      foreach v_id in array array[public.club_marathon(false), v_club] loop
        continue when v_id is null;
        insert into public.marathon_members (marathon_id, email, status)
        values (v_id, p_email, 'active')
        on conflict (marathon_id, email) do nothing;
      end loop;

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_om
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = v_owner and m.status = 'active';

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_fm
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = p_email and m.status = 'active';

      -- Автоматическая пара — не выбор, и уступает выбранной (0034). Выбранная остаётся.
      if v_om.id is not null and v_fm.id is not null
         and (v_om.team_id is null or v_om.is_auto)
         and (v_fm.team_id is null or v_fm.is_auto) then
        perform public.club_duo_pair(v_club, v_om.id, v_fm.id, false);
      end if;
    end if;
  exception when others then
    null;
  end;

  return v_days;
end;
$$;

revoke execute on function public.referral_reward(citext) from public, anon, authenticated;

comment on function public.referral_reward(citext) is
  'Pay the referral reward for this newcomer''s first club payment (0051). Trigger-only; returns the days to add to the newcomer''s row.';

-- -----------------------------------------------------------------------------
-- 7. Триггер: строка подписки становится оплаченной.
--
-- `before`, чтобы дни подруги легли в ту же запись (см. шапку). Условие — то же, что у 0027:
-- вставка активной, переход в активную или новая дата окончания; повторная доставка того же
-- вебхука повода не даёт. Подписка от самой награды (`source = 'referral'`) — не оплата.
-- -----------------------------------------------------------------------------
create or replace function public.referrals_reward()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_days int := 0;
begin
  if new.status = 'active'
     and new.expires_at is not null
     and coalesce(new.source, '') <> 'referral'
     and (tg_op = 'INSERT'
          or coalesce(old.status, '') <> 'active'
          or old.expires_at is distinct from new.expires_at)
     and exists (
       select 1 from public.referrals r
       where r.referred_email = new.email and r.rewarded_at is null
     ) then
    begin
      v_days := coalesce(public.referral_reward(new.email), 0);
    exception when others then
      -- Награда не стоит оплаты (0040). Строка останется ненаграждённой, и это видно в таблице.
      v_days := 0;
    end;
    if v_days > 0 then
      new.expires_at := new.expires_at + make_interval(days => v_days);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists referrals_reward on public.subscriptions;
create trigger referrals_reward
  before insert or update of status, expires_at on public.subscriptions
  for each row execute function public.referrals_reward();

-- -----------------------------------------------------------------------------
-- 8. Подтолкнуть напарника: «{имя} уже сделал(а) задание — твоя очередь».
--
-- Раз в день в каждую сторону: ключ — пара, кто толкает и дата. Живёт сутки: напоминание про
-- сегодняшнее задание, доехавшее завтра, — недоумение (0027).
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_nudge()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid   := public.club_marathon(true);
  v_me    record;
  v_mate  citext;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if not public.club_access() then
    raise exception 'no_club_access' using errcode = 'P0001';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;

  select m.id, m.team_id,
         left(coalesce(nullif(trim(m.display_name), ''), nullif(trim(p.display_name), ''), 'Участник'), 60)
           as name
    into v_me
  from public.marathon_members m
  left join public.profiles p on p.email = m.email
  where m.marathon_id = v_club and m.email = v_email and m.status = 'active';

  if v_me.id is null or v_me.team_id is null then
    raise exception 'no_pair' using errcode = 'P0001';
  end if;

  select mate.email into v_mate
  from public.marathon_members mate
  where mate.team_id = v_me.team_id and mate.id <> v_me.id and mate.status = 'active'
  limit 1;

  if v_mate is null then
    raise exception 'no_pair' using errcode = 'P0001';
  end if;

  perform public.enqueue_telegram(
    v_mate::text,
    'duo_nudge',
    'duo_nudge:' || v_me.team_id::text || ':' || v_me.id::text || ':' || current_date::text,
    jsonb_build_object('name', v_me.name),
    now(),
    interval '1 day'
  );
end;
$$;

revoke execute on function public.club_duo_nudge() from public, anon;
grant execute on function public.club_duo_nudge() to authenticated;

comment on function public.club_duo_nudge() is
  'Queue «{name} уже сделал(а) задание — твоя очередь» to the caller''s duo partner, once a day per direction (0051). no_pair when unpaired.';

notify pgrst, 'reload schema';
