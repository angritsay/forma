-- =============================================================================
-- 0059 — the sender and the coach's week, when something goes wrong.
--
-- 0027 and 0040 made two queues that `telegram-notify` drains every ten minutes. Running them
-- showed three ways a message goes out twice, never, or to nobody, and one way the admin wipes a
-- coach's week:
--
--   1. **Two runs, one row, two messages.** The sender read its batch with a plain select, and
--      a run that overlapped the next one (a slow Telegram, a manual run from Actions) read the
--      same pending rows and sent them again. `telegram_outbox_claim()` and `admin_outbox_claim()`
--      take the batch with `for update skip locked` and stamp it `claimed_until` in the same
--      statement: a second run skips what the first is sending. The claim is a lease, not a
--      status: a run that dies halfway leaves its rows `pending`, and five minutes later they are
--      anybody's again.
--   2. **An unknown kind stalled the owner's channel.** A row the deployed function cannot word
--      (the database ran ahead of it) stays `pending` on purpose — and sat at the head of the
--      batch, so fifty of them meant nothing else was ever sent. The admin claim takes the kinds
--      the function knows (`p_kinds`) and leaves the rest where they are, out of the way.
--   3. **A blocked bot was knocked on forever.** A 403 («bot was blocked by the user») skipped the
--      one row and queued the next. `profiles.telegram_blocked_at` now remembers it: the sender
--      sets it (`telegram_set_blocked`), the due and claim functions pass such people over, the
--      admin sees it on the person and on their bookings (`admin_telegram_blocked`), and it clears
--      itself when the person writes to the bot again or links another Telegram account.
--   4. **A week saved over another.** `admin_set_availability()` replaced the week whatever the
--      editor had read, so two open tabs — or a stale phone — silently undid each other.
--      `coaches.availability_updated_at` is the week's version; the editor sends the one it read
--      (`p_expected`), and a week changed since is refused with `stale_week` instead of
--      overwritten. Old clients send no version and keep working as before.
--
-- Requires 0001, 0026, 0027, 0040, 0043, 0045, 0055. Not destructive. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Columns.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists telegram_blocked_at timestamptz;

comment on column public.profiles.telegram_blocked_at is
  'When Telegram last answered 403 for this person''s chat (0059): the bot is blocked or the chat deleted. Cleared when they write to the bot again or link another account.';

alter table public.telegram_outbox add column if not exists claimed_until timestamptz;
alter table public.admin_outbox add column if not exists claimed_until timestamptz;

comment on column public.telegram_outbox.claimed_until is
  'A sender run is sending this row until then (0059). A lease, not a status: a run that dies leaves the row pending.';
comment on column public.admin_outbox.claimed_until is
  'A sender run is sending this row until then (0059). A lease, not a status: a run that dies leaves the row pending.';

alter table public.coaches
  add column if not exists availability_updated_at timestamptz not null default now();

comment on column public.coaches.availability_updated_at is
  'Version of the weekly hours (0059): admin_set_availability refuses a week edited from an older one.';

-- The editor reads the version it will send back; nothing else about it is private.
grant select (availability_updated_at) on public.coaches to authenticated;

-- -----------------------------------------------------------------------------
-- 2. A new Telegram account is a new chat: whatever the old one blocked does not carry over.
-- -----------------------------------------------------------------------------
create or replace function public.profiles_telegram_unblock()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if new.telegram_id is distinct from old.telegram_id then
    new.telegram_blocked_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_telegram_unblock on public.profiles;
create trigger profiles_telegram_unblock
  before update of telegram_id on public.profiles
  for each row execute function public.profiles_telegram_unblock();

-- -----------------------------------------------------------------------------
-- 3. The due list (0043, 0045) passes over blocked chats and rows another run is sending.
--
-- Same columns as before, so `create or replace` is enough. A chat-addressed row (a support
-- reply, 0045) is held back only when a profile with that chat says it is blocked; a chat with no
-- profile has nobody to remember it on.
-- -----------------------------------------------------------------------------
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
    select pr.telegram_id, pr.locale, pr.telegram_blocked_at
    from public.profiles pr
    where (o.chat_id is null and pr.email = o.email and pr.telegram_id is not null)
       or (o.chat_id is not null and pr.telegram_id = o.chat_id)
    limit 1
  ) p on true
  where o.status = 'pending'
    and o.send_after <= now()
    and o.expires_at >= now()
    and (o.claimed_until is null or o.claimed_until < now())
    and (o.chat_id is not null or p.telegram_id is not null)
    and p.telegram_blocked_at is null
  order by o.send_after
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

revoke execute on function public.telegram_outbox_due(int) from public, anon, authenticated;
grant execute on function public.telegram_outbox_due(int) to service_role;

-- -----------------------------------------------------------------------------
-- 4. Claiming a batch: the due rows, locked and stamped in one statement.
--
-- `for update of o skip locked` — a row another run holds right now is not waited for, it is
-- left to that run; `claimed_until` keeps it out of the next run's batch after this transaction
-- commits, for as long as the lease. Five minutes by default: longer than any run (an edge
-- function lives 150 seconds), shorter than the ten between runs, so a crashed run's rows go out
-- with the very next one.
-- -----------------------------------------------------------------------------
create or replace function public.telegram_outbox_claim(
  p_limit         int default 50,
  p_lease_seconds int default 300
)
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
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
  with due as (
    select o.id,
           coalesce(o.chat_id, p.telegram_id) as telegram_id,
           case
             when o.chat_id is not null
               then coalesce(nullif(o.params ->> 'locale', ''), p.locale::text)
             else p.locale::text
           end as locale,
           o.send_after
    from public.telegram_outbox o
    left join lateral (
      select pr.telegram_id, pr.locale, pr.telegram_blocked_at
      from public.profiles pr
      where (o.chat_id is null and pr.email = o.email and pr.telegram_id is not null)
         or (o.chat_id is not null and pr.telegram_id = o.chat_id)
      limit 1
    ) p on true
    where o.status = 'pending'
      and o.send_after <= now()
      and o.expires_at >= now()
      and (o.claimed_until is null or o.claimed_until < now())
      and (o.chat_id is not null or p.telegram_id is not null)
      and p.telegram_blocked_at is null
    order by o.send_after
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
    for update of o skip locked
  ),
  claimed as (
    update public.telegram_outbox t
       set claimed_until = now()
             + make_interval(secs => least(greatest(coalesce(p_lease_seconds, 300), 30), 3600))
      from due
     where t.id = due.id
    returning t.id, t.email, t.kind, t.params, t.attempts, t.expires_at
  )
  select c.id, c.email::text, c.kind, c.params, c.attempts, c.expires_at, d.telegram_id, d.locale
  from claimed c
  join due d on d.id = c.id
  order by d.send_after;
$$;

revoke execute on function public.telegram_outbox_claim(int, int) from public, anon, authenticated;
grant execute on function public.telegram_outbox_claim(int, int) to service_role;

/*
 * The owner's queue, the same way. `p_kinds` is the list of kinds the deployed function can word
 * (`ADMIN_KINDS` in telegram-notify/admin.ts); null takes every kind. A row of another kind is not
 * claimed and not touched: it waits, out of the batch, for the deploy that knows it.
 */
create or replace function public.admin_outbox_claim(
  p_kinds         text[] default null,
  p_limit         int default 50,
  p_lease_seconds int default 300
)
returns table (
  id         uuid,
  topic      text,
  kind       text,
  params     jsonb,
  attempts   int,
  dedupe_key text
)
language sql
volatile
security definer
set search_path = pg_catalog, public, extensions
as $$
  with due as (
    select o.id, o.created_at
    from public.admin_outbox o
    where o.status = 'pending'
      and (o.claimed_until is null or o.claimed_until < now())
      and (p_kinds is null or o.kind = any (p_kinds))
    order by o.created_at
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
    for update of o skip locked
  ),
  claimed as (
    update public.admin_outbox a
       set claimed_until = now()
             + make_interval(secs => least(greatest(coalesce(p_lease_seconds, 300), 30), 3600))
      from due
     where a.id = due.id
    returning a.id, a.topic, a.kind, a.params, a.attempts, a.dedupe_key
  )
  select c.id, c.topic, c.kind, c.params, c.attempts, c.dedupe_key
  from claimed c
  join due d on d.id = c.id
  order by d.created_at;
$$;

revoke execute on function public.admin_outbox_claim(text[], int, int) from public, anon, authenticated;
grant execute on function public.admin_outbox_claim(text[], int, int) to service_role;

-- -----------------------------------------------------------------------------
-- 5. Blocked, and not any more.
--
-- The sender calls it with `true` on a 403; the bot with `false` when the person writes to it or
-- unblocks it (`my_chat_member`). Answers how many profiles changed: 0 is normal — a chat with no
-- profile, or a flag already in that state.
-- -----------------------------------------------------------------------------
create or replace function public.telegram_set_blocked(p_telegram_id bigint, p_blocked boolean)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_n int;
begin
  if p_telegram_id is null or p_telegram_id <= 0 then
    return 0;
  end if;
  if coalesce(p_blocked, false) then
    update public.profiles
       set telegram_blocked_at = now()
     where telegram_id = p_telegram_id
       and telegram_blocked_at is null;
  else
    update public.profiles
       set telegram_blocked_at = null
     where telegram_id = p_telegram_id
       and telegram_blocked_at is not null;
  end if;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.telegram_set_blocked(bigint, boolean) from public, anon, authenticated;
grant execute on function public.telegram_set_blocked(bigint, boolean) to service_role;

/*
 * Which of these addresses have blocked the bot, for the admin: the person page and the booking
 * rows ask about the addresses on screen. A separate call rather than a column on
 * `admin_person` / `admin_coach_bookings`, so neither of those has to be redefined for one fact.
 */
create or replace function public.admin_telegram_blocked(p_emails text[])
returns table (email text, blocked_at timestamptz)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if p_emails is null or cardinality(p_emails) = 0 then
    return;
  end if;
  if cardinality(p_emails) > 500 then
    raise exception 'too_many' using errcode = '22023';
  end if;

  return query
  select p.email::text, p.telegram_blocked_at
  from public.profiles p
  where p.email = any (p_emails::citext[])
    and p.telegram_id is not null
    and p.telegram_blocked_at is not null;
end;
$$;

revoke execute on function public.admin_telegram_blocked(text[]) from public, anon;
grant execute on function public.admin_telegram_blocked(text[]) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. The week, with its version.
--
-- The signature grows by one defaulted argument, so the old one is dropped and the grants are
-- made again exactly as 0055 made them. `p_expected` null is an old client: no check, as before.
-- -----------------------------------------------------------------------------
drop function if exists public.admin_set_availability(text, jsonb);

create or replace function public.admin_set_availability(
  p_coach    text,
  p_rules    jsonb,
  p_expected timestamptz default null
)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_rule    jsonb;
  v_n       int := 0;
  v_version timestamptz;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  -- The row lock makes two saves of the same coach take turns, so the check below cannot race.
  select c.availability_updated_at into v_version
  from public.coaches c
  where c.id = p_coach
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if p_expected is not null and v_version is distinct from p_expected then
    raise exception 'stale_week' using errcode = 'P0001';
  end if;
  if p_rules is null or jsonb_typeof(p_rules) <> 'array' or jsonb_array_length(p_rules) > 100 then
    raise exception 'invalid_rules' using errcode = 'P0001';
  end if;

  delete from public.coach_availability where coach_id = p_coach;
  for v_rule in select * from jsonb_array_elements(p_rules) loop
    begin
      insert into public.coach_availability (coach_id, weekday, start_time, end_time)
      values (p_coach, (v_rule ->> 'weekday')::smallint, (v_rule ->> 'start')::time,
              (v_rule ->> 'end')::time);
    exception when others then
      raise exception 'invalid_rules' using errcode = 'P0001';
    end;
    v_n := v_n + 1;
  end loop;

  -- clock_timestamp(), not now(): two saves in one transaction still get two versions.
  update public.coaches set availability_updated_at = clock_timestamp() where id = p_coach;
  return v_n;
end;
$$;

revoke execute on function public.admin_set_availability(text, jsonb, timestamptz) from public, anon;
grant execute on function public.admin_set_availability(text, jsonb, timestamptz) to authenticated;

notify pgrst, 'reload schema';
