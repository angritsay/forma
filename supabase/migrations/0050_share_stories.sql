-- =============================================================================
-- 0050 — сторис после тренировки: публичный бакет для картинки, которой делятся.
--
-- Кнопка «Поделиться» на итогах тренировки теперь рисует картинку 1080×1920 (одна из шести
-- брендовых сторис) и отдаёт её в Instagram, Telegram Stories, чат Telegram или на телефон.
-- Telegram (`shareToStory`, `downloadFile`) забирает картинку со своих серверов, поэтому ей нужен
-- публичный HTTPS-адрес — отсюда бакет:
--
--   stories/<uid>/<session_id>-<template>.png
--
--   1. Публичный: читает кто угодно по прямой ссылке (иначе Telegram её не скачает).
--   2. Пишет только вошедший и только в свою папку `<auth.uid()>/…`.
--   3. Удалить может только владелец. Обновлять нельзя никому: имя файла однозначно задаёт
--      картинку, повторная загрузка той же сторис — не ошибка, а тот же файл.
--   4. Только PNG, не больше 5 МБ.
--
-- Личных данных в картинке нет: ни имени, ни почты — название тренировки, курс, цифры, дата и
-- логотип. Файлы лежат, пока владелец их не удалит; чистку старых можно добавить потом отдельной
-- задачей.
--
-- Требует storage (Supabase). Идемпотентна.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('stories', 'stories', true, 5242880, array['image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "stories: public select" on storage.objects;
create policy "stories: public select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'stories');

drop policy if exists "stories: own insert" on storage.objects;
create policy "stories: own insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "stories: own delete" on storage.objects;
create policy "stories: own delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
