-- =============================================================================
-- 0055 — booking core: our own calendar for sessions with the coach.
--
-- Owner, 29 Sep: «explore replacing google booking with our internal tool and build the tool».
-- Until now a session was paid first on a static Prodamus / lava.top link and then booked either
-- on a Google appointment page (half an hour, Sergey only) or by writing to the coach (the hour,
-- Nastia). Nothing tied the payment to the booking except the address, and there was no model of
-- when a coach is free. This migration is that model, and the path from «a slot» to «a paid
-- session with a link» inside the product.
--
-- ## The order: pick a slot, then pay
--
--   1. `available_slots(coach, option, from, to)` lists the free starts.
--   2. `hold_slot(coach, option, starts_at)` holds one for 20 minutes: a `pending` row in
--      `coach_bookings` with `hold_expires_at`. One live hold per address; a new one replaces it.
--   3. The client pays on the same static link as before. The webhook knows the option (Prodamus
--      by amount, lava.top by product `session:half|hour`) and calls
--      `apply_session_payment(email, ref, option)`, which turns the hold into an `active` booking
--      with the payment and the coach's room link.
--   4. A payment with no matching hold stays in the ledger unapplied, and the owner's channel
--      gets `session_unmatched`. A payment from an address linked to the account (0020) finds
--      the account's hold; one from an unknown address confirms it when the client claims it
--      (`claim_payment()`, redefined here). A payment that arrives after its hold expired still
--      confirms when the slot is still free — unless the client had picked another slot since.
--
-- ## The owner's rules, as they are enforced here
--
--   * One fixed room link per coach (`coaches.room_url`); the booking copies it at confirmation.
--   * Sergey and Nastia each have their own calendar. Nastia is bookable only by people with the
--     `coach_nastia` flag (0049) — `coaches.flag` — exactly as her card is shown.
--   * A client moves a session themselves only 24 hours or more before it, into a free slot
--     (`move_my_booking`). There is no self-cancel and no refund: later than 24 hours they write
--     to the coach, and the admin moves or cancels (`admin_move_booking`, `admin_cancel_booking`).
--
-- ## The same slot is never sold twice
--
-- An exclusion constraint (`btree_gist`) on `(coach_id, [starts_at, ends_at))` for `active` and
-- `pending` rows. «Live» pending (an unexpired hold) cannot be a constraint predicate — `now()`
-- is not immutable — so an expired hold keeps its place in the constraint until somebody needs it,
-- and every write path first marks the dead holds in its way `expired` (`booking_sweep_holds`).
-- Every read path already ignores them. Google rows (`coach_id` null) are outside the constraint
-- and stay valid; Sergey's `available_slots` still treats them as busy while the sync runs.
--
-- ## Messages
--
-- A trigger queues the client's bot messages (kinds added by 0054, copy in
-- `telegram-notify/copy.ts`): `session_confirmed`, `session_reminder` 24 hours and 1 hour before
-- (`send_after`, deduped per state of the booking — `booking_version`), `session_moved` and
-- `session_cancelled`. A move or a cancellation marks the reminders for the old time (and an unsent
-- `session_moved`) `skipped`, because the sender does not check a message again before sending it. The owner's channel (0040) keeps working: its trigger now
-- ignores holds and speaks when a booking becomes active, moves or is cancelled.
--
-- ## Numbers that live in the content too
--
-- `booking_lead_time()` is `BOOKING.leadTimeMin` and `booking_option_minutes()` the options'
-- `durationMin` (content/site/booking.ts). SQL cannot import them, so `booking-core.test.ts`
-- reads this file and fails when the two disagree.
--
-- Requires 0001, 0014, 0020, 0027, 0040, 0043, 0044, 0049, 0054. Idempotent.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Constants. Immutable functions rather than magic numbers repeated across six functions.
-- -----------------------------------------------------------------------------

-- `BOOKING.leadTimeMin` (content/site/booking.ts): how close to its start a slot can be taken.
create or replace function public.booking_lead_time()
returns interval
language sql
immutable
set search_path = pg_catalog
as $$ select interval '15 minutes' $$;

-- How long a picked slot waits for its payment.
create or replace function public.booking_hold_time()
returns interval
language sql
immutable
set search_path = pg_catalog
as $$ select interval '20 minutes' $$;

-- How far ahead a slot can be taken.
create or replace function public.booking_horizon()
returns interval
language sql
immutable
set search_path = pg_catalog
as $$ select interval '60 days' $$;

-- The owner's rule: a client moves a session themselves only this far ahead of it.
create or replace function public.booking_move_cutoff()
returns interval
language sql
immutable
set search_path = pg_catalog
as $$ select interval '24 hours' $$;

-- The options' `durationMin` (content/site/booking.ts). Anything else is an error, not a guess.
create or replace function public.booking_option_minutes(p_option text)
returns int
language plpgsql
immutable
set search_path = pg_catalog
as $$
begin
  case p_option
    when 'half' then return 30;
    when 'hour' then return 60;
    else raise exception 'invalid_option' using errcode = 'P0001';
  end case;
end;
$$;

revoke execute on function public.booking_lead_time() from public, anon;
revoke execute on function public.booking_hold_time() from public, anon;
revoke execute on function public.booking_horizon() from public, anon;
revoke execute on function public.booking_move_cutoff() from public, anon;
revoke execute on function public.booking_option_minutes(text) from public, anon;
grant execute on function public.booking_lead_time() to authenticated, service_role;
grant execute on function public.booking_hold_time() to authenticated, service_role;
grant execute on function public.booking_horizon() to authenticated, service_role;
grant execute on function public.booking_move_cutoff() to authenticated, service_role;
grant execute on function public.booking_option_minutes(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Coaches.
--
-- The address and the room link are not public: the address is a person's, and the room link is
-- what a paying client receives — published, it would let anybody walk into the coach's call.
-- Column grants keep both out of every direct select; the admin reads them through
-- `admin_coaches()` and writes through `admin_save_coach()`.
-- -----------------------------------------------------------------------------
create table if not exists public.coaches (
  id         text primary key check (id ~ '^[a-z][a-z0-9_]{1,30}$'),
  name       text not null check (length(btrim(name)) between 1 and 60),
  name_en    text check (name_en is null or length(btrim(name_en)) between 1 and 60),
  -- The coach's own address, for the admin. Never published.
  email      citext check (email is null or length(email::text) <= 254),
  -- One fixed room per coach (owner, 29 Sep). https only, like every link the app renders (0014).
  room_url   text check (room_url is null or (room_url ~ '^https://' and length(room_url) <= 2000)),
  timezone   text not null default 'Europe/Moscow'
               check (timezone ~ '^[A-Za-z][A-Za-z0-9+_/-]{1,63}$'),
  active     boolean not null default true,
  -- A feature flag (0049) the client needs to book this coach; null = everybody.
  flag       text check (flag is null or flag ~ '^[a-z0-9_]{2,60}$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coaches is
  'Coaches clients can book (0055). email and room_url are admin-only; room_url is copied onto a booking when it is paid.';

drop trigger if exists coaches_touch on public.coaches;
create trigger coaches_touch
  before update on public.coaches
  for each row execute function public.set_updated_at();

alter table public.coaches enable row level security;

/*
 * Whether the caller may see and book this coach: active, and either open to everybody or behind
 * a flag (0049) the caller has — or the caller is an admin. Nastia's calendar is shown exactly
 * where her card is. Used by the read policies below, `available_slots` and `hold_slot`.
 */
create or replace function public.booking_coach_visible(p_coach text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_flag   text;
  v_active boolean;
begin
  select c.flag, c.active into v_flag, v_active from public.coaches c where c.id = p_coach;
  if not coalesce(v_active, false) then
    return false;
  end if;
  -- An open coach never asks who is calling: the page is read signed out too.
  if v_flag is null then
    return true;
  end if;
  return auth.uid() is not null
     and (public.is_admin()
          or exists (select 1 from public.feature_flags f
                     where f.flag = v_flag and f.user_id = auth.uid()));
end;
$$;

revoke execute on function public.booking_coach_visible(text) from public;
grant execute on function public.booking_coach_visible(text) to anon, authenticated, service_role;

drop policy if exists "coaches: read active" on public.coaches;
create policy "coaches: read active"
  on public.coaches for select
  to anon, authenticated
  using (public.booking_coach_visible(id));

revoke all on public.coaches from anon, authenticated;
grant select (id, name, name_en, timezone, active, flag, sort_order) on public.coaches
  to anon, authenticated;
grant select, insert, update, delete on public.coaches to service_role;

-- The two calendars. No address and no link here: the admin fills them in after deploy.
insert into public.coaches (id, name, name_en, flag, sort_order) values
  ('sergey', 'Сергей', 'Sergey', null, 1),
  ('nastia', 'Nastia', 'Nastia', 'coach_nastia', 2)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Availability: weekly rules, then exceptions per date.
--
-- Times are the coach's wall clock (`coaches.timezone`). `weekday` is ISO: 1 = Monday … 7 = Sunday.
-- Rules may overlap or touch; `available_slots` takes their union, so 10–12 and 12–14 give an
-- hour at 11:30. An exception either adds a window (`extra`), or takes one away (`off` with
-- times) or the whole day (`off` without).
--
-- Readable by anybody who may book the coach (it is when the coach works, not who books him):
-- a flagged coach's hours stay hidden without the flag. Written by admins only.
-- -----------------------------------------------------------------------------
create table if not exists public.coach_availability (
  id         uuid primary key default gen_random_uuid(),
  coach_id   text not null references public.coaches (id) on delete cascade,
  weekday    smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  constraint coach_availability_order check (end_time > start_time)
);

create index if not exists coach_availability_coach_idx
  on public.coach_availability (coach_id, weekday);

create table if not exists public.coach_availability_exceptions (
  id         uuid primary key default gen_random_uuid(),
  coach_id   text not null references public.coaches (id) on delete cascade,
  date       date not null,
  start_time time,
  end_time   time,
  kind       text not null check (kind in ('off', 'extra')),
  note       text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  -- Both times or neither; an extra window always has them; a window runs forwards.
  constraint coach_availability_exceptions_times check (
    (start_time is null) = (end_time is null)
    and (kind = 'off' or start_time is not null)
    and (start_time is null or end_time > start_time)
  )
);

create index if not exists coach_availability_exceptions_coach_idx
  on public.coach_availability_exceptions (coach_id, date);

alter table public.coach_availability enable row level security;
alter table public.coach_availability_exceptions enable row level security;

drop policy if exists "coach_availability: read" on public.coach_availability;
create policy "coach_availability: read"
  on public.coach_availability for select to anon, authenticated
  using (public.booking_coach_visible(coach_id));
drop policy if exists "coach_availability: admins write" on public.coach_availability;
create policy "coach_availability: admins write"
  on public.coach_availability for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "coach_availability_exceptions: read" on public.coach_availability_exceptions;
create policy "coach_availability_exceptions: read"
  on public.coach_availability_exceptions for select to anon, authenticated
  using (public.booking_coach_visible(coach_id));
drop policy if exists "coach_availability_exceptions: admins write" on public.coach_availability_exceptions;
create policy "coach_availability_exceptions: admins write"
  on public.coach_availability_exceptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.coach_availability, public.coach_availability_exceptions from anon, authenticated;
grant select on public.coach_availability, public.coach_availability_exceptions to anon;
grant select, insert, update, delete on public.coach_availability, public.coach_availability_exceptions
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. coach_bookings: holds, coaches, options, payments.
-- -----------------------------------------------------------------------------
alter table public.coach_bookings add column if not exists coach_id text
  references public.coaches (id) on delete restrict;
alter table public.coach_bookings add column if not exists option_id text;
alter table public.coach_bookings add column if not exists payment_id uuid
  references public.payments (id) on delete set null;
alter table public.coach_bookings add column if not exists hold_expires_at timestamptz;

-- `pending` is a held slot waiting for its payment; `expired` a hold nobody paid for in time (or
-- released). Neither is ever shown to the client as a session.
alter table public.coach_bookings drop constraint if exists coach_bookings_status_check;
alter table public.coach_bookings add constraint coach_bookings_status_check
  check (status in ('active', 'cancelled', 'pending', 'expired'));

alter table public.coach_bookings drop constraint if exists coach_bookings_option_check;
alter table public.coach_bookings add constraint coach_bookings_option_check
  check (option_id is null or option_id in ('half', 'hour'));

-- A hold always says when it ends.
alter table public.coach_bookings drop constraint if exists coach_bookings_hold_expiry;
alter table public.coach_bookings add constraint coach_bookings_hold_expiry
  check (status <> 'pending' or hold_expires_at is not null);

-- Our own rows always know whose calendar and which length they are. Google rows keep nulls.
alter table public.coach_bookings drop constraint if exists coach_bookings_forma_shape;
alter table public.coach_bookings add constraint coach_bookings_forma_shape
  check (source <> 'forma' or (coach_id is not null and option_id is not null));

-- The same slot is never sold twice. See the header for why `pending` is here without its expiry.
alter table public.coach_bookings drop constraint if exists coach_bookings_no_overlap;
alter table public.coach_bookings add constraint coach_bookings_no_overlap
  exclude using gist (coach_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (coach_id is not null and status in ('active', 'pending'));

-- One hold per address at a time (a new pick replaces the old one inside `hold_slot`).
create unique index if not exists coach_bookings_one_hold_idx
  on public.coach_bookings (email) where status = 'pending';

-- One booking per payment: a delivery repeated twice confirms once.
create unique index if not exists coach_bookings_payment_idx
  on public.coach_bookings (payment_id) where payment_id is not null;

create index if not exists coach_bookings_coach_starts_idx
  on public.coach_bookings (coach_id, starts_at) where coach_id is not null;

-- -----------------------------------------------------------------------------
-- 5. The person's own sessions: the same view, two more columns, and never a hold.
--
-- The app maps any status other than `cancelled` to `active` (`asCoachBookingStatus`), so a hold
-- that reached this view would show up as a booked session with no link. Holds are read through
-- `my_booking_hold()` instead.
-- -----------------------------------------------------------------------------
drop view if exists public.my_coach_bookings;
create view public.my_coach_bookings
with (security_invoker = false)
as
  select b.id, b.starts_at, b.ends_at, b.timezone, b.join_url, b.location_kind, b.location_text,
         b.cancel_url, b.reschedule_url, b.status, b.event_name, b.coach_id, b.option_id
  from public.coach_bookings b
  where b.email = public.current_email()
    and b.status in ('active', 'cancelled')
  order by b.starts_at;

revoke all on public.my_coach_bookings from anon, authenticated;
grant select on public.my_coach_bookings to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Slots.
--
-- `booking_slots` is the engine and is granted to nobody: it takes `p_ignore`, the booking being
-- moved, which must not block its own new time. `available_slots` is the public face.
--
-- How a slot is found, in the coach's zone:
--   1. every local date between the bounds;
--   2. the weekly rules of that weekday, unless the day is off entirely, plus `extra` windows;
--   3. cut into 30-minute cells on the :00/:30 grid that fit inside a window (10:15–12:00 gives
--      10:30, 11:00, 11:30), minus the cells an `off` window touches;
--   4. a start is a cell followed by enough cells for the option (one for half, two for hour);
--   5. at least `booking_lead_time()` from now and less than `booking_horizon()` ahead;
--   6. not overlapping an active booking or a live hold of this coach. Rows from the Google
--      calendar carry no coach and are Sergey's (google-calendar-sync reads his calendar only).
-- -----------------------------------------------------------------------------
create or replace function public.booking_slots(
  p_coach  text,
  p_option text,
  p_from   timestamptz,
  p_to     timestamptz,
  p_ignore uuid default null
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  with c as (
    select co.id, co.timezone, public.booking_option_minutes(p_option) as minutes
    from public.coaches co
    where co.id = p_coach and co.active
  ),
  bounds as (
    select greatest(p_from, now() + public.booking_lead_time()) as lo,
           least(p_to, now() + public.booking_horizon()) as hi
  ),
  days as (
    select gs::date as day
    from c, bounds,
         generate_series((bounds.lo at time zone c.timezone)::date,
                         (bounds.hi at time zone c.timezone)::date,
                         interval '1 day') as gs
    where bounds.lo < bounds.hi
  ),
  windows as (
    select d.day, r.start_time, r.end_time
    from days d
    join public.coach_availability r
      on r.coach_id = p_coach and r.weekday = extract(isodow from d.day)
    where not exists (
      select 1 from public.coach_availability_exceptions e
      where e.coach_id = p_coach and e.date = d.day and e.kind = 'off' and e.start_time is null
    )
    union all
    select d.day, e.start_time, e.end_time
    from days d
    join public.coach_availability_exceptions e
      on e.coach_id = p_coach and e.date = d.day and e.kind = 'extra'
  ),
  cells as (
    select distinct w.day, cell
    from windows w,
         generate_series(date_trunc('hour', w.day + w.start_time),
                         w.day + w.end_time - interval '30 minutes',
                         interval '30 minutes') as cell
    where cell >= w.day + w.start_time
      and cell + interval '30 minutes' <= w.day + w.end_time
      and not exists (
        select 1 from public.coach_availability_exceptions e
        where e.coach_id = p_coach and e.date = w.day and e.kind = 'off'
          and e.start_time is not null
          and cell < w.day + e.end_time
          and cell + interval '30 minutes' > w.day + e.start_time
      )
  ),
  starts as (
    select (s.cell at time zone c.timezone) as starts_at,
           (s.cell at time zone c.timezone) + make_interval(mins => c.minutes) as ends_at
    from cells s, c
    where (select count(*) from cells n
           where n.cell >= s.cell and n.cell < s.cell + make_interval(mins => c.minutes))
          = c.minutes / 30
  )
  select st.starts_at, st.ends_at
  from starts st, bounds
  where st.starts_at >= bounds.lo
    and st.starts_at < bounds.hi
    and not exists (
      select 1 from public.coach_bookings b
      where (b.coach_id = p_coach or (b.coach_id is null and p_coach = 'sergey'))
        and b.id is distinct from p_ignore
        and (b.status = 'active' or (b.status = 'pending' and b.hold_expires_at > now()))
        and b.starts_at < st.ends_at
        and b.ends_at > st.starts_at
    )
  order by st.starts_at;
$$;

revoke execute on function public.booking_slots(text, text, timestamptz, timestamptz, uuid)
  from public, anon, authenticated;

comment on function public.booking_slots(text, text, timestamptz, timestamptz, uuid) is
  'Free starts for a coach and an option (0055); p_ignore = the booking being moved. Internal.';

create or replace function public.available_slots(
  p_coach  text,
  p_option text,
  p_from   timestamptz default now(),
  p_to     timestamptz default now() + interval '14 days'
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  -- A coach the caller may not book has no free time for them (her card is not shown either).
  select s.starts_at, s.ends_at
  from public.booking_slots(p_coach, p_option, p_from, p_to, null) s
  where public.booking_coach_visible(p_coach);
$$;

revoke execute on function public.available_slots(text, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.available_slots(text, text, timestamptz, timestamptz)
  to authenticated, service_role;

comment on function public.available_slots(text, text, timestamptz, timestamptz) is
  'Free starts of a coach for half or hour (0055): weekly rules, then exceptions, minus bookings and live holds, lead time, 30-minute grid, 60 days.';

-- -----------------------------------------------------------------------------
-- 7. Dead holds make room. Internal: called by every path that is about to take a slot.
-- -----------------------------------------------------------------------------
create or replace function public.booking_sweep_holds(p_coach text)
returns int
language sql
security definer
set search_path = pg_catalog, public, extensions
as $$
  with done as (
    update public.coach_bookings
       set status = 'expired'
     where status = 'pending'
       and hold_expires_at <= now()
       and (p_coach is null or coach_id = p_coach)
    returning 1
  )
  select count(*)::int from done;
$$;

revoke execute on function public.booking_sweep_holds(text) from public, anon, authenticated;
grant execute on function public.booking_sweep_holds(text) to service_role;

-- -----------------------------------------------------------------------------
-- 8. Client RPCs: hold, release, see the hold, move.
--
-- Error codes, not text, as in 0034/0043: the app reads them.
--   not_signed_in (42501) · coach_unavailable · invalid_option · slot_taken · rate_limited ·
--   not_found · too_late
-- Except `hold_slot`, which answers a taken slot with no row (see there).
-- -----------------------------------------------------------------------------
create or replace function public.hold_slot(p_coach text, p_option text, p_starts_at timestamptz)
returns table (id uuid, coach_id text, option_id text, starts_at timestamptz, ends_at timestamptz,
               hold_expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window constant interval := interval '1 hour';
  c_max    constant int := 20;
  v_uid    uuid := auth.uid();
  v_email  citext := public.current_email();
  v_coach  public.coaches%rowtype;
  v_min    int;
  v_hits   int;
  v_old    uuid;
  v_id     uuid := gen_random_uuid();
begin
  if v_uid is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  v_min := public.booking_option_minutes(p_option);

  -- Nastia is bookable exactly where her card is shown: with the flag (0049), or for an admin.
  select * into v_coach from public.coaches c where c.id = p_coach and c.active;
  if not found or not public.booking_coach_visible(p_coach) then
    raise exception 'coach_unavailable' using errcode = 'P0001';
  end if;

  -- A hold blocks a slot for everybody for 20 minutes, so taking one costs something: the same
  -- sliding window as claim_payment(), per account. A taken slot is an empty answer rather than
  -- an error for this reason: an error would roll the counter back, and probing would be free.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('hold:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;
  if v_hits > c_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  -- The person's current hold does not stand in the way of their own new pick (30 → 60 at the
  -- same start), and it survives a pick that fails: it goes only when the new one is taken.
  select b.id into v_old from public.coach_bookings b
  where b.email = v_email and b.status = 'pending';
  perform public.booking_sweep_holds(p_coach);

  if not exists (
    select 1 from public.booking_slots(p_coach, p_option, p_starts_at,
                                       p_starts_at + interval '1 minute', v_old) s
    where s.starts_at = p_starts_at
  ) then
    return;  -- slot_taken
  end if;

  begin
    update public.coach_bookings b
       set status = 'expired', cancel_reason = 'released'
     where b.email = v_email and b.status = 'pending';
    insert into public.coach_bookings (
      id, email, external_id, external_event_id, starts_at, ends_at, timezone, status, source,
      coach_id, option_id, hold_expires_at
    ) values (
      v_id, v_email, 'forma:' || v_id::text, 'forma:' || v_id::text, p_starts_at,
      p_starts_at + make_interval(mins => v_min), v_coach.timezone, 'pending', 'forma',
      p_coach, p_option, now() + public.booking_hold_time()
    );
  exception when exclusion_violation or unique_violation then
    -- Somebody took it between the check and the insert. The block rolls back to its start, so
    -- the old hold is back as it was.
    return;  -- slot_taken
  end;

  return query
  select b.id, b.coach_id, b.option_id, b.starts_at, b.ends_at, b.hold_expires_at
  from public.coach_bookings b where b.id = v_id;
end;
$$;

revoke execute on function public.hold_slot(text, text, timestamptz) from public, anon;
grant execute on function public.hold_slot(text, text, timestamptz) to authenticated;

comment on function public.hold_slot(text, text, timestamptz) is
  'Hold a free slot for 20 minutes while the client pays (0055). One live hold per address; a new one replaces it. No row = slot_taken.';

create or replace function public.release_hold()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext := public.current_email();
  v_n     int;
begin
  if auth.uid() is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  update public.coach_bookings
     set status = 'expired', cancel_reason = 'released'
   where email = v_email and status = 'pending';
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

revoke execute on function public.release_hold() from public, anon;
grant execute on function public.release_hold() to authenticated;

-- The caller's live hold, for the countdown after a reload; no row when there is none.
create or replace function public.my_booking_hold()
returns table (id uuid, coach_id text, option_id text, starts_at timestamptz, ends_at timestamptz,
               hold_expires_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select b.id, b.coach_id, b.option_id, b.starts_at, b.ends_at, b.hold_expires_at
  from public.coach_bookings b
  where b.email = public.current_email()
    and b.status = 'pending'
    and b.hold_expires_at > now();
$$;

revoke execute on function public.my_booking_hold() from public, anon;
grant execute on function public.my_booking_hold() to authenticated;

/*
 * The client moves their own session: only 24 hours or more before it, only into a slot the
 * coach offers for the same length, and only a booking made here (a Google row has no coach).
 * Nothing else about the booking changes — the payment stays with it.
 */
create or replace function public.move_my_booking(p_id uuid, p_new_starts_at timestamptz)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window constant interval := interval '1 hour';
  c_max    constant int := 10;
  v_uid    uuid := auth.uid();
  v_email  citext := public.current_email();
  v_row    public.coach_bookings%rowtype;
  v_hits   int;
begin
  if v_uid is null or v_email is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  select * into v_row from public.coach_bookings b
  where b.id = p_id and b.email = v_email and b.status = 'active' and b.coach_id is not null
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if now() > v_row.starts_at - public.booking_move_cutoff() then
    raise exception 'too_late' using errcode = 'P0001';
  end if;

  -- Every move writes to the coach's channel and the client's bot: not a loop anybody should run.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('move:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;
  if v_hits > c_max then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  perform public.booking_sweep_holds(v_row.coach_id);
  if not exists (
    select 1 from public.booking_slots(v_row.coach_id, v_row.option_id, p_new_starts_at,
                                       p_new_starts_at + interval '1 minute', v_row.id) s
    where s.starts_at = p_new_starts_at
  ) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;

  begin
    update public.coach_bookings b
       set starts_at = p_new_starts_at,
           ends_at   = p_new_starts_at + (v_row.ends_at - v_row.starts_at)
     where b.id = v_row.id;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;

  return query select b.id, b.starts_at, b.ends_at from public.coach_bookings b where b.id = v_row.id;
end;
$$;

revoke execute on function public.move_my_booking(uuid, timestamptz) from public, anon;
grant execute on function public.move_my_booking(uuid, timestamptz) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Admin RPCs.
--
-- The admin moves to any future time the coach agreed to — not only to a published slot — but
-- never on top of another session (the constraint says `slot_taken`). A cancellation keeps the
-- row, like 0014; money goes back, when it does, by hand in the till.
-- -----------------------------------------------------------------------------
create or replace function public.admin_move_booking(p_id uuid, p_new_starts_at timestamptz)
returns table (id uuid, starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_row public.coach_bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select * into v_row from public.coach_bookings b
  where b.id = p_id and b.status = 'active'
  for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if p_new_starts_at is null or p_new_starts_at <= now() then
    raise exception 'invalid_times' using errcode = 'P0001';
  end if;

  perform public.booking_sweep_holds(v_row.coach_id);
  -- The constraint covers our own rows only. Sergey's Google rows carry no coach, and a session
  -- must not land on one of them either.
  if v_row.coach_id is not null and exists (
    select 1 from public.coach_bookings b
    where b.coach_id is null and v_row.coach_id = 'sergey'
      and b.id <> v_row.id
      and b.status = 'active'
      and b.starts_at < p_new_starts_at + (v_row.ends_at - v_row.starts_at)
      and b.ends_at > p_new_starts_at
  ) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;
  begin
    update public.coach_bookings b
       set starts_at = p_new_starts_at,
           ends_at   = p_new_starts_at + (v_row.ends_at - v_row.starts_at)
     where b.id = v_row.id;
  exception when exclusion_violation then
    raise exception 'slot_taken' using errcode = 'P0001';
  end;

  return query select b.id, b.starts_at, b.ends_at from public.coach_bookings b where b.id = v_row.id;
end;
$$;

revoke execute on function public.admin_move_booking(uuid, timestamptz) from public, anon;
grant execute on function public.admin_move_booking(uuid, timestamptz) to authenticated;

create or replace function public.admin_cancel_booking(p_id uuid, p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  update public.coach_bookings b
     set status        = 'cancelled',
         cancel_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 500)
   where b.id = p_id and b.status = 'active'
  returning b.id into v_id;
  if v_id is null then
    /*
     * A hold is not a session: the client never booked or paid for it, so it must not turn up
     * among their sessions as a cancelled one. It ends like a released hold, with a reason that
     * also keeps a late payment from confirming it (`apply_session_payment`).
     */
    update public.coach_bookings b
       set status = 'expired', cancel_reason = 'cancelled_by_admin'
     where b.id = p_id and b.status = 'pending'
    returning b.id into v_id;
  end if;
  if v_id is null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  return v_id;
end;
$$;

revoke execute on function public.admin_cancel_booking(uuid, text) from public, anon;
grant execute on function public.admin_cancel_booking(uuid, text) to authenticated;

-- Every coach with the private columns, for the admin's editor.
create or replace function public.admin_coaches()
returns table (id text, name text, name_en text, email text, room_url text, timezone text,
               active boolean, flag text, sort_order int)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  return query
  select c.id, c.name, c.name_en, c.email::text, c.room_url, c.timezone, c.active, c.flag, c.sort_order
  from public.coaches c
  order by c.sort_order, c.id;
end;
$$;

revoke execute on function public.admin_coaches() from public, anon;
grant execute on function public.admin_coaches() to authenticated;

/*
 * Save a coach's details. A new room link reaches the sessions already booked with the old one
 * — they are the same room moved, and a client should not have to find out at the start time.
 * Null leaves a field as it is; an empty string clears the address or the link.
 */
create or replace function public.admin_save_coach(
  p_id       text,
  p_name     text default null,
  p_name_en  text default null,
  p_email    text default null,
  p_room_url text default null,
  p_timezone text default null,
  p_active   boolean default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_old public.coaches%rowtype;
  v_new public.coaches%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  select * into v_old from public.coaches where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if p_timezone is not null and not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'invalid_timezone' using errcode = 'P0001';
  end if;

  update public.coaches c
     set name     = coalesce(nullif(btrim(p_name), ''), c.name),
         name_en  = case when p_name_en is null then c.name_en else nullif(btrim(p_name_en), '') end,
         email    = case when p_email is null then c.email
                         when btrim(p_email) = '' then null
                         else public.normalize_email(p_email) end,
         room_url = case when p_room_url is null then c.room_url
                         else nullif(btrim(p_room_url), '') end,
         timezone = coalesce(p_timezone, c.timezone),
         active   = coalesce(p_active, c.active)
   where c.id = p_id
  returning * into v_new;

  if v_new.room_url is distinct from v_old.room_url and v_new.room_url is not null then
    update public.coach_bookings b
       set join_url = v_new.room_url
     where b.coach_id = p_id and b.status = 'active' and b.ends_at > now();
  end if;
  return v_new.id;
end;
$$;

revoke execute on function public.admin_save_coach(text, text, text, text, text, text, boolean) from public, anon;
grant execute on function public.admin_save_coach(text, text, text, text, text, text, boolean) to authenticated;

/*
 * Replace a coach's weekly rules in one go: the editor sends the whole week as
 * `[{"weekday": 1, "start": "10:00", "end": "14:00"}, …]`. One transaction, so a half-saved week
 * never offers slots nobody meant.
 */
create or replace function public.admin_set_availability(p_coach text, p_rules jsonb)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_rule jsonb;
  v_n    int := 0;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
  if not exists (select 1 from public.coaches where id = p_coach) then
    raise exception 'not_found' using errcode = 'P0001';
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
  return v_n;
end;
$$;

revoke execute on function public.admin_set_availability(text, jsonb) from public, anon;
grant execute on function public.admin_set_availability(text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- 10. apply_session_payment — the webhook's half. Service role only.
--
-- Returns the confirmed booking's id, or null when the payment matched nothing. In order:
--   * the payment is found by the id `record_payment()` returned (the webhook passes it, so a
--     Prodamus payment without an order number is still one row), else by its order number; no
--     row at all → nothing is booked;
--   * this payment already confirmed a booking (a repeated delivery): that booking;
--   * the payer's addresses are the paid one plus the account's own when the paid one was linked
--     to an account (`payment_emails`, 0020): the hold was made under the account's address;
--   * the live hold for this option: confirmed;
--   * otherwise the newest booking row of those addresses from the last two days decides. It is
--     confirmed only when it is a hold that simply ran out — not one the client gave up for
--     another pick (`released`), not one the admin ended, not a session already paid — for this
--     option, still ahead and on a slot still free (the client paid slowly, nobody lost);
--   * otherwise nothing is booked, the payment stays unapplied in the ledger, and the owner's
--     channel gets `session_unmatched` with the reason.
-- The option is written onto the payment either way, so `claim_payment()` can confirm the hold
-- later when the client claims a payment made from another address.
-- -----------------------------------------------------------------------------
alter table public.payments add column if not exists session_option text;
alter table public.payments drop constraint if exists payments_session_option_check;
alter table public.payments add constraint payments_session_option_check
  check (session_option is null or session_option in ('half', 'hour'));

comment on column public.payments.session_option is
  'The booking option a session payment was for (0055), written by apply_session_payment; read by claim_payment.';

drop function if exists public.apply_session_payment(text, text, text, timestamptz);

create or replace function public.apply_session_payment(
  p_email        text,
  p_provider_ref text,
  p_option       text,
  p_paid_at      timestamptz default now(),
  p_payment_id   uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email   citext;
  v_emails  citext[];
  v_ref     text := nullif(btrim(coalesce(p_provider_ref, '')), '');
  v_payment public.payments%rowtype;
  v_hold    public.coach_bookings%rowtype;
  v_room    text;
  v_id      uuid;
  v_reason  text;
begin
  if coalesce(current_setting('request.jwt.claims', true), '') <> ''
     and coalesce(current_setting('request.jwt.claims', true)::json ->> 'role', '') <> 'service_role' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  perform public.booking_option_minutes(p_option);
  begin
    v_email := public.normalize_email(p_email);
  exception when others then
    return null;
  end;

  if p_payment_id is not null then
    select * into v_payment from public.payments where id = p_payment_id for update;
  end if;
  if v_payment.id is null and v_ref is not null then
    select * into v_payment from public.payments where provider_ref = v_ref for update;
  end if;

  if v_payment.id is null then
    -- Without its row the payment can be neither marked applied nor claimed: book nothing.
    v_reason := 'no_payment';
  else
    select b.id into v_id from public.coach_bookings b where b.payment_id = v_payment.id;
    if v_id is not null then
      return v_id;
    end if;
    update public.payments set session_option = p_option
     where id = v_payment.id and session_option is distinct from p_option;

    select array_agg(distinct e) into v_emails
    from (
      select v_email as e
      union all
      select u.email::citext
      from public.payment_emails pe
      join auth.users u on u.id = pe.user_id
      where pe.email = v_email and u.email is not null and u.email <> ''
    ) x;

    -- The live hold first.
    select * into v_hold from public.coach_bookings b
    where b.email = any (v_emails) and b.status = 'pending' and b.option_id = p_option
      and b.hold_expires_at > now()
    order by b.created_at desc
    limit 1
    for update;

    if not found then
      select * into v_hold from public.coach_bookings b
      where b.email = any (v_emails) and b.source = 'forma'
        and b.created_at > now() - interval '2 days'
      order by b.created_at desc
      limit 1
      for update;

      if not found
         or v_hold.status not in ('pending', 'expired')
         or v_hold.cancel_reason is not null then
        v_reason := 'no_hold';
      elsif v_hold.option_id is distinct from p_option then
        v_reason := 'option_mismatch';
      elsif v_hold.starts_at <= now() then
        v_reason := 'hold_in_past';
      else
        perform public.booking_sweep_holds(v_hold.coach_id);
        if exists (
          select 1 from public.coach_bookings b
          where (b.coach_id = v_hold.coach_id or (b.coach_id is null and v_hold.coach_id = 'sergey'))
            and b.id <> v_hold.id
            and (b.status = 'active' or (b.status = 'pending' and b.hold_expires_at > now()))
            and b.starts_at < v_hold.ends_at and b.ends_at > v_hold.starts_at
        ) then
          v_reason := 'slot_taken';
        end if;
      end if;
    end if;
  end if;

  if v_reason is null then
    select c.room_url into v_room from public.coaches c where c.id = v_hold.coach_id;
    begin
      update public.coach_bookings b
         set status          = 'active',
             payment_id      = v_payment.id,
             join_url        = v_room,
             location_kind   = case when v_room is not null then 'room' else b.location_kind end,
             cancel_reason   = null
       where b.id = v_hold.id;
    exception when exclusion_violation then
      v_reason := 'slot_taken';
    end;
  end if;

  if v_reason is null then
    update public.payments set applied = true where id = v_payment.id;
    return v_hold.id;
  end if;

  -- Nothing booked. The mirror never costs the webhook its answer (0040).
  begin
    perform public.enqueue_admin(
      'sessions',
      'session_unmatched',
      'session_unmatched:' || coalesce(v_payment.id::text, v_ref, gen_random_uuid()::text),
      jsonb_build_object(
        'paymentId', coalesce(v_payment.id::text, ''),
        'email', v_email::text,
        'option', p_option,
        'reason', v_reason,
        'amount', coalesce(v_payment.amount::text, ''),
        'currency', coalesce(v_payment.currency, ''),
        'provider', coalesce(v_payment.provider, ''),
        'ref', coalesce(v_ref, v_payment.provider_ref, ''),
        'startsAt', coalesce(v_hold.starts_at::text, ''),
        'coach', coalesce(v_hold.coach_id, '')
      )
    );
  exception when others then
    null;
  end;
  return null;
end;
$$;

revoke execute on function public.apply_session_payment(text, text, text, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.apply_session_payment(text, text, text, timestamptz, uuid) to service_role;

comment on function public.apply_session_payment(text, text, text, timestamptz, uuid) is
  'Service role only (0055): a session was paid — confirm the payer''s hold for that option; null and an owner alert when nothing matches.';

-- -----------------------------------------------------------------------------
-- 10a. claim_payment — a session paid from another address confirms its hold.
--
-- The text of 0044 with one branch changed. Until now a claimed session payment only linked the
-- address (`linked`): there was nothing to open. Now the client's hold is under the account's
-- address, so the claim runs `apply_session_payment()` for it with the option the webhook wrote
-- onto the payment, and answers `session` when that booked the slot.
-- -----------------------------------------------------------------------------
create or replace function public.claim_payment(p_provider_ref text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  c_window   constant interval := interval '1 hour';
  c_max      constant int := 10;
  v_uid      uuid := auth.uid();
  v_mine     citext := public.current_email();
  v_ref      text := nullif(btrim(coalesce(p_provider_ref, '')), '');
  v_hits     int;
  v_payment  public.payments%rowtype;
  v_owner    uuid;
  v_result   text;
  v_claims   text;
  v_mark     boolean := true;
begin
  if v_uid is null or v_mine is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  if v_ref is null or length(v_ref) > 120 then
    return 'not_found';
  end if;

  -- The same sliding window as create_order(). Counted before the lookup, so failed tries cost too.
  insert into public.order_throttle as t (bucket, window_start, hits)
  values ('claim:' || v_uid::text, now(), 1)
  on conflict (bucket) do update
  set window_start = case when t.window_start < now() - c_window then now() else t.window_start end,
      hits         = case when t.window_start < now() - c_window then 1 else t.hits + 1 end
  returning hits into v_hits;

  if v_hits > c_max then
    return 'rate_limited';
  end if;

  select * into v_payment
  from public.payments
  where provider_ref = v_ref
    and claimed_by is null
    and resolution is null
  for update;

  if not found then
    return 'not_found';
  end if;

  -- Is the address already somebody's? This account's is fine; another's is a stop, said aloud.
  select user_id into v_owner from public.payment_emails where email = v_payment.email;
  if v_owner is not null and v_owner <> v_uid then
    return 'email_taken';
  end if;

  if v_payment.email <> v_mine and v_owner is null then
    insert into public.payment_emails (user_id, email, linked_by)
    values (v_uid, v_payment.email, v_ref);
  end if;

  /*
   * Applied to the account's own address. Why the claims are cleared here, and why that is not a
   * hole, is in 0020/0039: plan, order number, date and option are read from the `payments` row
   * the webhook wrote after a matching signature, and the address is the caller's confirmed one.
   */
  v_claims := coalesce(current_setting('request.jwt.claims', true), '');
  perform set_config('request.jwt.claims', '', true);

  if v_payment.intent = 'session' then
    v_result := 'linked';
    if v_payment.session_option is not null
       and public.apply_session_payment(
             v_mine::text, v_payment.provider_ref, v_payment.session_option, v_payment.paid_at,
             v_payment.id) is not null then
      v_result := 'session';
    end if;
  elsif v_payment.intent in ('monthly', 'annual') then
    perform public.apply_subscription_payment(
      v_mine::text, v_payment.intent, v_payment.provider_ref, v_payment.paid_at,
      coalesce(v_payment.provider, 'prodamus'));
    v_result := 'subscription';
  elsif public.apply_course_payment(
          v_mine::text, v_payment.provider_ref, v_payment.paid_at, null,
          coalesce(v_payment.provider, 'prodamus')) is not null then
    v_result := 'course';
  else
    -- No pending order (or several). The payment is left alone, to be claimed again.
    v_result := 'no_order';
    v_mark := false;
  end if;

  perform set_config('request.jwt.claims', v_claims, true);

  if v_mark then
    update public.payments
    set claimed_by = v_uid,
        claimed_at = now(),
        applied    = true
    where id = v_payment.id;
  else
    -- A mirror, not a condition: a queue failure must not cost the person the answer (0040).
    begin
      perform public.enqueue_admin(
        'courses',
        'claim_no_order',
        'claim_no_order:' || v_payment.id::text,
        jsonb_build_object(
          'paymentId', v_payment.id::text,
          'email', v_mine::text,
          'payEmail', v_payment.email::text,
          'amount', coalesce(v_payment.amount::text, ''),
          'currency', coalesce(v_payment.currency, ''),
          'provider', coalesce(v_payment.provider, ''),
          'ref', coalesce(v_payment.provider_ref, '')
        )
      );
    exception when others then
      null;
    end;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.claim_payment(text) from public, anon;
grant execute on function public.claim_payment(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 11. The client's bot messages.
--
-- Params are the contract of `sessionMessage` in telegram-notify/copy.ts: starts_at, minutes, tz,
-- coach, coach_en, join_url, from_starts_at (a move), hours_before (a reminder). Only our own rows
-- (with a coach); a Google row's client got Google's own mail.
--
-- Wrapped like 0040: a message is a mirror of the booking, and a failure to queue one must never
-- roll back a payment or a move.
-- -----------------------------------------------------------------------------
create or replace function public.booking_params(p_row public.coach_bookings)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'starts_at', p_row.starts_at,
    'minutes', round(extract(epoch from (p_row.ends_at - p_row.starts_at)) / 60)::int,
    'tz', coalesce(c.timezone, p_row.timezone),
    'coach', c.name,
    'coach_en', c.name_en,
    'join_url', p_row.join_url
  ))
  from public.coaches c
  where c.id = p_row.coach_id;
$$;

revoke execute on function public.booking_params(public.coach_bookings) from public, anon, authenticated;

/*
 * What makes a message key unique to one state of a booking: its start and the moment it was
 * last written. The start alone is not enough — a session moved from Tuesday to Thursday and
 * back to Tuesday would find Tuesday's reminders already in the queue (skipped at the first move)
 * and queue nothing, since `enqueue_telegram` does nothing on a key it has seen.
 */
create or replace function public.booking_version(p_row public.coach_bookings)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select floor(extract(epoch from p_row.starts_at))::bigint::text || '.'
         || floor(extract(epoch from p_row.updated_at) * 1000000)::bigint::text
$$;

revoke execute on function public.booking_version(public.coach_bookings) from public, anon, authenticated;

create or replace function public.booking_skip_reminders(p_id uuid, p_why text)
returns void
language sql
security definer
set search_path = pg_catalog, public, extensions
as $$
  -- The reminders for the old time, and a `session_moved` not yet sent: it names a time that is
  -- no longer the session's, and the next message says the right one.
  update public.telegram_outbox
     set status = 'skipped', last_error = left(p_why, 500)
   where kind in ('session_reminder', 'session_moved')
     and status = 'pending'
     and (dedupe_key like 'session_reminder:' || p_id::text || ':%'
          or dedupe_key like 'session_moved:' || p_id::text || ':%');
$$;

revoke execute on function public.booking_skip_reminders(uuid, text) from public, anon, authenticated;

create or replace function public.booking_queue_reminders(p_row public.coach_bookings)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_hours int;
  v_at    timestamptz;
  v_base  jsonb := public.booking_params(p_row);
begin
  foreach v_hours in array array[24, 1] loop
    v_at := p_row.starts_at - make_interval(hours => v_hours);
    -- A reminder whose moment has passed says nothing the confirmation did not.
    continue when v_at <= now();
    perform public.enqueue_telegram(
      p_row.email::text,
      'session_reminder',
      'session_reminder:' || p_row.id::text || ':' || public.booking_version(p_row) || ':'
        || v_hours::text,
      v_base || jsonb_build_object('hours_before', v_hours),
      v_at,
      -- Gone once the next reminder (or the session) makes it stale.
      case when v_hours = 24 then interval '23 hours' else interval '55 minutes' end
    );
  end loop;
end;
$$;

revoke execute on function public.booking_queue_reminders(public.coach_bookings) from public, anon, authenticated;

create or replace function public.coach_bookings_notify_client()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_was_active boolean := tg_op = 'UPDATE' and old.status = 'active';
  v_left       interval := new.starts_at - now();
begin
  if new.coach_id is null then
    return new;
  end if;
  begin
    if new.status = 'active' and not v_was_active then
      -- Paid: the confirmation (while the session is still ahead) and the reminders.
      if v_left > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_confirmed', 'session_confirmed:' || new.id::text,
          public.booking_params(new), now(), least(interval '3 days', v_left));
      end if;
      perform public.booking_queue_reminders(new);

    elsif new.status = 'active' and v_was_active and old.starts_at is distinct from new.starts_at then
      perform public.booking_skip_reminders(new.id, 'booking moved');
      if v_left > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_moved',
          'session_moved:' || new.id::text || ':' || public.booking_version(new),
          public.booking_params(new) || jsonb_build_object('from_starts_at', old.starts_at),
          now(), least(interval '3 days', v_left));
      end if;
      perform public.booking_queue_reminders(new);

    elsif new.status = 'cancelled' and v_was_active then
      perform public.booking_skip_reminders(new.id, 'booking cancelled');
      if v_left > interval '0' then
        perform public.enqueue_telegram(
          new.email::text, 'session_cancelled', 'session_cancelled:' || new.id::text,
          public.booking_params(new) - 'join_url', now(), least(interval '3 days', v_left));
      end if;
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists coach_bookings_notify_client on public.coach_bookings;
create trigger coach_bookings_notify_client
  after insert or update of status, starts_at on public.coach_bookings
  for each row execute function public.coach_bookings_notify_client();

-- -----------------------------------------------------------------------------
-- 12. The owner's channel (0040), taught about holds.
--
-- 0040 spoke on every insert. A hold is an insert now, and twenty minutes of somebody deciding
-- are not «Выбрали время»; an expired hold is nothing at all. So: a row that becomes active (a
-- Google insert, or a paid hold), a move of an active row, a cancellation of an active one. The
-- coach's name rides along, since there are two calendars now.
-- -----------------------------------------------------------------------------
create or replace function public.coach_bookings_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_kind       text;
  v_was_active boolean := tg_op = 'UPDATE' and old.status = 'active';
begin
  begin
    if new.status = 'active' and not v_was_active then
      v_kind := 'session_booked';
    elsif new.status = 'cancelled' and v_was_active then
      v_kind := 'session_cancelled';
    elsif new.status = 'active' and v_was_active and old.starts_at is distinct from new.starts_at then
      v_kind := 'session_moved';
    end if;

    if v_kind is not null then
      perform public.enqueue_admin(
        'sessions',
        v_kind,
        v_kind || ':' || new.external_id || ':' || public.booking_version(new),
        jsonb_build_object(
          'email', new.email::text,
          'startsAt', new.starts_at::text,
          'minutes', greatest(1, round(extract(epoch from (new.ends_at - new.starts_at)) / 60)::int),
          'timezone', coalesce(new.timezone, ''),
          'eventName', coalesce(new.event_name, ''),
          'coach', coalesce((select c.name from public.coaches c where c.id = new.coach_id), '')
        )
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end;
$$;

drop trigger if exists coach_bookings_notify_admin on public.coach_bookings;
create trigger coach_bookings_notify_admin
  after insert or update of status, starts_at on public.coach_bookings
  for each row execute function public.coach_bookings_notify_admin();

grant select, insert, update, delete on public.coach_bookings to service_role;

notify pgrst, 'reload schema';
