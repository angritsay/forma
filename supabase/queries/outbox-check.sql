-- Что творится в очереди сообщений бота (0027).
--
-- Запускается задачей `outbox-check` из .github/workflows/supabase-apply.yml.
--
-- Очередь наполняется триггерами и опустошается по расписанию — то есть целиком
-- работает без единого нажатия. Значит, и ломается молча: строки копятся, а
-- узнать об этом неоткуда. Это единственное окно внутрь.
--
-- **Здесь нет ни одного личного данного, и это не случайность.** Страница запуска
-- в публичном репозитории видна всем и остаётся навсегда. Поэтому только
-- счётчики и одна дата — ни адреса, ни текста сообщения.
--
-- `waiting_for_telegram` отличает две совершенно разные беды. Если растёт оно —
-- всё работает, просто людям нечем писать: они не открывали приложение из
-- телеграма. Если растёт `pending` при нулевом `waiting` — не ходит расписание
-- или функция отвечает отказом, и чинить надо там.
select
  (select count(*) from public.telegram_outbox where status = 'pending')  as pending,
  (select count(*) from public.telegram_outbox where status = 'sent')     as sent,
  (select count(*) from public.telegram_outbox where status = 'skipped')  as skipped,
  (select count(*) from public.telegram_outbox where status = 'failed')   as failed,
  (select count(*)
     from public.telegram_outbox o
     where o.status = 'pending'
       and not exists (
         select 1 from public.profiles p
         where p.email = o.email and p.telegram_id is not null
       ))                                                                 as waiting_for_telegram,
  (select to_char(min(created_at) at time zone 'UTC', 'YYYY-MM-DD HH24:MI')
     from public.telegram_outbox where status = 'pending')                as oldest_pending_utc;
