-- =============================================================================
-- 0011 — Marathons: the second format.
--
-- A course is a programme you walk at your own pace. A marathon is a *game played on a calendar*:
-- every day the coach sets tasks, you do them and send proof, and on Sunday night the week's
-- leaderboard decides who gets an hour with him. The two formats share almost nothing — a course
-- day is authored once and replayed by everyone whenever they reach it, a marathon day happens to
-- everyone at the same time and only once — so this is its own set of tables rather than a flag on
-- the course builder.
--
-- The shape, smallest to largest:
--
--   marathon              a run: when it starts, how many days, how big a team is
--   marathon_teams        the pairs (a marathon may have none — then everyone plays solo)
--   marathon_members      who is in, keyed on email like purchases, so the coach can add someone
--                         before they have ever opened the app
--   marathon_tasks        one row per task per day — this is the thing he creates every morning
--   marathon_submissions  one row per (task, member): the proof
--   marathon_adjustments  the coach's manual ±points, with a reason
--
-- Four decisions this schema encodes, because they are the ones that shaped it:
--
--   1. Points are computed, never stored. `marathon_scores` derives the board from submissions and
--      adjustments every time it is called. That is what makes voiding a fake proof, moving someone
--      between teams or fixing a task's points *correct the history* instead of leaving a stale
--      balance behind. Marathons are small — tens of people, tens of days — so the cost is nothing.
--   2. Proof is trusted on arrival. A submission counts the moment it is sent; the coach can void
--      it afterwards with a reason. The alternative — approve-then-count — needs someone to clear a
--      queue every single evening or the board is simply wrong, and a daily format cannot depend on
--      that.
--   3. The coach forms the teams. Membership and pairing are admin writes; nothing in the app
--      creates or joins a team.
--   4. The week is the race. Day 1..7 is week 1, 8..14 week 2, counted from the marathon's own
--      start rather than from Monday, so a marathon can begin on any weekday and every week is a
--      full seven days. `marathon_scores` takes a week and defaults to the current one.
--
-- A member never reads another member's row directly: `marathon_members` carries an email, and
-- nothing in the app needs it. Members go through `marathon_roster()` (security definer, names
-- only). The same reasoning as purchases, where a customer has no select at all.
--
-- Requires 0001_init.sql (profiles, is_admin, current_email, set_updated_at).
-- =============================================================================

-- The leaderboard and the roster join profiles on email; profiles had no index on it.
create index if not exists profiles_email_idx on public.profiles (email);

-- -----------------------------------------------------------------------------
-- marathons
-- -----------------------------------------------------------------------------
create table if not exists public.marathons (
  id          uuid primary key default gen_random_uuid(),
  -- Stable handle for links and for the app's route; same format rule as a course id.
  slug        text not null unique check (slug ~ '^[a-z0-9_]{2,40}$'),
  title       text not null check (length(title) between 1 and 120),
  description text check (description is null or length(description) <= 2000),

  -- draft    being built; invisible to members
  -- active   running; members see today's tasks
  -- finished over; the board stays readable, nothing new can be submitted
  -- archived hidden from the admin list
  status      text not null default 'draft'
              check (status in ('draft', 'active', 'finished', 'archived')),

  starts_on   date not null,
  -- Length in days. 100 is far past anything a daily-proof format survives; it is a guard rail,
  -- not a target.
  days        int not null default 28 check (days between 1 and 100),
  -- 2 is Sergey's format (a pair, both must deliver); 1 makes every member their own entry.
  team_size   int not null default 2 check (team_size between 1 and 6),

  /*
   * The marathon's clock. A day ends at `due_time` *here*, not in the athlete's phone: the whole
   * point of a shared deadline is that it is the same instant for everyone, and the coach is the
   * one who decides when the day closes.
   */
  timezone    text not null default 'Europe/Moscow' check (length(timezone) between 3 and 64),
  due_time    time not null default '22:00',

  -- The prize, as words. Shown on top of the board; the coach may run a marathon without one.
  prize       text check (prize is null or length(prize) <= 200),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.marathons is
  'A marathon: daily tasks, proof, weekly leaderboard. Points are derived by marathon_scores(), never stored.';

-- A timezone the server cannot resolve would make every deadline in the marathon wrong, and the
-- error would surface days later in the scores. Reject it at write time instead.
create or replace function public.marathons_check_timezone()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'unknown_timezone'
      using errcode = 'P0001', hint = 'use an IANA name such as Europe/Moscow';
  end if;
  return new;
end;
$$;

drop trigger if exists marathons_check_timezone on public.marathons;
create trigger marathons_check_timezone
  before insert or update of timezone on public.marathons
  for each row execute function public.marathons_check_timezone();

create index if not exists marathons_status_idx on public.marathons (status, starts_on desc);

drop trigger if exists marathons_touch on public.marathons;
create trigger marathons_touch
  before update on public.marathons
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- marathon_teams
-- -----------------------------------------------------------------------------
create table if not exists public.marathon_teams (
  id          uuid primary key default gen_random_uuid(),
  marathon_id uuid not null references public.marathons (id) on delete cascade,
  name        text not null check (length(name) between 1 and 60),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (marathon_id, name)
);

comment on table public.marathon_teams is 'Teams inside one marathon. The coach forms them; nothing in the app does.';

create index if not exists marathon_teams_marathon_idx on public.marathon_teams (marathon_id, sort_order);

drop trigger if exists marathon_teams_touch on public.marathon_teams;
create trigger marathon_teams_touch
  before update on public.marathon_teams
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- marathon_members
--
-- Keyed on email, exactly like purchases: the coach adds «Ваня» from his Telegram group long
-- before Ваня signs in, and the row has to exist for the day plan to mean anything. There is no
-- user_id column — everything that needs "is this me?" compares against current_email(), which is
-- the *verified* address, so an unclaimed row simply has no one matching it yet.
-- -----------------------------------------------------------------------------
create table if not exists public.marathon_members (
  id           uuid primary key default gen_random_uuid(),
  marathon_id  uuid not null references public.marathons (id) on delete cascade,
  email        citext not null check (length(email::text) <= 254),
  team_id      uuid references public.marathon_teams (id) on delete set null,
  -- What the coach calls them. Falls back to the profile's display name, then to a placeholder —
  -- a marathon where half the board reads "Участник" is a marathon nobody can follow.
  display_name text check (display_name is null or length(display_name) <= 60),
  status       text not null default 'active' check (status in ('active', 'removed')),
  note         text check (note is null or length(note) <= 500),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (marathon_id, email)
);

comment on table public.marathon_members is
  'Who plays, by email (like purchases, so they can be added before they sign up). Never read directly by members — see marathon_roster().';

create index if not exists marathon_members_marathon_idx on public.marathon_members (marathon_id, status);
create index if not exists marathon_members_email_idx on public.marathon_members (email);
create index if not exists marathon_members_team_idx on public.marathon_members (team_id);

drop trigger if exists marathon_members_touch on public.marathon_members;
create trigger marathon_members_touch
  before update on public.marathon_members
  for each row execute function public.set_updated_at();

-- A team belongs to exactly one marathon, and so does the member pointing at it. Without this a
-- stray update could pair someone with a team from another run and the board would count them twice.
create or replace function public.marathon_members_check_team()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  if new.team_id is not null and not exists (
    select 1 from public.marathon_teams t
    where t.id = new.team_id and t.marathon_id = new.marathon_id
  ) then
    raise exception 'team_from_another_marathon' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists marathon_members_check_team on public.marathon_members;
create trigger marathon_members_check_team
  before insert or update of team_id, marathon_id on public.marathon_members
  for each row execute function public.marathon_members_check_team();

-- -----------------------------------------------------------------------------
-- marathon_tasks — the row the coach writes every morning.
-- -----------------------------------------------------------------------------
create table if not exists public.marathon_tasks (
  id          uuid primary key default gen_random_uuid(),
  marathon_id uuid not null references public.marathons (id) on delete cascade,
  -- 1-based day of the marathon. Day 1 is `starts_on`.
  day_index   int not null check (day_index between 1 and 100),
  sort_order  int not null default 0,

  title       text not null check (length(title) between 1 and 120),
  body        text check (body is null or length(body) <= 4000),
  -- A picture or a clip of him doing it, in the public `images` bucket or any absolute URL.
  media_url   text check (media_url is null or length(media_url) <= 500),

  /*
   * What counts as proof:
   *   done   tap "сделал" — for things he can see in the group anyway
   *   text   a sentence (what you ate, how it went)
   *   number a figure with a unit — the thing the number rules score
   *   media  a photo or a clip, private to the coach (see the `proofs` bucket below)
   */
  proof_kind  text not null default 'done'
              check (proof_kind in ('done', 'text', 'number', 'media')),
  unit        text check (unit is null or length(unit) between 1 and 16),
  -- The figure to beat, when there is one. Purely informational: no rule reads it, because "did
  -- you hit the target" is a judgement the coach makes, not arithmetic.
  target_num  numeric(10, 2) check (target_num is null or target_num >= 0),

  /*
   * How the task scores. Four rules cover every message in his marathon:
   *   all_members  the entry gets `points` only if EVERY active member delivered — his main rule,
   *                the one that makes a pair pull each other through
   *   per_member   every member who delivered earns `points` for the entry
   *   capped       per_member, but the entry's total for this task stops at `cap` ("вдвоём на
   *                второй палубе — не больше N")
   *   none         no points at all: the morning message, a rest day, a tip
   */
  rule        text not null default 'all_members'
              check (rule in ('all_members', 'per_member', 'capped', 'none')),
  points      int not null default 0 check (points between 0 and 1000),
  cap         int check (cap is null or cap between 0 and 10000),

  -- Who the task is for. 'teams' and 'solo' let one day carry a task for the pairs and another for
  -- whoever is playing alone.
  audience    text not null default 'all' check (audience in ('all', 'teams', 'solo')),
  -- Whether a teammate sees that you delivered (and your text or number). Photos are never shown
  -- to teammates — only to the coach — so this is about the fact and the figure, not the media.
  proof_visibility text not null default 'team' check (proof_visibility in ('team', 'coach')),

  -- Overrides the marathon's `due_time` for this one task ("до обеда").
  due_time    time,
  -- Whether proof after the deadline still scores. Off by default: the deadline is the game.
  late_counts boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.marathon_tasks is
  'One task on one day of a marathon. Repeating a task across days creates one row per day, so any single day can still be edited.';

-- A number needs a unit to mean anything; a cap only means something for the capped rule.
alter table public.marathon_tasks drop constraint if exists marathon_tasks_unit_required;
alter table public.marathon_tasks add constraint marathon_tasks_unit_required
  check (proof_kind <> 'number' or unit is not null);
alter table public.marathon_tasks drop constraint if exists marathon_tasks_cap_required;
alter table public.marathon_tasks add constraint marathon_tasks_cap_required
  check (case when rule = 'capped' then cap is not null else cap is null end);

create index if not exists marathon_tasks_day_idx
  on public.marathon_tasks (marathon_id, day_index, sort_order);

drop trigger if exists marathon_tasks_touch on public.marathon_tasks;
create trigger marathon_tasks_touch
  before update on public.marathon_tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- marathon_submissions — the proof.
-- -----------------------------------------------------------------------------
create table if not exists public.marathon_submissions (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.marathon_tasks (id) on delete cascade,
  member_id   uuid not null references public.marathon_members (id) on delete cascade,
  -- Copied from the task by the guard trigger below, never by the client: every scoring query
  -- filters on these two, and a join per row would turn the board into a nested loop.
  marathon_id uuid not null references public.marathons (id) on delete cascade,
  day_index   int not null,

  value_text  text check (value_text is null or length(value_text) <= 1000),
  value_num   numeric(10, 2) check (value_num is null or value_num >= 0),
  -- Object path inside the private `proofs` bucket, never a URL: the app mints a signed one.
  media_path  text check (media_path is null or length(media_path) <= 300),

  submitted_at timestamptz not null default now(),

  -- Voiding, which is how a wrong or fake proof is undone. The row stays — the coach and the
  -- athlete can both still see what was sent and why it was struck — it simply stops scoring.
  voided_at   timestamptz,
  void_reason text check (void_reason is null or length(void_reason) <= 300),
  voided_by   uuid references auth.users (id) on delete set null,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One proof per person per task; sending again edits it.
  unique (task_id, member_id)
);

comment on table public.marathon_submissions is
  'One proof per (task, member). Counts from the moment it is written; the coach voids rather than approves.';

create index if not exists marathon_submissions_score_idx
  on public.marathon_submissions (marathon_id, day_index, member_id);
create index if not exists marathon_submissions_task_idx
  on public.marathon_submissions (task_id);
create index if not exists marathon_submissions_feed_idx
  on public.marathon_submissions (marathon_id, submitted_at desc);

drop trigger if exists marathon_submissions_touch on public.marathon_submissions;
create trigger marathon_submissions_touch
  before update on public.marathon_submissions
  for each row execute function public.set_updated_at();

/*
 * The guard: everything a client must not be trusted with.
 *
 * RLS already decides *whether* a row may be written. This decides what it may say — the marathon
 * and the day come from the task, the void fields are the coach's alone, and a submission can
 * never be moved to another task or another person after the fact.
 */
create or replace function public.marathon_submissions_guard()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_task   public.marathon_tasks%rowtype;
  v_member public.marathon_members%rowtype;
  v_admin  boolean := public.is_admin();
begin
  select * into v_task from public.marathon_tasks where id = new.task_id;
  if not found then
    raise exception 'unknown_task' using errcode = 'P0001';
  end if;
  select * into v_member from public.marathon_members where id = new.member_id;
  if not found then
    raise exception 'unknown_member' using errcode = 'P0001';
  end if;
  if v_member.marathon_id <> v_task.marathon_id then
    raise exception 'member_from_another_marathon' using errcode = 'P0001';
  end if;

  new.marathon_id := v_task.marathon_id;
  new.day_index := v_task.day_index;

  if tg_op = 'UPDATE' then
    if new.task_id <> old.task_id or new.member_id <> old.member_id then
      raise exception 'submission_is_fixed_to_its_task_and_member' using errcode = 'P0001';
    end if;
    if not v_admin then
      -- An athlete may correct what they sent. They may not un-void it, and they may not move
      -- when it was sent: editing yesterday's number does not make it yesterday's proof.
      new.voided_at := old.voided_at;
      new.void_reason := old.void_reason;
      new.voided_by := old.voided_by;
      new.submitted_at := old.submitted_at;
    end if;
  elsif not v_admin then
    new.voided_at := null;
    new.void_reason := null;
    new.voided_by := null;
    -- The deadline is the game, so the clock is the server's. The coach keeps the ability to set
    -- it by hand, which is how proof that arrived in Telegram gets entered after the fact.
    new.submitted_at := now();
  end if;

  -- Stamp who struck it, so the feed can say so without a second write.
  if new.voided_at is not null and new.voided_by is null then
    new.voided_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists marathon_submissions_guard on public.marathon_submissions;
create trigger marathon_submissions_guard
  before insert or update on public.marathon_submissions
  for each row execute function public.marathon_submissions_guard();

-- -----------------------------------------------------------------------------
-- marathon_adjustments — the coach's ±points, with a reason.
--
-- «Плюс пять за то, что вытащил напарника» is not expressible as a task, and pretending otherwise
-- would mean inventing a fake task every time. It is a separate, always-visible line instead.
-- -----------------------------------------------------------------------------
create table if not exists public.marathon_adjustments (
  id          uuid primary key default gen_random_uuid(),
  marathon_id uuid not null references public.marathons (id) on delete cascade,
  member_id   uuid not null references public.marathon_members (id) on delete cascade,
  day_index   int not null check (day_index between 1 and 100),
  points      int not null check (points between -1000 and 1000),
  reason      text not null check (length(reason) between 1 and 300),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.marathon_adjustments is 'Manual ±points from the coach, always with a reason. Counted by marathon_scores() like any task.';

create index if not exists marathon_adjustments_score_idx
  on public.marathon_adjustments (marathon_id, day_index, member_id);

-- =============================================================================
-- Helpers. All security definer: they are the only way a member learns anything about a
-- marathon's people, and they must read tables the caller has no policy on.
-- =============================================================================

-- The caller's member row in this marathon, or null. The single question every policy below asks.
create or replace function public.marathon_member_id(p_marathon_id uuid)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select m.id
  from public.marathon_members m
  where m.marathon_id = p_marathon_id
    and m.status = 'active'
    and m.email = public.current_email()
  limit 1;
$$;

create or replace function public.is_marathon_member(p_marathon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select public.marathon_member_id(p_marathon_id) is not null;
$$;

/*
 * Which day of the marathon it is, in the marathon's own timezone.
 *   0          it has not started yet
 *   1..days    today
 *   days + 1…  it is over (the caller clamps for display; scoring ignores days past the end)
 */
create or replace function public.marathon_day_index(p_marathon_id uuid)
returns int
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select greatest(0, ((now() at time zone m.timezone)::date - m.starts_on) + 1)
  from public.marathons m
  where m.id = p_marathon_id;
$$;

/*
 * The two predicates the submission policies ask, as security-definer functions rather than as
 * sub-selects inside the policy.
 *
 * A policy body is evaluated as the *caller*, so row-level security applies to everything it reads
 * too: a sub-select over marathon_members inside a policy sees nothing, because members have no
 * select on that table. Asking the question in a definer function is the only way to answer it at
 * all, and it keeps the rule in one readable place instead of spread across three policies.
 */

-- May this task be written to right now? The marathon is running and the day has arrived. Whether
-- proof this late still *scores* is the task's own business (late_counts) — it is recorded either way.
create or replace function public.marathon_task_is_open(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1
    from public.marathon_tasks t
    join public.marathons m on m.id = t.marathon_id
    where t.id = p_task_id
      and m.status = 'active'
      and t.day_index <= public.marathon_day_index(m.id)
  );
$$;

-- Is this someone else's proof that I am entitled to see? Only a teammate's, and only when the
-- task shares it with the team. Media never travels this way — the object in the bucket has its
-- own, stricter rule.
create or replace function public.can_read_teammate_proof(p_marathon_id uuid, p_member_id uuid, p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists (
    select 1
    from public.marathon_members mine
    join public.marathon_members theirs
      on theirs.marathon_id = mine.marathon_id
     and theirs.team_id = mine.team_id
    join public.marathon_tasks t on t.id = p_task_id
    where mine.id = public.marathon_member_id(p_marathon_id)
      and mine.team_id is not null
      and theirs.id = p_member_id
      and theirs.status = 'active'
      and t.proof_visibility = 'team'
  );
$$;

-- Week 1 is days 1..7, counted from the marathon's own start rather than from Monday.
create or replace function public.marathon_week_of(p_day_index int)
returns int
language sql
immutable
as $$
  select case when p_day_index is null or p_day_index < 1 then null
              else ((p_day_index - 1) / 7) + 1 end;
$$;

revoke execute on function public.marathon_member_id(uuid) from public, anon;
revoke execute on function public.is_marathon_member(uuid) from public, anon;
revoke execute on function public.marathon_day_index(uuid) from public, anon;
revoke execute on function public.marathon_task_is_open(uuid) from public, anon;
revoke execute on function public.can_read_teammate_proof(uuid, uuid, uuid) from public, anon;
grant execute on function public.marathon_member_id(uuid) to authenticated;
grant execute on function public.is_marathon_member(uuid) to authenticated;
grant execute on function public.marathon_day_index(uuid) to authenticated;
grant execute on function public.marathon_task_is_open(uuid) to authenticated;
grant execute on function public.can_read_teammate_proof(uuid, uuid, uuid) to authenticated;
grant execute on function public.marathon_week_of(int) to authenticated;

-- =============================================================================
-- Row-level security
-- =============================================================================

alter table public.marathons enable row level security;
alter table public.marathon_teams enable row level security;
alter table public.marathon_members enable row level security;
alter table public.marathon_tasks enable row level security;
alter table public.marathon_submissions enable row level security;
alter table public.marathon_adjustments enable row level security;

-- marathons ------------------------------------------------------------------
drop policy if exists "marathons: admins all" on public.marathons;
create policy "marathons: admins all"
  on public.marathons for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A member sees their own marathon, and only once it has started running: a draft is the coach
-- still writing it.
drop policy if exists "marathons: members read" on public.marathons;
create policy "marathons: members read"
  on public.marathons for select
  to authenticated
  using (status in ('active', 'finished') and public.is_marathon_member(id));

-- marathon_teams ---------------------------------------------------------------
drop policy if exists "marathon_teams: admins all" on public.marathon_teams;
create policy "marathon_teams: admins all"
  on public.marathon_teams for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "marathon_teams: members read" on public.marathon_teams;
create policy "marathon_teams: members read"
  on public.marathon_teams for select
  to authenticated
  using (public.is_marathon_member(marathon_id));

-- marathon_members -------------------------------------------------------------
-- Admins only. The row carries an email and the coach's private note; members learn who is playing
-- through marathon_roster(), which returns names and nothing else.
drop policy if exists "marathon_members: admins all" on public.marathon_members;
create policy "marathon_members: admins all"
  on public.marathon_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- marathon_tasks ---------------------------------------------------------------
drop policy if exists "marathon_tasks: admins all" on public.marathon_tasks;
create policy "marathon_tasks: admins all"
  on public.marathon_tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

/*
 * Members read today's tasks and every day before it — never tomorrow's. Reading ahead would spoil
 * the format (the task arrives in the morning and that is the event), and it is the client's only
 * source for the day plan, so the rule belongs here rather than in a query the app could forget.
 */
drop policy if exists "marathon_tasks: members read up to today" on public.marathon_tasks;
create policy "marathon_tasks: members read up to today"
  on public.marathon_tasks for select
  to authenticated
  using (
    public.is_marathon_member(marathon_id)
    and day_index <= public.marathon_day_index(marathon_id)
  );

-- marathon_submissions ---------------------------------------------------------
drop policy if exists "marathon_submissions: admins all" on public.marathon_submissions;
create policy "marathon_submissions: admins all"
  on public.marathon_submissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "marathon_submissions: own read" on public.marathon_submissions;
create policy "marathon_submissions: own read"
  on public.marathon_submissions for select
  to authenticated
  using (member_id = public.marathon_member_id(marathon_id));

/*
 * A teammate's proof, when the task says 'team'. This is what makes «Ваня сделал, ждём Витю» show
 * up on your own screen — the state of the person you are scored with. Media stays out of it: the
 * row is visible, the object in the `proofs` bucket is not.
 */
drop policy if exists "marathon_submissions: teammate read" on public.marathon_submissions;
create policy "marathon_submissions: teammate read"
  on public.marathon_submissions for select
  to authenticated
  using (public.can_read_teammate_proof(marathon_id, member_id, task_id));

/*
 * Writing proof. Only for yourself, only on a running marathon, and only for a day that has
 * actually arrived. Whether a late proof *scores* is the task's business (`late_counts`) — it is
 * still recorded either way, because the coach wants to see that it was done at all.
 */
drop policy if exists "marathon_submissions: own write" on public.marathon_submissions;
create policy "marathon_submissions: own write"
  on public.marathon_submissions for insert
  to authenticated
  with check (
    member_id = public.marathon_member_id(marathon_id)
    and public.marathon_task_is_open(task_id)
  );

drop policy if exists "marathon_submissions: own update" on public.marathon_submissions;
create policy "marathon_submissions: own update"
  on public.marathon_submissions for update
  to authenticated
  using (
    member_id = public.marathon_member_id(marathon_id)
    and voided_at is null
    and public.marathon_task_is_open(task_id)
  )
  with check (member_id = public.marathon_member_id(marathon_id));

-- No delete policy for members on purpose: a proof that was sent is part of the record. Correcting
-- it is an update; removing it is the coach's call.

-- marathon_adjustments ---------------------------------------------------------
drop policy if exists "marathon_adjustments: admins all" on public.marathon_adjustments;
create policy "marathon_adjustments: admins all"
  on public.marathon_adjustments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- You can always see why your own total moved.
drop policy if exists "marathon_adjustments: own read" on public.marathon_adjustments;
create policy "marathon_adjustments: own read"
  on public.marathon_adjustments for select
  to authenticated
  using (member_id = public.marathon_member_id(marathon_id));

revoke all on public.marathons from anon, authenticated;
revoke all on public.marathon_teams from anon, authenticated;
revoke all on public.marathon_members from anon, authenticated;
revoke all on public.marathon_tasks from anon, authenticated;
revoke all on public.marathon_submissions from anon, authenticated;
revoke all on public.marathon_adjustments from anon, authenticated;

grant select, insert, update, delete on public.marathons to authenticated;
grant select, insert, update, delete on public.marathon_teams to authenticated;
grant select, insert, update, delete on public.marathon_members to authenticated;
grant select, insert, update, delete on public.marathon_tasks to authenticated;
grant select, insert, update, delete on public.marathon_submissions to authenticated;
grant select, insert, update, delete on public.marathon_adjustments to authenticated;

-- =============================================================================
-- proofs — a private bucket for photo and video proof.
--
-- Private, unlike `images`: this is someone's kitchen, their scales, their living-room floor. Only
-- the athlete who sent it and the coach can read it, and a teammate cannot — a pair shares a score,
-- not a camera roll.
--
-- Object naming: proofs/<marathon_id>/<member_id>/<task_id>.<ext>
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- Does this object path belong to the caller? Both segments have to match: the marathon they are
-- in, and their own member id inside it.
create or replace function public.owns_proof_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_parts text[] := storage.foldername(p_name);
  v_marathon uuid;
  v_member uuid;
begin
  if array_length(v_parts, 1) is null or array_length(v_parts, 1) < 2 then
    return false;
  end if;
  begin
    v_marathon := v_parts[1]::uuid;
    v_member := v_parts[2]::uuid;
  exception when others then
    return false;
  end;
  return v_member = public.marathon_member_id(v_marathon);
end;
$$;

revoke execute on function public.owns_proof_path(text) from public, anon;
grant execute on function public.owns_proof_path(text) to authenticated;

drop policy if exists "proofs: admin all" on storage.objects;
create policy "proofs: admin all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'proofs' and public.is_admin())
  with check (bucket_id = 'proofs' and public.is_admin());

drop policy if exists "proofs: own read" on storage.objects;
create policy "proofs: own read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'proofs' and public.owns_proof_path(name));

drop policy if exists "proofs: own insert" on storage.objects;
create policy "proofs: own insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'proofs' and public.owns_proof_path(name));

-- Re-sending proof replaces the object; the path is derived from the task, so it is the same key.
drop policy if exists "proofs: own update" on storage.objects;
create policy "proofs: own update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'proofs' and public.owns_proof_path(name))
  with check (bucket_id = 'proofs' and public.owns_proof_path(name));

-- =============================================================================
-- The read API.
--
-- Four functions, all security definer, all checking membership themselves. They exist because
-- every one of them has to read rows the caller has no policy on (other people's member rows) or
-- do arithmetic that must be identical for everybody (the board).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- my_marathons — everything the app needs to open the format at all.
-- -----------------------------------------------------------------------------
create or replace function public.my_marathons()
returns table (
  id          uuid,
  slug        text,
  title       text,
  description text,
  status      text,
  starts_on   date,
  days        int,
  team_size   int,
  prize       text,
  day_index   int,
  week        int,
  total_weeks int,
  member_id   uuid,
  team_id     uuid,
  team_name   text
)
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select
    m.id, m.slug, m.title, m.description, m.status, m.starts_on, m.days, m.team_size, m.prize,
    least(public.marathon_day_index(m.id), m.days) as day_index,
    public.marathon_week_of(least(public.marathon_day_index(m.id), m.days)) as week,
    public.marathon_week_of(m.days) as total_weeks,
    mem.id, mem.team_id, t.name
  from public.marathons m
  join public.marathon_members mem
    on mem.marathon_id = m.id
   and mem.status = 'active'
   and mem.email = public.current_email()
  left join public.marathon_teams t on t.id = mem.team_id
  where m.status in ('active', 'finished')
  order by m.starts_on desc;
$$;

revoke execute on function public.my_marathons() from public, anon;
grant execute on function public.my_marathons() to authenticated;

-- -----------------------------------------------------------------------------
-- marathon_roster — who is playing, by name. No emails, ever.
-- -----------------------------------------------------------------------------
create or replace function public.marathon_roster(p_marathon_id uuid)
returns table (
  member_id    uuid,
  display_name text,
  team_id      uuid,
  team_name    text,
  is_me        boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_me uuid := public.marathon_member_id(p_marathon_id);
begin
  if v_me is null and not public.is_admin() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  return query
  select
    mem.id,
    left(coalesce(
      nullif(trim(mem.display_name), ''),
      nullif(trim(p.display_name), ''),
      'Участник'
    ), 60),
    mem.team_id,
    t.name,
    mem.id = v_me
  from public.marathon_members mem
  left join public.marathon_teams t on t.id = mem.team_id
  left join public.profiles p on p.email = mem.email
  where mem.marathon_id = p_marathon_id
    and mem.status = 'active'
  order by t.sort_order nulls last, t.name nulls last, mem.created_at;
end;
$$;

revoke execute on function public.marathon_roster(uuid) from public, anon;
grant execute on function public.marathon_roster(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- marathon_scores — the board.
--
-- An *entry* is what races: a team, or a member with no team (their own entry of one). That single
-- idea is what lets one function serve a paired marathon, a solo one, and a mixed one, and it is
-- why `all_members` needs no special case for someone playing alone — a team of one is satisfied
-- by one person.
--
-- p_week null means the current week. Week 0 does not exist; before a marathon starts every entry
-- is simply on zero.
-- -----------------------------------------------------------------------------
create or replace function public.marathon_scores(p_marathon_id uuid, p_week int default null)
returns table (
  entry_kind  text,
  entry_id    uuid,
  title       text,
  members     text[],
  points      bigint,
  rank        bigint,
  is_mine     boolean
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_me   uuid := public.marathon_member_id(p_marathon_id);
  v_m    public.marathons%rowtype;
  v_week int;
begin
  if v_me is null and not public.is_admin() then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  select * into v_m from public.marathons where id = p_marathon_id;
  if not found then
    raise exception 'unknown_marathon' using errcode = 'P0001';
  end if;

  v_week := coalesce(
    p_week,
    public.marathon_week_of(least(greatest(public.marathon_day_index(p_marathon_id), 1), v_m.days)),
    1
  );
  if v_week < 1 then
    raise exception 'invalid_week' using errcode = 'P0001';
  end if;

  return query
  with
  -- Every active member, with the entry they race in and the name to show.
  people as (
    select
      mem.id as member_id,
      coalesce(mem.team_id, mem.id) as entry_id,
      case when mem.team_id is not null then 'team' else 'solo' end as entry_kind,
      coalesce(
        t.name,
        nullif(trim(mem.display_name), ''),
        nullif(trim(p.display_name), ''),
        'Участник'
      ) as entry_title,
      left(coalesce(
        nullif(trim(mem.display_name), ''),
        nullif(trim(p.display_name), ''),
        'Участник'
      ), 60) as member_name,
      coalesce(t.sort_order, 0) as sort_order,
      mem.created_at
    from public.marathon_members mem
    left join public.marathon_teams t on t.id = mem.team_id
    left join public.profiles p on p.email = mem.email
    where mem.marathon_id = p_marathon_id
      and mem.status = 'active'
  ),
  entries as (
    select
      pe.entry_id,
      min(pe.entry_kind) as entry_kind,
      min(pe.entry_title) as title,
      array_agg(pe.member_name order by pe.created_at) as members,
      count(*)::int as member_count,
      min(pe.sort_order) as sort_order,
      bool_or(pe.member_id = v_me) as is_mine
    from people pe
    group by pe.entry_id
  ),
  -- The tasks of this week that actually happened: a day past the end of the marathon is not a day.
  week_tasks as (
    select t.*
    from public.marathon_tasks t
    where t.marathon_id = p_marathon_id
      and t.day_index <= v_m.days
      and public.marathon_week_of(t.day_index) = v_week
      and t.rule <> 'none'
  ),
  -- Proof that counts: not voided, and in time unless the task forgives lateness.
  counted as (
    select s.task_id, s.member_id
    from public.marathon_submissions s
    join week_tasks t on t.id = s.task_id
    where s.marathon_id = p_marathon_id
      and s.voided_at is null
      and (
        t.late_counts
        or s.submitted_at <= (
          ((v_m.starts_on + (t.day_index - 1))::timestamp + coalesce(t.due_time, v_m.due_time))
          at time zone v_m.timezone
        )
      )
  ),
  -- How many of an entry's members delivered each task it was set.
  per_task as (
    select
      e.entry_id,
      t.id as task_id,
      t.rule,
      t.points,
      t.cap,
      e.member_count,
      count(c.member_id)::int as done
    from entries e
    join week_tasks t
      on t.audience = 'all'
      or (t.audience = 'teams' and e.entry_kind = 'team')
      or (t.audience = 'solo' and e.entry_kind = 'solo')
    left join people pe on pe.entry_id = e.entry_id
    left join counted c on c.task_id = t.id and c.member_id = pe.member_id
    group by e.entry_id, t.id, t.rule, t.points, t.cap, e.member_count
  ),
  task_points as (
    select
      pt.entry_id,
      sum(
        case pt.rule
          when 'all_members' then case when pt.done >= pt.member_count then pt.points else 0 end
          when 'per_member'  then pt.done * pt.points
          when 'capped'      then least(pt.done * pt.points, pt.cap)
          else 0
        end
      )::bigint as pts
    from per_task pt
    group by pt.entry_id
  ),
  -- The coach's ±points, for the same week, credited to the member's entry.
  adjust as (
    select pe.entry_id, sum(a.points)::bigint as pts
    from public.marathon_adjustments a
    join people pe on pe.member_id = a.member_id
    where a.marathon_id = p_marathon_id
      and public.marathon_week_of(a.day_index) = v_week
    group by pe.entry_id
  ),
  totals as (
    select
      e.entry_id,
      e.entry_kind,
      e.title,
      e.members,
      e.sort_order,
      e.is_mine,
      greatest(coalesce(tp.pts, 0) + coalesce(ad.pts, 0), 0) as pts
    from entries e
    left join task_points tp on tp.entry_id = e.entry_id
    left join adjust ad on ad.entry_id = e.entry_id
  )
  select
    tt.entry_kind,
    tt.entry_id,
    left(tt.title, 60),
    tt.members,
    tt.pts,
    rank() over (order by tt.pts desc, tt.sort_order, tt.title)::bigint,
    tt.is_mine
  from totals tt
  order by 6, tt.sort_order, tt.title;
end;
$$;

revoke execute on function public.marathon_scores(uuid, int) from public, anon;
grant execute on function public.marathon_scores(uuid, int) to authenticated;

-- -----------------------------------------------------------------------------
-- marathon_my_points — the caller's marathon, day by day.
--
-- Two different numbers, deliberately side by side: how many of the day's tasks *you* delivered,
-- and how many points your *entry* took. In a paired marathon those come apart — that is the whole
-- tension of the format, and the screen should show it rather than hide it behind one total.
-- -----------------------------------------------------------------------------
create or replace function public.marathon_my_points(p_marathon_id uuid)
returns table (
  day_index   int,
  week        int,
  tasks_total int,
  tasks_done  int,
  points      bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_me   uuid := public.marathon_member_id(p_marathon_id);
  v_m    public.marathons%rowtype;
  v_today int;
begin
  if v_me is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  select * into v_m from public.marathons where id = p_marathon_id;
  v_today := least(public.marathon_day_index(p_marathon_id), v_m.days);
  if v_today < 1 then
    return;
  end if;

  return query
  with days as (
    select generate_series(1, v_today) as d
  ),
  mine as (
    select mem.id as member_id, coalesce(mem.team_id, mem.id) as entry_id,
           case when mem.team_id is not null then 'team' else 'solo' end as entry_kind
    from public.marathon_members mem where mem.id = v_me
  ),
  -- The tasks set to my entry, per day.
  -- Only the tasks that score. The morning message is set to everyone and worth nothing, and
  -- counting it would tell someone they had missed 1 of 3 for not ticking «Доброе утро».
  my_tasks as (
    select t.*
    from public.marathon_tasks t, mine
    where t.marathon_id = p_marathon_id
      and t.day_index <= v_today
      and t.rule <> 'none'
      and (t.audience = 'all' or (t.audience = 'teams' and mine.entry_kind = 'team')
           or (t.audience = 'solo' and mine.entry_kind = 'solo'))
  ),
  done as (
    select s.day_index, count(*)::int as n
    from public.marathon_submissions s
    join my_tasks t on t.id = s.task_id
    where s.member_id = v_me and s.voided_at is null
    group by s.day_index
  ),
  totals as (
    select t.day_index, count(*)::int as n from my_tasks t group by t.day_index
  ),
  -- The same "proof that counts" rule as the board, narrowed to my entry: not voided, and in time
  -- unless the task forgives lateness. Scored per day here rather than per week, so the screen can
  -- show which day the points came from; summing these days over a week gives the board's figure.
  counted as (
    select s.task_id, s.member_id, t.day_index
    from public.marathon_submissions s
    join my_tasks t on t.id = s.task_id
    join public.marathon_members mem on mem.id = s.member_id
    where s.voided_at is null
      and mem.marathon_id = p_marathon_id
      and mem.status = 'active'
      and coalesce(mem.team_id, mem.id) = (select entry_id from mine)
      and (
        t.late_counts
        or s.submitted_at <= (
          ((v_m.starts_on + (t.day_index - 1))::timestamp + coalesce(t.due_time, v_m.due_time))
          at time zone v_m.timezone
        )
      )
  ),
  entry_size as (
    select count(*)::int as n
    from public.marathon_members mem
    where mem.marathon_id = p_marathon_id and mem.status = 'active'
      and coalesce(mem.team_id, mem.id) = (select entry_id from mine)
  ),
  per_task as (
    select t.day_index, t.rule, t.points, t.cap,
           (select n from entry_size) as member_count,
           (select count(*) from counted c where c.task_id = t.id)::int as done_n
    from my_tasks t
  ),
  day_points as (
    select pt.day_index,
           sum(
             case pt.rule
               when 'all_members' then case when pt.done_n >= pt.member_count then pt.points else 0 end
               when 'per_member'  then pt.done_n * pt.points
               when 'capped'      then least(pt.done_n * pt.points, pt.cap)
               else 0
             end
           )::bigint as pts
    from per_task pt
    group by pt.day_index
  ),
  day_adjust as (
    select a.day_index, sum(a.points)::bigint as pts
    from public.marathon_adjustments a
    join public.marathon_members mem on mem.id = a.member_id
    where a.marathon_id = p_marathon_id
      and coalesce(mem.team_id, mem.id) = (select entry_id from mine)
    group by a.day_index
  )
  select
    days.d,
    public.marathon_week_of(days.d),
    coalesce(tot.n, 0),
    coalesce(dn.n, 0),
    coalesce(dp.pts, 0) + coalesce(da.pts, 0)
  from days
  left join totals tot on tot.day_index = days.d
  left join done dn on dn.day_index = days.d
  left join day_points dp on dp.day_index = days.d
  left join day_adjust da on da.day_index = days.d
  order by days.d desc;
end;
$$;

revoke execute on function public.marathon_my_points(uuid) from public, anon;
grant execute on function public.marathon_my_points(uuid) to authenticated;
