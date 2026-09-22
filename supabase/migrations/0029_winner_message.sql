-- =============================================================================
-- 0029 — сказать победителю, что он победил.
--
-- 0028 научила тренера объявлять победителя недели, 0027 — ставить поводы в
-- очередь. Это стык: объявление становится сообщением.
--
-- ## Почему это важнее остальных сообщений в очереди
--
-- «Оплата дошла» человек и так узнает, открыв приложение. А победа — нет:
-- плашку на вкладке клуба увидит только тот, кто в тот день туда зашёл, а приз
-- (час с Сергеем) нужно ещё получить, то есть написать ему. Без сообщения
-- обещание из приветствия бота закрывается только для внимательных.
--
-- ## Один победитель — одно сообщение, даже если тренер передумал
--
-- Ключ включает и неделю, и участника. Поэтому:
--   * повторное объявление того же человека за ту же неделю (тренер поправил
--     заметку) второго сообщения не даёт;
--   * объявление **другого** человека — даёт, ему: он победитель и узнать об
--     этом должен;
--   * тому, у кого победу забрали, ничего не отправляется и ничего не
--     отзывается. Забрать уже отправленное сообщение телеграм не умеет, а
--     «извини, не ты» роботом — это то, что тренер должен сказать сам.
--
-- Срок — сутки. Поздравление, доехавшее на третий день, поздравлением уже не
-- является.
--
-- Требует 0027_telegram_outbox.sql, 0028_weekly_winner.sql. Идемпотентна.
-- =============================================================================

alter table public.telegram_outbox drop constraint if exists telegram_outbox_kind_check;
alter table public.telegram_outbox add constraint telegram_outbox_kind_check
  check (kind in (
    'course_paid',
    'subscription_paid',
    'workout_assigned',
    'weekly_winner'
  ));

create or replace function public.marathon_winners_notify()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_email citext;
  v_prize text;
begin
  -- Адрес участника — единственное, что связывает победителя с очередью: она
  -- вся живёт на почтах, потому что получателя ищет отправитель (0027).
  select mem.email into v_email
  from public.marathon_members mem
  where mem.id = new.member_id;

  if v_email is null then
    return new;
  end if;

  select m.prize into v_prize from public.marathons m where m.id = new.marathon_id;

  perform public.enqueue_telegram(
    v_email::text,
    'weekly_winner',
    'weekly_winner:' || new.marathon_id::text || ':' || new.week::text
      || ':' || new.member_id::text,
    jsonb_build_object('prize', coalesce(v_prize, ''), 'note', coalesce(new.note, '')),
    now(),
    interval '1 day'
  );
  return new;
end;
$$;

drop trigger if exists marathon_winners_notify on public.marathon_winners;
create trigger marathon_winners_notify
  after insert or update of member_id on public.marathon_winners
  for each row execute function public.marathon_winners_notify();

comment on function public.marathon_winners_notify() is
  'Turns an announcement (0028) into a queued bot message (0027). Keyed on the member, so changing the winner writes to the new one and never un-sends to the old (0029).';
