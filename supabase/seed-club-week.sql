-- =============================================================================
-- Forma — «Клуб маленьких шагов»: one week of tasks, for testing.
--
-- Run it with **Actions → Supabase apply → task = `club-seed`**, or paste it into
-- the Supabase SQL editor after the migrations (docs/SETUP.md §2). It is
-- idempotent: running it again rewrites the same week rather than adding a second
-- copy, so the plan can be edited here and re-applied as often as you like.
--
-- What it creates
--   • one marathon, slug `klub_test`, seven days, started the day before yesterday
--   • **seven tasks — one a day**, and nothing else on any day
--   • seven invented members and the proof they have already sent, so the board
--     has rows on it (section 3)
--   • no real people. They are added by «club-join» in Actions, which reads their
--     address from a secret — see section 4.
--
-- It touches ONLY the row whose slug is `klub_test`. Any other marathon is left
-- alone, including a real one running at the same time.
--
-- TWO RULES THE OWNER SET, AND THEY SHAPE EVERYTHING BELOW:
--
--   «Никакого напарника в клубе быть не должно. Каждый сам за себя.»
--     `team_size` is 1. There are no teams, no pairs and no task that waits on
--     somebody else. Every rule is `per_member`, because in a club of one-person
--     entries that is the only rule that means anything.
--
--   «Задание одно в день. Не надо доп текст писать.»
--     One row per day, and a title with no `body`. The name of the task is the
--     task. A paragraph explaining it is the thing she asked not to write.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) The club itself.
--
-- `team_size = 1` is the whole of «каждый сам за себя»: `marathon_is_solo()` reads
-- it, and from there every function stops looking at `team_id` at all
-- (0011_marathon.sql). A member with a team is refused outright in this mode, so
-- section 3 and «club-join» both leave `team_id` null.
--
-- `starts_on` is **two days back**, so today is day 3 and the week already has a
-- past. That is deliberate: a round that starts today has nothing in the table
-- but zeroes, and a board of zeroes is indistinguishable from a board that is
-- broken. Move the offset for a different day on screen.
-- -----------------------------------------------------------------------------
insert into public.marathons (slug, title, description, status, starts_on, days, team_size, timezone, due_time, prize)
values (
  'klub_test',
  'Клуб маленьких шагов',
  'Тестовая неделя. Одно небольшое задание в день и общая таблица.',
  'active',
  current_date - 2,
  7,
  1,          -- каждый сам за себя: ни пар, ни команд
  'Europe/Moscow',
  '22:00',
  'Час с тренером и создателем Forma'
)
on conflict (slug) do update set
  title       = excluded.title,
  description = excluded.description,
  status      = excluded.status,
  starts_on   = excluded.starts_on,
  days        = excluded.days,
  team_size   = excluded.team_size,
  timezone    = excluded.timezone,
  due_time    = excluded.due_time,
  prize       = excluded.prize;

-- Teams from an earlier, paired version of this week. A solo marathon may not have
-- them (`marathon_members_check_team`), and a member still pointing at one would
-- keep the board drawing pairs. Deleting the team nulls the pointer
-- (`on delete set null`), so nobody is dropped from the club.
delete from public.marathon_teams
where marathon_id = (select id from public.marathons where slug = 'klub_test');

-- -----------------------------------------------------------------------------
-- 2) The week — one task a day, title only.
--
-- Tasks are replaced wholesale, not merged: the plan below is the whole truth, and
-- editing a line here and re-running should not leave yesterday's version behind.
-- Deleting a task deletes its proof too (`on delete cascade`), which is what you
-- want while testing and is worth knowing before re-running on a week people have
-- already played.
--
-- No `body` on any row, on purpose. The card is the task's name, the pill saying
-- what it is worth, and the one control that delivers it.
--
-- Points are not all equal: a harder day is worth more, and it is what keeps the
-- board from being seven-way ties. They run 8 to 15, so no single day decides the
-- week.
--
-- Columns worth knowing:
--   rule         per_member — you deliver, you score. The only rule used here.
--                capped / all_members exist in the schema and are team rules; they
--                have no meaning in a solo club.
--                none — no points at all.
--   proof_kind   done | text | number | media
--   unit/target  the figure and what it is measured in (target is informational —
--                "did you hit it" stays the coach's judgement, not arithmetic)
--   proof_visibility  team (others in your entry see it) | coach (only the coach)
-- -----------------------------------------------------------------------------
delete from public.marathon_tasks
where marathon_id = (select id from public.marathons where slug = 'klub_test');

insert into public.marathon_tasks
  (marathon_id, day_index, sort_order, title, rule, points, proof_kind, unit, target_num, proof_visibility)
select
  (select id from public.marathons where slug = 'klub_test'),
  t.day_index, 0, t.title, 'per_member', t.points, t.proof_kind, t.unit, t.target_num, t.visibility
from (values
  (1, 'Десять минут на ногах',   10, 'done',   null::text, null::numeric, 'team'),
  (2, 'Прогулка полчаса',        14, 'number', 'мин',      30,            'team'),
  (3, 'Двадцать приседаний',     12, 'done',   null,       null,          'team'),
  (4, 'Пятнадцать минут растяжки', 8, 'done',  null,       null,          'team'),
  -- Проверка приватности: фото видит только тренер, и никто больше.
  (5, 'Фото тарелки',             8, 'media',  null,       null,          'coach'),
  (6, 'Тренировка из курса',     15, 'done',   null,       null,          'team'),
  (7, 'Итог недели одной строкой', 10, 'text', null,       null,          'team')
) as t (day_index, title, points, proof_kind, unit, target_num, visibility);

/*
 * Every task in THIS week forgives lateness, and a real club's would not.
 *
 * `marathon_scores()` counts proof only if it arrived before its day's deadline
 * (0011_marathon.sql, the `counted` CTE). The deadline is the game — but in a
 * week being looked at rather than lived, it is a trap: open the app at eleven
 * at night, tap «сделал», watch nothing happen on the board, and the only
 * available conclusion is that the screen is broken. It isn't; the proof was
 * simply late. Nothing on the card says so, which is a real gap and one worth
 * closing in the app rather than hiding here.
 *
 * Delete this statement to rehearse the deadline for real.
 */
update public.marathon_tasks
set late_counts = true
where marathon_id = (select id from public.marathons where slug = 'klub_test');

commit;

-- =============================================================================
-- 3) The test cohort — seven invented people, so the board has a board on it.
--
-- WHY THIS EXISTS. The club's screen is two halves: today's task, and the week's
-- table. The second half cannot be looked at with one person in the round — it
-- renders «Пока никто не набрал баллов», which is correct and tells the owner
-- nothing about the screen she asked for. So the round gets a field.
--
-- THESE PEOPLE ARE NOT REAL AND MUST NEVER LEAVE `klub_test`. Their addresses
-- are `@example.test` — `.test` is reserved by RFC 6761 and can never be
-- delivered to, so nothing here can accidentally mail a stranger, and nothing
-- here is anybody's personal data. The club they live in is a round called
-- «Тестовая неделя» that only its own members can read.
--
-- This is test data in a private test round. It is not, and must not become, an
-- invented result or an invented review on a public surface — `docs/SPEC.md`
-- forbids those and this does not touch them.
--
-- Nobody has a team, because the club has none. Each of them is their own entry
-- on the board, exactly as the real member will be.
-- =============================================================================

begin;

/*
 * There is nobody signed in, and the trigger on `marathon_submissions` asks who
 * that is (`is_admin()` → `current_email()` → `auth.uid()`). Depending on how
 * `auth.uid()` is written, reading an unset `request.jwt.claims` either returns
 * null or fails on an empty string cast — the local shim in `supabase/tests`
 * does the latter. An empty claims object answers "nobody" the same way for
 * every version of it, so this one line makes the block run identically on a
 * real project and on a throwaway Postgres.
 */
set local request.jwt.claims = '{}';

-- The people. `klub-test-N@example.test` is the key everything below joins on,
-- so the number in the address is load-bearing — do not renumber casually.
insert into public.marathon_members (marathon_id, email, display_name)
select m.id, v.email::citext, v.display_name
from public.marathons m
join (values
  ('klub-test-1@example.test', 'Марина'),
  ('klub-test-2@example.test', 'Олег'),
  ('klub-test-3@example.test', 'Даша'),
  ('klub-test-4@example.test', 'Кирилл'),
  ('klub-test-5@example.test', 'Лена'),
  ('klub-test-6@example.test', 'Паша'),
  ('klub-test-7@example.test', 'Рита')
) as v (email, display_name) on true
where m.slug = 'klub_test'
on conflict (marathon_id, email) do update set
  team_id      = null,
  display_name = excluded.display_name,
  status       = 'active';

/*
 * Their proof.
 *
 * Written through the ordinary path — `marathon_submissions_guard` fills in the
 * marathon, the day and `submitted_at` exactly as it would for a person tapping
 * «сделал», and nothing here disables or works around it. So every row below is
 * a row the app itself could have produced.
 *
 * One consequence, stated rather than hidden: the guard stamps `submitted_at`
 * with the clock, so the whole invented history reads as «sent just now» in the
 * coach's proofs feed. It scores correctly because the week forgives lateness
 * (see the `late_counts` line above); it just does not pretend to a past.
 *
 * WHO DID WHICH DAY IS WRITTEN OUT, not hashed. A hash was shorter and produced
 * four-way ties at the top of a one-task-a-day week, which is a board that
 * answers nothing. These are chosen so the table has a clear leader, one honest
 * tie for second, and a tail.
 *
 * What is deliberately NOT invented: `media` proof. A photograph cannot be faked
 * into a bucket, and a row pointing at an object that is not there would show
 * the coach a broken picture. Day 5's «Фото тарелки» therefore scores nothing
 * for anybody — the one day of the week where the board does not move.
 */
insert into public.marathon_submissions
  (task_id, member_id, marathon_id, day_index, value_text, value_num)
select
  t.id,
  mem.id,
  t.marathon_id,   -- overwritten by the guard from the task; passed to satisfy NOT NULL readers
  t.day_index,
  case when t.proof_kind = 'text' then 'спокойно' end,
  case
    when t.proof_kind = 'number' then 20 + ((c.n * 811 + t.day_index * 397) % 40)
  end
from public.marathons m
join public.marathon_tasks t on t.marathon_id = m.id
join (values
  (1, array[1, 2, 3, 4, 6, 7]),
  (2, array[2, 3, 6, 7]),
  (3, array[1, 3, 4, 7]),
  (4, array[1, 2, 6]),
  (5, array[3, 6]),
  (6, array[1, 4, 7]),
  (7, array[2, 3, 7])
) as c (n, days) on true
join public.marathon_members mem
  on mem.marathon_id = m.id
 and mem.email = ('klub-test-' || c.n || '@example.test')::citext
where m.slug = 'klub_test'
  and t.day_index <= (current_date - m.starts_on) + 1   -- nothing from the future
  and t.proof_kind <> 'media'
  and t.day_index = any (c.days)
on conflict (task_id, member_id) do nothing;

commit;

-- =============================================================================
-- 4) The real people.
--
-- Emails are NOT in this file, and will not be: the repository is public, and an
-- address committed here is an address published forever.
--
-- Run the **club-join** task of the «Supabase apply» workflow instead
-- (`.github/workflows/supabase-apply.yml`). It reads the address from the
-- `CLUB_TESTER_EMAILS` secret — falling back to `PROBE_EMAIL` — builds this same
-- statement inside the runner, and never prints it. Nothing has to be typed.
--
-- It adds them with no team, because the club has none: everyone is their own
-- entry on the board.
-- =============================================================================

-- =============================================================================
-- 5) Handy afterwards
-- =============================================================================
--
-- Что сейчас в плане:
--   select day_index, title, rule, points, proof_kind
--   from public.marathon_tasks
--   where marathon_id = (select id from public.marathons where slug = 'klub_test')
--   order by day_index;
--
-- Сдвинуть неделю (например, чтобы сегодня стал четвёртым днём):
--   update public.marathons set starts_on = current_date - 3 where slug = 'klub_test';
--
-- Стереть тестовый клуб целиком — задания, участников и отчёты:
--   delete from public.marathons where slug = 'klub_test';
