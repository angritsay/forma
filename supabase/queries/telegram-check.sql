-- Скольким людям бот вообще может написать.
--
-- Запускается задачей `telegram-check` из .github/workflows/supabase-apply.yml.
--
-- Вопрос, на который иначе не ответить ничем: привязка (0026) случается молча,
-- внутри мини-аппа, и если она не работает, это видно только по тому, что
-- сообщения никуда не уходят. А это выясняется уже после того, как на рассылку
-- понадеялись.
--
-- **Здесь нет ни одного личного данного, и это не случайность.** Страница
-- запуска в публичном репозитории видна всем и остаётся навсегда. Поэтому —
-- только счётчики и одна дата: ни почты, ни имени, ни самого telegram id.
--
-- `linked_24h` отличает «работает» от «работало когда-то»: если общее число
-- растёт, а за сутки ноль, значит привязка сломалась после какого-то деплоя, и
-- искать надо там, а не в списке людей.
select
  (select count(*) from public.profiles)                                        as people,
  (select count(*) from public.profiles where telegram_id is not null)          as linked,
  (select count(*) from public.profiles
    where telegram_id is not null and updated_at > now() - interval '24 hours') as linked_24h,
  (select to_char(max(updated_at) at time zone 'UTC', 'YYYY-MM-DD HH24:MI')
     from public.profiles where telegram_id is not null)                        as last_link_utc;
