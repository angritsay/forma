-- =============================================================================
-- 0034 — пары в дуо-клубе: по ссылке подруге и автоподбором каждую неделю.
--
-- «Пригласить друга, и ты скидываешь другу, и вы чуть дешевле покупаете
-- подписку. Но это вот подешевле это в будущем. Сейчас это просто типа с
-- подружкой, чтобы вместе участвовать.» — скидки здесь нет, есть пара.
--
-- «Если же у тебя нету дуо, то там должен быть баннер, что нету дуо, мы найдём
-- тебе его автоматически, и каждую неделю мы будем менять тебе дуо.»
--
-- ## Две породы пар, и разница между ними — вся механика
--
-- Пара, которую выбрали, живёт, пока её не расторгнут. Пара, которую подобрали,
-- живёт неделю. Отличить их надо в схеме, а не по соглашению: `is_auto` на
-- `marathon_teams`. Автоподбор пересобирает только свои пары и не трогает чужие
-- — иначе он раз в неделю разлучал бы подруг, которые специально сошлись.
--
-- ## Приглашение живёт на почте
--
-- Как покупки и как участники клуба (0011: «keyed on email … the row has to
-- exist before Ваня signs in»). Подруга, которой скинули ссылку, ещё не
-- зарегистрирована и уж точно не оплатила, так что привязать приглашение к
-- `member_id` было бы привязкой к строке, которой нет.
--
-- ## Пока подруга не оплатила
--
-- Решение владельца: «подбираем автоматически, потом заменим». Приглашение
-- висит, автоподбор тем временем ставит пару на неделю, и в тот момент, когда
-- подруга оплатит и откроет ссылку, автоматическая пара расходится и собирается
-- выбранная. Никто не сидит неделю без дуо из-за того, что подруга задержалась.
--
-- Требует 0011_marathon.sql, 0016_club_membership.sql, 0033_club_duo.sql.
-- Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Автоматическая пара — та, которую можно расторгнуть без спроса.
-- -----------------------------------------------------------------------------
alter table public.marathon_teams
  add column if not exists is_auto boolean not null default false;

comment on column public.marathon_teams.is_auto is
  'Пара, собранная автоподбором на неделю. Выбранные вручную (тренером или приглашением) живут, пока их не расторгнут.';

create index if not exists marathon_teams_auto_idx
  on public.marathon_teams (marathon_id) where is_auto;

-- -----------------------------------------------------------------------------
-- 2. Приглашение в пару.
--
-- Токен — первичный ключ и он же то, что уезжает в ссылку. Отдельного id нет:
-- строка и есть приглашение, а второй ключ рядом с токеном давал бы два способа
-- сослаться на одно.
--
-- Открытое приглашение у человека одно: частичный уникальный индекс по
-- приглашающему среди непогашенных. Вторая ссылка от того же человека — это не
-- второе приглашение, а та же самая, и `club_invite_create()` её и возвращает.
-- -----------------------------------------------------------------------------
create table if not exists public.club_duo_invites (
  token         text primary key check (token ~ '^[A-Za-z0-9_-]{16,64}$'),
  inviter_email citext not null check (length(inviter_email::text) <= 254),
  created_at    timestamptz not null default now(),
  -- Две недели: ссылка, которую нашли в переписке через полгода, приводит к
  -- паре, о которой обе уже забыли.
  expires_at    timestamptz not null default now() + interval '14 days',
  redeemed_by   citext check (redeemed_by is null or length(redeemed_by::text) <= 254),
  redeemed_at   timestamptz,
  -- Погашено — значит известно кем и когда: одно без другого читалось бы как сбой.
  constraint club_duo_invites_redeemed_pair check (
    (redeemed_by is null) = (redeemed_at is null)
  ),
  -- Сама себе парой человек не становится.
  constraint club_duo_invites_not_self check (
    redeemed_by is null or redeemed_by <> inviter_email
  )
);

comment on table public.club_duo_invites is
  'Приглашение в пару дуо-клуба по ссылке. Живёт на почте: приглашённая может быть ещё не зарегистрирована.';

create unique index if not exists club_duo_invites_open_idx
  on public.club_duo_invites (inviter_email) where redeemed_at is null;

create index if not exists club_duo_invites_redeemed_idx
  on public.club_duo_invites (redeemed_by) where redeemed_by is not null;

/*
 * Таблица закрыта наглухо: в ней чужие адреса, а токен — это доступ к паре.
 * Всё идёт через функции ниже, которые возвращают ровно столько, сколько нужно
 * экрану, и никогда чужую почту.
 */
alter table public.club_duo_invites enable row level security;
revoke all on public.club_duo_invites from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Расторгнуть пару.
--
-- Вспомогательная: используется и при автоподборе, и когда выбранная пара
-- уступает место другой. Команда удаляется целиком, а не остаётся пустой —
-- `team_id` у участников обнуляется каскадом (`on delete set null`).
--
-- Очки при этом никуда не деваются: они лежат на `marathon_submissions` и
-- считаются от участника, а не от команды.
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_break(p_team_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog, public, extensions
as $$
  delete from public.marathon_teams where id = p_team_id;
$$;

revoke execute on function public.club_duo_break(uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Свести двоих в пару.
--
-- Обе прежние пары расходятся, и обе — независимо от того, автоматические они
-- или выбранные: человек, принявший приглашение, решение уже принял.
--
-- Имя команды собирается из двух имён, потому что доска показывает именно его.
-- Уникальность `(marathon_id, name)` может столкнуться с тёзками, поэтому к
-- имени добавляется кусочек id — видно его только на доске у пары, и лучше
-- «Настя и Настя · 7f3» один раз, чем отказ завести пару.
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_pair(
  p_marathon_id uuid,
  p_a uuid,
  p_b uuid,
  p_auto boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_team uuid;
  v_name text;
  v_a    record;
  v_b    record;
begin
  if p_a is null or p_b is null or p_a = p_b then
    raise exception 'need_two_members' using errcode = 'P0001';
  end if;

  select m.id, m.team_id,
         coalesce(nullif(trim(m.display_name), ''), nullif(trim(p.display_name), ''), 'Участник')
           as name
    into v_a
  from public.marathon_members m
  left join public.profiles p on p.email = m.email
  where m.id = p_a and m.marathon_id = p_marathon_id and m.status = 'active';

  select m.id, m.team_id,
         coalesce(nullif(trim(m.display_name), ''), nullif(trim(p.display_name), ''), 'Участник')
           as name
    into v_b
  from public.marathon_members m
  left join public.profiles p on p.email = m.email
  where m.id = p_b and m.marathon_id = p_marathon_id and m.status = 'active';

  if v_a.id is null or v_b.id is null then
    raise exception 'member_not_in_marathon' using errcode = 'P0001';
  end if;

  if v_a.team_id is not null then perform public.club_duo_break(v_a.team_id); end if;
  if v_b.team_id is not null then perform public.club_duo_break(v_b.team_id); end if;

  v_name := left(v_a.name || ' и ' || v_b.name, 50);
  insert into public.marathon_teams (marathon_id, name, is_auto)
  values (p_marathon_id, v_name || ' · ' || left(gen_random_uuid()::text, 3), p_auto)
  returning id into v_team;

  update public.marathon_members
     set team_id = v_team
   where id in (p_a, p_b);

  return v_team;
end;
$$;

revoke execute on function public.club_duo_pair(uuid, uuid, uuid, boolean) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Автоподбор на неделю.
--
-- Берёт всех активных в дуо-клубе, у кого пары нет или пара автоматическая,
-- распускает автоматические и сводит заново в случайном порядке.
--
-- **Нечётный остаётся без пары**, и это честнее любой альтернативы: тройка
-- ломает и `team_size = 2`, и саму метафору дуо, а оставить человека в паре
-- прошлой недели значит сказать «каждую неделю меняем» и не поменять. Экран
-- показывает ему тот же баннер, что и всем без пары.
--
-- Возвращает, сколько пар собралось, — чтобы расписание могло напечатать число,
-- а не «готово».
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_rematch()
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_club  uuid := public.club_marathon(true);
  v_pairs int := 0;
  v_prev  uuid := null;
  r       record;
begin
  if v_club is null then
    return 0;
  end if;

  -- Прошлая неделя закончилась: автоматические пары расходятся все разом.
  delete from public.marathon_teams where marathon_id = v_club and is_auto;

  /*
   * `order by random()` — жеребьёвка, и это весь алгоритм подбора. Никаких
   * «по уровню» и «по активности»: клуб маленький, а любая попытка подбирать
   * по заслугам означала бы, что кто-то каждую неделю достаётся отстающим.
   */
  for r in
    select m.id
    from public.marathon_members m
    where m.marathon_id = v_club
      and m.status = 'active'
      and m.team_id is null
    order by random()
  loop
    if v_prev is null then
      v_prev := r.id;
    else
      perform public.club_duo_pair(v_club, v_prev, r.id, true);
      v_prev := null;
      v_pairs := v_pairs + 1;
    end if;
  end loop;

  return v_pairs;
end;
$$;

revoke execute on function public.club_duo_rematch() from public, anon, authenticated;
grant execute on function public.club_duo_rematch() to service_role;

comment on function public.club_duo_rematch() is
  'Пересобрать автоматические пары дуо-клуба. Выбранные пары не трогает; нечётный остаётся без пары. Возвращает число собранных пар.';

-- -----------------------------------------------------------------------------
-- 6. Приглашение: создать.
--
-- Возвращает открытый токен звонящего, создавая его при первом вызове. Второй
-- вызов отдаёт тот же — «поделиться ссылкой» нажимают по многу раз, и каждая
-- новая ссылка обесценивала бы предыдущую, уже отправленную.
-- -----------------------------------------------------------------------------
create or replace function public.club_invite_create()
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_token text;
begin
  if v_email is null or not public.club_access() then
    raise exception 'no_club_access' using errcode = 'P0001';
  end if;

  -- Просроченное открытое приглашение — это не приглашение: гасим и выдаём новое.
  delete from public.club_duo_invites
   where inviter_email = v_email and redeemed_at is null and expires_at < now();

  select token into v_token
  from public.club_duo_invites
  where inviter_email = v_email and redeemed_at is null;

  if v_token is not null then
    return v_token;
  end if;

  -- 32 символа из URL-безопасного алфавита: в ссылку уезжает как есть.
  v_token := translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
  insert into public.club_duo_invites (token, inviter_email) values (v_token, v_email);
  return v_token;
end;
$$;

revoke execute on function public.club_invite_create() from public, anon;
grant execute on function public.club_invite_create() to authenticated;

comment on function public.club_invite_create() is
  'Ссылка-приглашение в пару. Идемпотентна: у человека одно открытое приглашение.';

-- -----------------------------------------------------------------------------
-- 7. Приглашение: принять.
--
-- Звонящая должна иметь доступ к клубу — то есть оплатить. Это и есть условие
-- владельца: «вы участвуете в клубе вместе после того, как она оплачивает
-- подписку». До оплаты ссылка открывается, но пары не делает, и экран честно
-- говорит, чего не хватает.
--
-- Коды ошибок, а не текст: их читает приложение и показывает свою фразу на
-- языке читателя.
-- -----------------------------------------------------------------------------
create or replace function public.club_invite_redeem(p_token text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email  citext := public.current_email();
  v_club   uuid   := public.club_marathon(true);
  v_inv    record;
  v_me     uuid;
  v_them   uuid;
  v_team   uuid;
begin
  if v_email is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if not public.club_access() then
    raise exception 'no_subscription' using errcode = 'P0001';
  end if;
  if v_club is null then
    raise exception 'no_club' using errcode = 'P0001';
  end if;

  select * into v_inv
  from public.club_duo_invites
  where token = p_token;

  if v_inv.token is null then
    raise exception 'invite_not_found' using errcode = 'P0001';
  end if;
  if v_inv.redeemed_at is not null then
    raise exception 'invite_used' using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;
  if v_inv.inviter_email = v_email then
    raise exception 'invite_own' using errcode = 'P0001';
  end if;

  -- Обе должны быть в дуо-клубе. Звонящую заводим сами: она только что оплатила
  -- и могла ещё ни разу не открыть вкладку.
  perform public.join_club();

  select id into v_me   from public.marathon_members
   where marathon_id = v_club and email = v_email and status = 'active';
  select id into v_them from public.marathon_members
   where marathon_id = v_club and email = v_inv.inviter_email and status = 'active';

  if v_me is null or v_them is null then
    raise exception 'inviter_not_in_club' using errcode = 'P0001';
  end if;

  v_team := public.club_duo_pair(v_club, v_them, v_me, false);

  update public.club_duo_invites
     set redeemed_by = v_email, redeemed_at = now()
   where token = p_token;

  return v_team;
end;
$$;

revoke execute on function public.club_invite_redeem(text) from public, anon;
grant execute on function public.club_invite_redeem(text) to authenticated;

comment on function public.club_invite_redeem(text) is
  'Принять приглашение в пару. Требует оплаченного доступа к клубу; расторгает прежние пары обеих.';

-- -----------------------------------------------------------------------------
-- 8. Что показать на вкладке «Дуо».
--
-- Одна поездка за всем состоянием пары: есть ли она, кто в ней, сама ли она
-- собралась, и какую ссылку показывать, если пары нет. Почту не возвращает
-- никогда — ни свою, ни чужую.
-- -----------------------------------------------------------------------------
create or replace function public.club_duo_status()
returns table (
  marathon_id  uuid,
  member_id    uuid,
  team_id      uuid,
  is_auto      boolean,
  mate_name    text,
  mate_seed    text,
  invite_token text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_club  uuid   := public.club_marathon(true);
begin
  if v_email is null or v_club is null then
    return;
  end if;

  return query
  select
    v_club,
    me.id,
    me.team_id,
    coalesce(t.is_auto, false),
    left(coalesce(
      nullif(trim(mate.display_name), ''),
      nullif(trim(mp.display_name), ''),
      'Участник'
    ), 60),
    coalesce(mp.avatar_seed, ''),
    inv.token
  from public.marathon_members me
  left join public.marathon_teams t on t.id = me.team_id
  left join public.marathon_members mate
    on mate.team_id = me.team_id and mate.id <> me.id and mate.status = 'active'
  left join public.profiles mp on mp.email = mate.email
  left join public.club_duo_invites inv
    on inv.inviter_email = v_email and inv.redeemed_at is null and inv.expires_at > now()
  where me.marathon_id = v_club and me.email = v_email and me.status = 'active'
  limit 1;
end;
$$;

revoke execute on function public.club_duo_status() from public, anon;
grant execute on function public.club_duo_status() to authenticated;

comment on function public.club_duo_status() is
  'Состояние пары в дуо-клубе: напарник (без почты), сама ли пара собралась, и открытая ссылка-приглашение.';

notify pgrst, 'reload schema';
