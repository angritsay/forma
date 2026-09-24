-- =============================================================================
-- 0048 — медиа упражнения: режим клипа, название голосом, объяснения, счётчик показов.
--
-- Владелец собирает курс йоги, и у позы там больше, чем один клип на повтор:
--
--   1. `video_mode` — как играть клип в плеере. `loop` (как раньше): клип крутится по кругу,
--      пока идёт шаг. `fit`: клип замедляется под длительность шага (не ниже 0.5×) и держит
--      последний кадр — для асаны, которую входят и держат, а не повторяют.
--   2. `audio_ru` / `audio_en` — название упражнения, записанное голосом; плеер произносит его в
--      начале шага, чтобы не читать с экрана в позе, где на экран не посмотреть.
--   3. `intro_full` / `intro_brief` — объяснение перед упражнением: полное показывается в первый
--      раз, короткое — ещё два раза, потом ничего. Каждое — jsonb вида
--      `{ "text"?: {"ru"?, "en"?}, "video"?: "storage:videos/…", "audio"?: {"ru"?: "storage:audio/…", "en"?} }`.
--   4. Бакет `audio` — закрытый, с теми же правилами доступа, что у `videos` (0003): `shared/…`
--      любому, кто вошёл, `<course_id>/…` — купившим, пишут только админы.
--   5. `exercise_intro_views` — сколько раз человек уже видел объяснение; две RPC над ней.
--
-- Колонки — разметка, а не описание: 0007 (генерируемый сид) их не трогает, как и `video_ru`.
--
-- Требует 0001 (has_entitlement, is_admin, set_updated_at), 0003, 0006. Идемпотентна.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Колонки упражнения.
-- -----------------------------------------------------------------------------
alter table public.exercises add column if not exists video_mode text not null default 'loop';
alter table public.exercises drop constraint if exists exercises_video_mode_check;
alter table public.exercises add constraint exercises_video_mode_check
  check (video_mode in ('loop', 'fit'));
comment on column public.exercises.video_mode is
  'How the player runs the clip: loop (repeat while the step lasts) or fit (slow down to the step, min 0.5x, then hold the last frame).';

alter table public.exercises add column if not exists audio_ru text;
alter table public.exercises add column if not exists audio_en text;
comment on column public.exercises.audio_ru is
  'The exercise name spoken aloud, Russian: storage:audio/<folder>/<id>.ru.m4a or an https URL.';
comment on column public.exercises.audio_en is
  'The exercise name spoken aloud, English: storage:audio/<folder>/<id>.en.m4a or an https URL.';

alter table public.exercises add column if not exists intro_full jsonb;
alter table public.exercises add column if not exists intro_brief jsonb;
comment on column public.exercises.intro_full is
  'Explanation shown the first time the person meets the exercise: {text?: {ru?, en?}, video?: storage ref, audio?: {ru?, en?}}. Null — none.';
comment on column public.exercises.intro_brief is
  'Shorter explanation for the second and third time, same shape as intro_full. Null — none.';

-- An intro is two sentences and three references; 16 KB is a ceiling, not a budget.
alter table public.exercises drop constraint if exists exercises_intro_full_len;
alter table public.exercises add constraint exercises_intro_full_len
  check (intro_full is null or octet_length(intro_full::text) <= 16384) not valid;
alter table public.exercises drop constraint if exists exercises_intro_brief_len;
alter table public.exercises add constraint exercises_intro_brief_len
  check (intro_brief is null or octet_length(intro_brief::text) <= 16384) not valid;

-- -----------------------------------------------------------------------------
-- 2. Бакет `audio` — закрытый, политики один в один с `videos` (0003_storage.sql).
--
--   audio/<course_id>/<file>   → нужна активная покупка <course_id>
--   audio/shared/<file>        → любой, кто вошёл
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

drop policy if exists "audio: entitled select" on storage.objects;
create policy "audio: entitled select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'audio'
    and (
      (storage.foldername(name))[1] = 'shared'
      or public.has_entitlement((storage.foldername(name))[1])
    )
  );

drop policy if exists "audio: admin insert" on storage.objects;
create policy "audio: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio' and public.is_admin());

drop policy if exists "audio: admin update" on storage.objects;
create policy "audio: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'audio' and public.is_admin())
  with check (bucket_id = 'audio' and public.is_admin());

drop policy if exists "audio: admin delete" on storage.objects;
create policy "audio: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'audio' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. Сколько раз человек видел объяснение упражнения.
--
-- Своя таблица, а не поле в `user_course_state`: объяснение принадлежит упражнению, а не
-- курсу — та же поза во втором курсе уже знакома. Только свои строки.
-- -----------------------------------------------------------------------------
create table if not exists public.exercise_intro_views (
  user_id      uuid not null references auth.users (id) on delete cascade,
  exercise_id  text not null check (exercise_id ~ '^[a-z0-9_]{2,60}$'),
  views        int not null default 0 check (views >= 0),
  updated_at   timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

comment on table public.exercise_intro_views is
  'How many times a person has been shown an exercise''s explanation (full the first time, brief the next two). Own rows only.';

drop trigger if exists exercise_intro_views_touch on public.exercise_intro_views;
create trigger exercise_intro_views_touch
  before update on public.exercise_intro_views
  for each row execute function public.set_updated_at();

alter table public.exercise_intro_views enable row level security;

drop policy if exists "exercise_intro_views: own rows" on public.exercise_intro_views;
create policy "exercise_intro_views: own rows"
  on public.exercise_intro_views for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.exercise_intro_views from anon, authenticated;
grant select, insert, update on public.exercise_intro_views to authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: отметить показ и прочитать свои счётчики.
-- -----------------------------------------------------------------------------
create or replace function public.mark_exercise_intro_seen(p_exercise_id text)
returns int
language sql
volatile
security invoker
set search_path = pg_catalog, public, extensions
as $$
  insert into public.exercise_intro_views (user_id, exercise_id, views)
  values (auth.uid(), p_exercise_id, 1)
  on conflict (user_id, exercise_id) do update
    set views = exercise_intro_views.views + 1,
        updated_at = now()
  returning views;
$$;

comment on function public.mark_exercise_intro_seen(text) is
  'Counts one more showing of the exercise''s explanation for the caller and returns the new total.';

revoke all on function public.mark_exercise_intro_seen(text) from public, anon;
grant execute on function public.mark_exercise_intro_seen(text) to authenticated;

create or replace function public.my_exercise_intro_views()
returns table (exercise_id text, views int)
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  select v.exercise_id, v.views
  from public.exercise_intro_views v
  where v.user_id = auth.uid();
$$;

comment on function public.my_exercise_intro_views() is
  'Every exercise whose explanation the caller has seen, with the number of showings.';

revoke all on function public.my_exercise_intro_views() from public, anon;
grant execute on function public.my_exercise_intro_views() to authenticated;
