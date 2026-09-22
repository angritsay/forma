-- =============================================================================
-- 0027 — the coach's verdict on one proof, and the athlete's second go at it.
--
-- Owner: «пользователь отправляет доказательство, мы ему автоматически зачитываем
-- баллы. Дальше Серёжа заходит в админку, видит доказательство, просматривает его
-- и принимает решение: оставить результат как есть или он может наложить reject на
-- это конкретное выполнение и оставить свой комментарий. Этот комментарий и reject
-- должны появиться у пользователя, и мы не должны засчитывать его баллы. Дальше
-- пользователь может выполнить это задание заново, и флоу будет аналогичен».
--
-- Everything up to the reject already worked: proof scores from the moment it is
-- written and `voided_at` takes the points back. What did not exist was the way
-- out of the reject. The athlete's own update policy required `voided_at is null`
-- and the guard trigger copied the void fields back on every non-admin write, so a
-- rejected proof was a dead end — the card said «Не засчитано» and offered nothing.
--
-- This migration makes the rejection a round rather than a verdict:
--
--   * `attempt`        which go this is. 1 until the coach rejects one.
--   * `resubmitted_at` when the athlete last sent proof again after a rejection.
--   * `reviewed_at`    when the coach last looked at it and left it standing.
--   * `reviewed_by`    who looked, stamped like `voided_by`.
--
-- Three decisions worth writing down:
--
--   **The redo clears the void, and only the athlete's own write can do it.** The
--   guard tells the two apart by what the row already says: an update of a proof
--   that is not voided is a correction and may not touch the review at all, and an
--   update of one that is voided is a new attempt — void lifted, `attempt` up,
--   `reviewed_at` cleared, so it lands back in the coach's queue. The athlete never
--   writes any of those fields; they are computed from `old`.
--
--   **`void_reason` survives the redo.** It is the coach's last comment, and it is
--   the only record of why the proof was sent twice. `voided_at` alone decides
--   scoring, here and in `marathon_scores()`, so a row with a reason and no
--   `voided_at` counts — it is a proof that was rejected once and redone.
--
--   **`submitted_at` still cannot move.** A redo keeps the instant of the first
--   send, which is what stops the rejection from costing the athlete a day they
--   delivered on time: the coach rejected the evidence, not the hour it arrived.
--   That also keeps the deadline rules in `score.ts` and `marathon_scores()`
--   reading one column. The coach can always reject the second attempt too.
--
-- Requires 0011_marathon.sql. Idempotent.
-- =============================================================================

alter table public.marathon_submissions
  add column if not exists attempt int not null default 1 check (attempt >= 1),
  add column if not exists resubmitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

comment on column public.marathon_submissions.attempt is
  'Which go this is: 1 until the coach rejects one and the athlete sends again (0027).';
comment on column public.marathon_submissions.resubmitted_at is
  'When proof was last sent again after a rejection. Null on a first attempt (0027).';
comment on column public.marathon_submissions.reviewed_at is
  'When the coach last looked and left it standing. Cleared by a redo, so it is also the queue (0027).';
comment on column public.marathon_submissions.void_reason is
  'The coach''s comment on the proof. Survives a redo as the reason it was sent again; voided_at alone decides scoring (0027).';

-- The queue: what has been redone and not looked at since. Small and partial, because
-- that is the whole of it — the feed itself is still read by (marathon_id, submitted_at).
create index if not exists marathon_submissions_review_idx
  on public.marathon_submissions (marathon_id, resubmitted_at desc)
  where voided_at is null and reviewed_at is null and attempt > 1;

/*
 * The guard, with the redo in it. Everything 0011 said still holds — the marathon and
 * the day come from the task, a submission cannot move to another task or person, and
 * the clock is the server's — and the review fields join the list of what a client
 * must not be trusted with.
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
      -- An athlete may correct what they sent, and may do the task again once it has been
      -- rejected. They may not write the verdict on it, and they may not move when it was
      -- sent: editing yesterday's number does not make it yesterday's proof.
      new.submitted_at := old.submitted_at;
      new.void_reason := old.void_reason;

      if old.voided_at is null then
        -- A correction. Nothing about the review changes.
        new.voided_at := old.voided_at;
        new.voided_by := old.voided_by;
        new.attempt := old.attempt;
        new.resubmitted_at := old.resubmitted_at;
        new.reviewed_at := old.reviewed_at;
        new.reviewed_by := old.reviewed_by;
      else
        -- The redo. The proof counts again from this moment and goes back to the coach.
        new.voided_at := null;
        new.voided_by := null;
        new.attempt := old.attempt + 1;
        new.resubmitted_at := now();
        new.reviewed_at := null;
        new.reviewed_by := null;
      end if;
    end if;
  elsif not v_admin then
    new.voided_at := null;
    new.void_reason := null;
    new.voided_by := null;
    new.attempt := 1;
    new.resubmitted_at := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    -- The deadline is the game, so the clock is the server's. The coach keeps the ability to set
    -- it by hand, which is how proof that arrived in Telegram gets entered after the fact.
    new.submitted_at := now();
  end if;

  -- Stamp who struck it and who looked at it, so the feed can say so without a second write.
  if new.voided_at is not null and new.voided_by is null then
    new.voided_by := auth.uid();
  end if;
  if new.reviewed_at is not null and new.reviewed_by is null then
    new.reviewed_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists marathon_submissions_guard on public.marathon_submissions;
create trigger marathon_submissions_guard
  before insert or update on public.marathon_submissions
  for each row execute function public.marathon_submissions_guard();

/*
 * The one policy change: a rejected proof is writable by its author again.
 *
 * `voided_at is null` in 0011 was what made «Не засчитано» final. The guard above now
 * decides what such a write may say, which is the right place for it — RLS answers
 * whether a row may be written, not what it may become.
 */
drop policy if exists "marathon_submissions: own update" on public.marathon_submissions;
create policy "marathon_submissions: own update"
  on public.marathon_submissions for update
  to authenticated
  using (
    member_id = public.marathon_member_id(marathon_id)
    and public.marathon_task_is_open(task_id)
  )
  with check (member_id = public.marathon_member_id(marathon_id));

comment on table public.marathon_submissions is
  'One proof per (task, member). Counts from the moment it is written; the coach rejects rather than approves, and the athlete can do the task again (0027).';
