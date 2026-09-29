-- =============================================================================
-- 0053 — позвавшая тоже в клубе: пара складывается, даже если она туда не заходила.
--
-- Сайт зовёт «начать вместе с понедельника» (`/together/`), и личная ссылка обещает: подруга
-- оплатит клуб по ней — обеим по +30 дней, и вы окажетесь в одной паре, если пары ещё нет.
-- 0051 сводил пару только тех, кто уже записан в дуо-круг. Подругу он записывал сам — она
-- только что оплатила. А позвавшую нет: если она ни разу не открывала вкладку «Клуб»
-- (`join_club()` пишет в круги только оттуда), её строки в `marathon_members` нет, и пара молча
-- не складывалась. Чаще всего так и будет: позвать с сайта может человек, который клубом ещё не
-- пользовался, — у него месяц появился как раз от этой награды.
--
-- ## Что меняется
--
-- Только `referral_reward(citext)`: та же сигнатура, та же `security definer`, те же права (не
-- выдана никому, зовёт её триггер `referrals_reward` из 0051). В блоке пары, рядом с записью
-- подруги, в оба круга — `club_marathon(false)` и `club_marathon(true)` — записывается и
-- позвавшая. Дальше работает прежняя проверка 0051, и `club_duo_pair(..., false)` сводит их.
--
-- ## Кого не записываем
--
--   * **Без награды.** Лимит — двенадцать за скользящий год (0051): тринадцатая позвавшей
--     ничего не даёт, и записи в клуб тоже. Запись — часть награды, а не её замена. Если такая
--     позвавшая уже в круге, пара сводится как раньше: это правило 0051, оно не трогается.
--   * **Без живого клуба.** После награды строка подписки позвавшей живая по устройству, но
--     проверка стоит явно (`subscription_live`): записывать в клуб того, у кого доступа нет, —
--     значит показывать его на доске людям, которые платят.
--   * **Ушедшая.** Не быть в круге после того, как была, — это строка со статусом `removed`
--     (0011, 0016); другого «ушла» в схеме нет. `on conflict do nothing` её не трогает: позвавшая,
--     которую убрали, по ссылке обратно не возвращается. `join_club()` иногда оживляет
--     `removed` без заметок — это его правило, для человека, который сам нажал «в клуб»; здесь
--     никто ничего не нажимал, поэтому ничего и не оживляем.
--   * **Выбранная пара.** Остаётся: проверка 0051 сводит только тех, у кого пары нет или она
--     автоматическая.
--
-- Всё по-прежнему в `exception when others then null`: сбой записи в клуб или пары не стоит
-- ни оплаты, ни награды (0040).
--
-- Требует 0051_referrals.sql. Идемпотентна.
-- =============================================================================

create or replace function public.referral_reward(p_email citext)
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_ref        record;
  v_owner      citext;
  v_days       int;
  v_year       int;
  v_owner_days int;
  v_os         public.subscriptions%rowtype;
  v_oid        uuid;
  v_oexp       timestamptz;
  v_key        text;
  v_club       uuid;
  v_id         uuid;
  v_om         record;
  v_fm         record;
  v_owner_live boolean := false;
begin
  select r.referred_email, r.reward_days, c.owner_email
    into v_ref
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where r.referred_email = p_email and r.rewarded_at is null
  for update of r;

  if v_ref.referred_email is null then
    return 0;
  end if;
  v_owner := v_ref.owner_email;
  v_days  := v_ref.reward_days;

  -- Лимит позвавшей: двенадцать наград за скользящий год.
  select count(*) into v_year
  from public.referrals r
  join public.referral_codes c on c.code = r.code
  where c.owner_email = v_owner
    and r.owner_days > 0
    and r.rewarded_at > now() - interval '1 year';
  v_owner_days := case when v_year < 12 then v_days else 0 end;

  update public.referrals
     set rewarded_at = now(), owner_days = v_owner_days
   where referred_email = p_email;

  -- Дни позвавшей: продлить живую подписку, иначе завести (или оживить) строку на месяц.
  if v_owner_days > 0 then
    select * into v_os from public.subscriptions s where s.email = v_owner;
    if found and public.subscription_live(v_os.status, v_os.expires_at) then
      update public.subscriptions
         set expires_at = expires_at + make_interval(days => v_owner_days),
             updated_at = now()
       where email = v_owner
      returning id, expires_at into v_oid, v_oexp;
    else
      insert into public.subscriptions (email, plan, status, started_at, expires_at, source, note)
      values (v_owner, 'annual', 'active', now(), now() + make_interval(days => v_owner_days),
              'referral', 'referral')
      on conflict (email) do update
        set plan       = 'annual',
            status     = 'active',
            started_at = coalesce(public.subscriptions.started_at, excluded.started_at),
            expires_at = excluded.expires_at,
            source     = 'referral',
            note       = 'referral',
            updated_at = now()
      returning id, expires_at into v_oid, v_oexp;
    end if;

    -- Та запись только что сказала позвавшей «оплата дошла» (0027) и владельцу «клуб оплачен /
    -- продлён» (0040). Она не платила — эти две строки снимаются, своё сообщение идёт ниже.
    begin
      v_key := v_oid::text || ':' || coalesce(v_oexp::text, 'none');
      delete from public.telegram_outbox
       where dedupe_key = 'subscription_paid:' || v_key and status = 'pending';
      delete from public.admin_outbox
       where dedupe_key in ('club_paid:' || v_key, 'club_renewed:' || v_key) and status = 'pending';
    exception when others then
      null;
    end;
  end if;

  -- Сообщения обоим и в канал. Ключ — по хэшу почты: адрес длиной до 254 не влезает в 200.
  begin
    perform public.enqueue_telegram(
      p_email::text,
      'referral_reward',
      'referral_reward:' || md5(lower(p_email::text)) || ':friend',
      jsonb_build_object('role', 'friend', 'days', v_days),
      now(),
      interval '7 days'
    );
    perform public.enqueue_telegram(
      v_owner::text,
      'referral_reward',
      'referral_reward:' || md5(lower(p_email::text)) || ':owner',
      jsonb_build_object('role', 'owner', 'days', v_owner_days),
      now(),
      interval '7 days'
    );
    perform public.enqueue_admin(
      'club',
      'referral_paid',
      'referral_paid:' || md5(lower(p_email::text)),
      jsonb_build_object(
        'inviter', v_owner::text,
        'friend', p_email::text,
        'days', v_days,
        'inviterDays', v_owner_days
      )
    );
  exception when others then
    null;
  end;

  -- Пара: обе в дуо-клубе — значит вместе. Подруга заводится в оба круга, как в `join_club`.
  -- С 0053 — и позвавшая, если награда ей начислена и клуб у неё живой (см. шапку 0053).
  begin
    v_club := public.club_marathon(true);
    if v_club is not null then
      select * into v_os from public.subscriptions s where s.email = v_owner;
      v_owner_live := coalesce(
        v_owner_days > 0 and found and public.subscription_live(v_os.status, v_os.expires_at),
        false
      );

      foreach v_id in array array[public.club_marathon(false), v_club] loop
        continue when v_id is null;
        insert into public.marathon_members (marathon_id, email, status)
        values (v_id, p_email, 'active')
        on conflict (marathon_id, email) do nothing;
        -- Ушедшая (строка есть, `removed`) не возвращается: `do nothing`, не `do update`.
        if v_owner_live then
          insert into public.marathon_members (marathon_id, email, status)
          values (v_id, v_owner, 'active')
          on conflict (marathon_id, email) do nothing;
        end if;
      end loop;

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_om
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = v_owner and m.status = 'active';

      select m.id, m.team_id, coalesce(t.is_auto, false) as is_auto into v_fm
      from public.marathon_members m
      left join public.marathon_teams t on t.id = m.team_id
      where m.marathon_id = v_club and m.email = p_email and m.status = 'active';

      -- Автоматическая пара — не выбор, и уступает выбранной (0034). Выбранная остаётся.
      if v_om.id is not null and v_fm.id is not null
         and (v_om.team_id is null or v_om.is_auto)
         and (v_fm.team_id is null or v_fm.is_auto) then
        perform public.club_duo_pair(v_club, v_om.id, v_fm.id, false);
      end if;
    end if;
  exception when others then
    null;
  end;

  return v_days;
end;
$$;

revoke execute on function public.referral_reward(citext) from public, anon, authenticated;

comment on function public.referral_reward(citext) is
  'Pay the referral reward for this newcomer''s first club payment (0051). Trigger-only; returns the days to add to the newcomer''s row. Since 0053 it also enrols a rewarded inviter with live access in both club circles (never one who left), so the pair can form.';

notify pgrst, 'reload schema';
