-- =============================================================================
-- 0024 — какие выданные тренером тренировки уже сделаны.
--
-- Владелец: «эту тренировку нужно показывать на странице, на вкладке "Курсы"
-- отдельно плашкой… тренировка висит до тех пор, пока не выполнена».
--
-- Чтобы плашка исчезла, экрану надо знать, какие из выданных тренировок
-- завершены. Своего признака у `assigned_workouts` нет и не должно быть:
-- выполнение записывается там же, где выполнение всего остального, — строкой в
-- `workout_sessions` с `course_id = 'custom'` и `node_id` = коротким id
-- тренировки (`useCustomWorkoutStart.ts`). Это вычитание из того, что уже
-- записано, как проба курса и пробная неделя клуба.
--
-- ## Почему не по `recentSessions`
--
-- Стор прогресса держит последние 60 сессий. Тренировка, выданная и сделанная
-- месяц назад, из этого окна выпадает — и плашка, которую человек закрыл,
-- вернулась бы. Ровно этот довод записан в `courseAccess.ts` про
-- `my_trained_courses()`; здесь та же функция для другого ключа.
--
-- Требует 0001_init.sql и 0006_custom_workouts.sql. Идемпотентна.
-- =============================================================================

create or replace function public.my_done_custom_workouts()
returns text[]
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select coalesce(array_agg(distinct s.node_id), array[]::text[])
  from public.workout_sessions s
  where s.user_id = auth.uid()
    and s.course_id = 'custom'
    and s.completed_at is not null;
$$;

comment on function public.my_done_custom_workouts() is
  'Short ids of the coach-built workouts the caller has finished at least once (0024). The card on «Курсы» reads it to know which assignment is still outstanding.';

revoke execute on function public.my_done_custom_workouts() from public, anon;
grant execute on function public.my_done_custom_workouts() to authenticated;
