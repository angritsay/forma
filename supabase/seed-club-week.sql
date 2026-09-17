-- =============================================================================
-- Forma — «Клуб маленьких шагов»: one week of tasks, for testing.
--
-- Run it in the Supabase SQL editor after the migrations (docs/SETUP.md §2).
-- It is idempotent: running it again rewrites the same week rather than adding a
-- second copy, so the plan can be edited here and re-applied as often as you like.
--
-- What it creates
--   • one marathon, slug `klub_test`, seven days, started the day before yesterday
--   • nineteen tasks across those seven days
--   • four pairs, seven invented members and the proof they have already sent,
--     so the board has a board on it (section 3)
--   • no real people. The two humans are added by «club-join» in Actions, which
--     reads their address from a secret — see section 4.
--
-- It touches ONLY the row whose slug is `klub_test`. Any other marathon is left
-- alone, including a real one running at the same time.
--
-- The plan is written for the format the name promises: one small thing a day,
-- never a feat. Each day has at most one task that takes real effort; the rest are
-- a line to answer, a glass of water, a flight of stairs. The pair task
-- (`all_members`) is the one that scores properly, because it is the one that
-- makes two people pull each other through — that is the whole mechanism.
--
-- Points per day land between 8 and 18, so no single day can decide the week.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) The club itself.
--
-- `starts_on` is **two days back**, so today is day 3 and the week already has a
-- past. That is deliberate and it is what makes the club's second half mean
-- anything: a round that starts today has nothing in the table but zeroes, and a
-- board of zeroes is indistinguishable from a board that is broken.
--
-- Day 3 rather than any other day because of what is on it — a line to answer, a
-- number to type and a task that only scores when both of the pair deliver. One
-- screen, three of the four kinds of proof.
--
-- Move it if you want a different day on screen: `current_date` starts the week
-- today, `current_date - 5` puts you on the pair's workout.
-- -----------------------------------------------------------------------------
insert into public.marathons (slug, title, description, status, starts_on, days, team_size, timezone, due_time, prize)
values (
  'klub_test',
  'Клуб маленьких шагов',
  'Тестовая неделя. Одно небольшое задание в день, напарник и общая таблица.',
  'active',
  current_date - 2,
  7,
  2,          -- пара: задание «на двоих» засчитывается, только если сделали оба
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

-- -----------------------------------------------------------------------------
-- 2) The week.
--
-- Tasks are replaced wholesale, not merged: the plan below is the whole truth, and
-- editing a line here and re-running should not leave yesterday's version behind.
--
-- Deleting a task deletes its proof too (`on delete cascade`), which is what you
-- want while testing and is worth knowing before you re-run this on a week people
-- have already played.
--
-- Columns worth knowing:
--   rule         all_members — the entry scores only if BOTH of the pair delivered
--                per_member  — everyone who delivered scores for themselves
--                capped      — per_member, but the pair's total stops at `cap`
--                none        — no points: a morning line, a rest day, a tip
--   proof_kind   done | text | number | media
--   unit/target  the figure and what it is measured in (target is informational —
--                "did you hit it" stays the coach's judgement, not arithmetic)
--   proof_visibility  team (the partner sees it) | coach (only the coach does)
--   due_time     overrides the club's 22:00 for this one task
-- -----------------------------------------------------------------------------
delete from public.marathon_tasks
where marathon_id = (select id from public.marathons where slug = 'klub_test');

insert into public.marathon_tasks
  (marathon_id, day_index, sort_order, title, body, rule, points, cap,
   proof_kind, unit, target_num, proof_visibility, due_time)
select
  (select id from public.marathons where slug = 'klub_test'),
  t.day_index, t.sort_order, t.title, t.body, t.rule, t.points, t.cap,
  t.proof_kind, t.unit, t.target_num, t.proof_visibility, t.due_time
from (values
  -- ДЕНЬ 1 — начали. Ничего физического: первый день решает, вернёшься ли ты завтра.
  (1, 0, 'Доброе утро',
      'Первая неделя клуба. Ответь одним словом, с каким настроением начинаешь.',
      'none', 0, null::int, 'text', null::text, null::numeric, 'team', null::time),
  (1, 1, 'Десять минут на ногах',
      'Прогулка, уборка, танцы на кухне — что угодно, лишь бы десять минут не сидя.',
      'all_members', 10, null, 'done', null, null, 'team', null),
  (1, 2, 'Стакан воды до кофе',
      'Один стакан воды перед первой чашкой. Всё.',
      'per_member', 3, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 2 — цифры. Два задания, которые измеряются, чтобы в таблице появились числа.
  (2, 0, 'Шаги',
      'Считаем шаги за день. Шесть тысяч — это примерно час спокойной ходьбы, набирается по частям.',
      'per_member', 5, null, 'number', 'шагов', 6000, 'team', null),
  (2, 1, 'Планка',
      'Максимум за один подход. Записываем секунды — на этой неделе важно не сколько, а что померили.',
      'per_member', 5, null, 'number', 'сек', null, 'team', null),
  (2, 2, 'Лечь спать до полуночи',
      'Один вечер. Сон — та же тренировка, только без усилий.',
      'per_member', 3, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 3 — лестница. Первое задание с дедлайном до обеда: проверяет, что время работает.
  (3, 0, 'Доброе утро',
      'Третий день — тот самый, на котором обычно всё и заканчивается. Не сегодня.',
      'none', 0, null, 'done', null, null, 'team', null),
  (3, 1, 'Пешком по лестнице',
      'Сегодня лифт не работает. Считаем подъёмы: до пяти в зачёт, дальше уже из спортивного интереса.',
      'capped', 3, 15, 'number', 'этажей', null, 'team', null),
  (3, 2, 'Двадцать приседаний до обеда',
      'Можно за два подхода. Главное — до обеда, пока день не съел.',
      'all_members', 8, null, 'done', null, null, 'team', '14:00'),

  -- ДЕНЬ 4 — полегче. Не ноль: день без задания читается как «клуб про меня забыл».
  (4, 0, 'День полегче',
      'Сегодня ничего тяжёлого. Отдых — часть плана, а не пропуск.',
      'none', 0, null, 'done', null, null, 'team', null),
  (4, 1, 'Пятнадцать минут растяжки',
      'Перед сном, без экрана. Спина и ноги.',
      'per_member', 5, null, 'done', null, null, 'team', null),
  (4, 2, 'Строчка напарнику',
      'Напиши, что у тебя получилось за три дня. Одно предложение, без отчёта.',
      'per_member', 3, null, 'text', null, null, 'team', null),

  -- ДЕНЬ 5 — еда. Фото видит только тренер: это проверка приватности, и она важная.
  (5, 0, 'Фото тарелки',
      'Один обед, как есть. Без комментариев и без «сначала приготовлю что-то приличное».',
      'per_member', 4, null, 'media', null, null, 'coach', null),
  (5, 1, 'Отжимания',
      'Сколько получится, за три подхода. С колен — тоже отжимания.',
      'per_member', 6, null, 'number', 'раз', null, 'team', null),

  -- ДЕНЬ 6 — вдвоём. Самое дорогое задание недели и единственное «настоящее».
  (6, 0, 'Доброе утро',
      'Предпоследний день. Сегодня то самое задание, ради которого нужен напарник.',
      'none', 0, null, 'done', null, null, 'team', null),
  (6, 1, 'Тренировка из курса',
      'Любая из «Формы с нуля», восемнадцать минут. Засчитывается, только если сделали оба.',
      'all_members', 12, null, 'done', null, null, 'team', null),
  (6, 2, 'Без сладкого до вечера',
      'До ужина. Вечером — как хочешь.',
      'per_member', 4, null, 'done', null, null, 'team', null),

  -- ДЕНЬ 7 — итог. Текстом: неделя заканчивается словами, а не цифрой.
  (7, 0, 'Прогулка сорок минут',
      'Без наушников, если получится. Вдвоём — если получится совсем хорошо.',
      'all_members', 10, null, 'done', null, null, 'team', null),
  (7, 1, 'Итог недели',
      'Одной строкой: что из этих семи дней останется с тобой на следующей.',
      'per_member', 3, null, 'text', null, null, 'team', null)
) as t (day_index, sort_order, title, body, rule, points, cap,
        proof_kind, unit, target_num, proof_visibility, due_time);

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
 * Until then the test week says «late still counts» out loud, in one line, so
 * the deadline is still printed on the card (day 3 says «до 14:00») and the
 * points still land whenever the tester gets to it. Delete this statement to
 * rehearse the deadline for real.
 */
update public.marathon_tasks
set late_counts = true
where marathon_id = (select id from public.marathons where slug = 'klub_test');

commit;

-- =============================================================================
-- 3) The test cohort — four pairs, seven invented people, and what they have
--    already sent.
--
-- WHY THIS EXISTS. The club's screen is two halves: today's task, and «топ 3 и
-- где ты». The second half cannot be looked at with one person in the round —
-- it renders «Пока никто не набрал баллов», which is correct and tells the
-- owner nothing about the screen she asked for. So the round gets a field.
--
-- THESE PEOPLE ARE NOT REAL AND MUST NEVER LEAVE `klub_test`. Their addresses
-- are `@example.test` — `.test` is reserved by RFC 6761 and can never be
-- delivered to, so nothing here can accidentally mail a stranger, and nothing
-- here is anybody's personal data. The club they live in is a round called
-- «Тестовая неделя» that only its own members can read.
--
-- This is test data in a private test round. It is not, and must not become,
-- an invented result or an invented review on a public surface — `docs/SPEC.md`
-- forbids those and this does not touch them.
--
-- The seventh pair slot is left open on purpose: «Пара 1» holds one invented
-- partner and waits for the real human, whom the «club-join» task in
-- `.github/workflows/supabase-apply.yml` adds from a GitHub secret (section 4).
-- That is the pair mechanic on screen: the `all_members` tasks of day 3 stay
-- unscored until she delivers hers, and the moment she does, «Пара 1» climbs.
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

-- The four pairs. `sort_order` only decides ties in the admin's list.
insert into public.marathon_teams (marathon_id, name, sort_order)
select m.id, v.name, v.sort_order
from public.marathons m,
     (values ('Пара 1', 1), ('Пара 2', 2), ('Пара 3', 3), ('Пара 4', 4)) as v (name, sort_order)
where m.slug = 'klub_test'
on conflict (marathon_id, name) do update set sort_order = excluded.sort_order;

-- The people. `klub-test-N@example.test` is the key everything below joins on,
-- so the number in the address is load-bearing — do not renumber casually.
insert into public.marathon_members (marathon_id, email, team_id, display_name)
select m.id, v.email::citext, t.id, v.display_name
from public.marathons m
join public.marathon_teams t on t.marathon_id = m.id
join (values
  ('klub-test-1@example.test', 'Марина',  'Пара 1'),
  ('klub-test-2@example.test', 'Олег',    'Пара 2'),
  ('klub-test-3@example.test', 'Даша',    'Пара 2'),
  ('klub-test-4@example.test', 'Кирилл',  'Пара 3'),
  ('klub-test-5@example.test', 'Лена',    'Пара 3'),
  ('klub-test-6@example.test', 'Паша',    'Пара 4'),
  ('klub-test-7@example.test', 'Рита',    'Пара 4')
) as v (email, display_name, team_name) on v.team_name = t.name
where m.slug = 'klub_test'
on conflict (marathon_id, email) do update set
  team_id      = excluded.team_id,
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
 * What is deliberately NOT invented: `media` proof. A photograph cannot be
 * faked into a bucket, and a row pointing at an object that is not there would
 * show the coach a broken picture. Day 5's «Фото тарелки» therefore scores
 * nothing for anybody, which is the honest answer.
 */
insert into public.marathon_submissions
  (task_id, member_id, marathon_id, day_index, value_text, value_num)
select
  t.id,
  mem.id,
  t.marathon_id,   -- overwritten by the guard from the task; passed to satisfy NOT NULL readers
  t.day_index,
  case
    when t.proof_kind = 'text'
    then (array['бодро', 'спокойно', 'сонно', 'решительно'])[1 + ((c.n + t.day_index) % 4)]
  end,
  case
    when t.proof_kind = 'number' then
      case t.unit
        when 'шагов'  then 4000 + ((c.n * 811 + t.day_index * 397) % 71) * 100
        when 'сек'    then   40 + ((c.n * 811 + t.day_index * 397) % 90)
        when 'этажей' then    3 + ((c.n * 811 + t.day_index * 397) % 18)
        when 'раз'    then    8 + ((c.n * 811 + t.day_index * 397) % 28)
        else 1
      end
  end
from public.marathons m
join public.marathon_tasks t on t.marathon_id = m.id
/*
 * `diligence` is how many days in ten this person delivers, and the modulus
 * below is a fixed hash rather than `random()` so that re-running the seed
 * redraws the same week. Nobody is at ten: a board where everyone did
 * everything has nothing to read.
 */
join (values (1, 9), (2, 8), (3, 7), (4, 6), (5, 5), (6, 4), (7, 6)) as c (n, diligence) on true
join public.marathon_members mem
  on mem.marathon_id = m.id
 and mem.email = ('klub-test-' || c.n || '@example.test')::citext
where m.slug = 'klub_test'
  and t.day_index <= (current_date - m.starts_on) + 1   -- nothing from the future
  and t.proof_kind <> 'media'
  and ((t.day_index * 31 + t.sort_order * 17 + c.n * 13) % 10) < c.diligence
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
-- It puts everyone it is given into «Пара 1», beside the invented partner from
-- section 3. `team_size` is 2 above, so the `all_members` tasks of that pair
-- score only once both of them have delivered — which is the mechanic the whole
-- format runs on, and the thing worth watching on the board.
-- =============================================================================

-- =============================================================================
-- 5) Handy afterwards
-- =============================================================================
--
-- Что сейчас в плане:
--   select day_index, sort_order, title, rule, points, proof_kind
--   from public.marathon_tasks
--   where marathon_id = (select id from public.marathons where slug = 'klub_test')
--   order by day_index, sort_order;
--
-- Сдвинуть неделю (например, чтобы сегодня стал четвёртым днём):
--   update public.marathons set starts_on = current_date - 3 where slug = 'klub_test';
--
-- Стереть тестовый клуб целиком — задания, участников, команды и отчёты:
--   delete from public.marathons where slug = 'klub_test';
