-- =============================================================================
-- 0036 — чья это тренировка.
--
-- Владелец: «по хорошему бы запоминать от кого тренировка, через кого она создавалась и показывать
-- это пользователю, потому что я также хочу сделать с йогой потом».
--
-- ## Два разных факта, и в базе их теперь тоже два
--
-- `author_id` (0006) уже есть и отвечает на «через кого» — это аккаунт, из которого нажали
-- «Сохранить». Он служебный: по нему видно, кто правил, и наружу он не выходит никогда, потому что
-- ведёт на `auth.users`.
--
-- `author_slug` — про «от кого», и это другое. Йогу ведёт не Сергей, а заводить её тренировки
-- будет владелец: аккаунт один, работа чужая. Вывести одно из другого нельзя, поэтому автора
-- **выбирают** в редакторе.
--
-- ## Почему text, а не ссылка на таблицу
--
-- Авторов двое, и список живёт в `content/site/authors.ts`, а не в базе: таблица, экран для неё и
-- загрузка фотографий стоили бы дороже всего, что они дают. Здесь остаётся ключ — короткое слово,
-- по которому приложение находит имя и фотографию.
--
-- Проверка формы, но не существования: база не знает, кто есть в том файле, и не должна. Автор,
-- которого удалили из списка, — это `authorById()` вернул null и подписи нет; строка при этом
-- цела, и вернуть автора можно правкой одной строчки в файле.
--
-- Курсы сюда не попали, и это не упущение: `admin_courses.content` — jsonb в форме, которую
-- задаёт `CourseDraftContent`, и автор кладётся туда полем. Миграция для этого не нужна.
--
-- Идемпотентна.
-- =============================================================================

alter table public.custom_workouts add column if not exists author_slug text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'custom_workouts_author_slug_fmt') then
    alter table public.custom_workouts
      add constraint custom_workouts_author_slug_fmt
      check (author_slug is null or author_slug ~ '^[a-z0-9_]{2,40}$');
  end if;
end $$;

/*
 * Всё, что заведено до сегодня, — Сергея: других авторов до этой миграции не было, и продукт до
 * сих пор говорил о тренировках как о его. Пустая колонка означала бы «неизвестно», а это неправда.
 *
 * `is null` обязательно: повторный прогон не должен переписать то, что уже проставили руками.
 */
update public.custom_workouts set author_slug = 'sergey' where author_slug is null;

/*
 * Подпись должна доехать до того, кому тренировку выдали, — а он читает не таблицу, а это
 * представление. Остальные колонки и `security_invoker = false` как в 0006: представление само
 * фильтрует по `current_email()`, и менять тут больше нечего.
 */
drop view if exists public.my_custom_workouts;
create view public.my_custom_workouts
with (security_invoker = false)
as
  select w.id, w.short_id, w.title, w.title_en, w.description, w.description_en,
         w.author_slug, w.structure, w.est_sec, w.points,
         a.created_at as assigned_at
  from public.assigned_workouts a
  join public.custom_workouts w on w.id = a.custom_workout_id
  where a.email = public.current_email() and w.is_archived = false;

revoke all on public.my_custom_workouts from anon, authenticated;
grant select on public.my_custom_workouts to authenticated;

notify pgrst, 'reload schema';
