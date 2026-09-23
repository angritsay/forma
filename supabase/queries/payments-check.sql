-- Дошло ли хоть одно уведомление об оплате — вопрос, на который иначе отвечают
-- логи Edge Function, а их с телефона не почитать.
--
-- Запускается задачей `payments-check` из .github/workflows/supabase-apply.yml.
--
-- **Здесь нет ни одного личного данного, и это не случайность.** Страница
-- запуска в публичном репозитории видна всем и остаётся навсегда, а workflow
-- заведён с правилом «тело ответа не печатается, в строках бывают реальные
-- люди». Поэтому запрос возвращает ровно одну строку из счётчиков, сумм и дат:
-- ни почты, ни номера заказа, ни идентификатора. Этого хватает, чтобы отличить
-- «Prodamus не звонил» от «дошло, но не привязалось», а больше и не нужно.
--
-- Чего этот запрос по устройству увидеть не может: отклонённую доставку.
-- Уведомление с неверным токеном или несошедшейся подписью не пишется никуда —
-- функция отвечает 403 и ничего не сохраняет, и это правильно: иначе любой
-- прохожий наполнял бы нам таблицу. Так что `payments_total = 0` значит одно из
-- двух: либо Prodamus не звонил вовсе, либо звонил и был отвергнут на входе.
-- Различает их история оплат в кабинете Prodamus — там у каждого платежа виден
-- статус отправки уведомления и ответ, который он получил.
select
  (select count(*) from public.payments)                                        as payments_total,
  (select count(*) from public.payments
    where paid_at > now() - interval '24 hours')                                as payments_24h,
  -- Занятие с тренером ничего не открывает и непривязанным не бывает (0043 пишет его с
  -- applied = true и поправила старые строки); исключено и здесь — на базе, где 0043 ещё нет.
  (select count(*) from public.payments
    where applied = false and claimed_by is null and intent <> 'session')       as payments_unclaimed,
  (select count(*) from public.payments where intent = 'session')               as sessions_paid,
  (select to_char(max(paid_at) at time zone 'UTC', 'YYYY-MM-DD HH24:MI')
     from public.payments)                                                      as last_paid_at_utc,
  (select amount  from public.payments order by paid_at desc limit 1)           as last_amount,
  (select intent  from public.payments order by paid_at desc limit 1)           as last_intent,
  (select applied from public.payments order by paid_at desc limit 1)           as last_applied,
  (select count(*) from public.subscriptions
    where public.subscription_live(status, expires_at))                         as subscriptions_live,
  (select count(*) from public.purchases where status = 'pending')              as orders_pending,
  (select count(*) from public.purchases where status = 'active')               as purchases_active,
  (select count(*) from public.payment_emails)                                  as linked_payment_emails;
