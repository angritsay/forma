-- =============================================================================
-- 0069 — the renewal reminder knows which plan it is about.
--
-- `subscription_ending` (0054, restated in 0062) carried only `expires_at`, which was enough while
-- every subscription ended by itself: the bot said «Автопродления нет — продли в приложении».
--
-- Automatic monthly renewal is prepared behind one switch (`RENEWAL`, content/site/plans.ts,
-- docs/SETUP.md §7.18) and is **off**. Once it is on, a live monthly subscription that has not
-- been cancelled will be charged by itself, and its reminder has to say so — «в этот день спишем
-- …, отменить можно так» — while an annual or a cancelled one keeps the old words. The bot can only
-- tell them apart if the row says which it is.
--
-- ## What changes
--
-- `club_enqueue_access_ending` adds the subscription's `plan` and `status` to the row's params.
-- Nothing else: who is warned, when, the dedupe key and the row's lifetime are exactly 0062's.
-- With the switch off `telegram-notify` ignores the two new fields, so the message sent today is
-- unchanged; a row queued before this migration has neither and is read as manual renewal.
-- =============================================================================

create or replace function public.club_enqueue_access_ending(p_at timestamptz default now())
returns int
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_at     timestamptz := coalesce(p_at, now());
  v_queued int := 0;
  v_row    record;
  v_key    text;
begin
  -- As in `club_enqueue_daily` (0052): a person's session — no; empty claims and service role — yes.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '')
     not in ('', 'service_role') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  -- --- subscription_ending: live, ends within three days --------------------
  for v_row in
    select s.id, s.email, s.expires_at, s.plan, s.status
    from public.subscriptions s
    where s.status in ('active', 'cancelled')
      and s.expires_at is not null
      and s.expires_at > v_at
      and s.expires_at <= v_at + interval '3 days'
      -- A period no longer than the warning itself gets no warning (see 0054).
      and coalesce(s.started_at, s.created_at) < s.expires_at - interval '3 days'
      and not exists (select 1 from public.admins a where a.email = s.email)
    order by s.expires_at
  loop
    begin
      v_key := 'subscription_ending:' || v_row.id::text || ':'
               || floor(extract(epoch from v_row.expires_at))::bigint::text;
      -- Already queued for this period (an earlier hour): skip. Checked before, not after, so
      -- that a repeat within one transaction — the tests' — is not counted as new either.
      continue when exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key);
      perform public.enqueue_telegram(
        v_row.email::text,
        'subscription_ending',
        v_key,
        -- `plan` and `status` since 0069: whether the period renews by itself (the bot decides,
        -- by the `RENEWAL` switch).
        jsonb_build_object(
          'expires_at', v_row.expires_at,
          'plan', v_row.plan,
          'status', v_row.status
        ),
        now(),
        -- Never outlives the period it warns about (the sender also re-checks, see 0054).
        least(interval '2 days', v_row.expires_at - now())
      );
      -- enqueue_telegram drops a malformed address without a word: count only a row that landed.
      if exists (select 1 from public.telegram_outbox o where o.dedupe_key = v_key) then
        v_queued := v_queued + 1;
      end if;
    exception when others then
      -- One person loses one message, not the whole run.
      null;
    end;
  end loop;

  return v_queued;
end;
$$;

revoke execute on function public.club_enqueue_access_ending(timestamptz) from public, anon, authenticated;
grant execute on function public.club_enqueue_access_ending(timestamptz) to service_role;

comment on function public.club_enqueue_access_ending(timestamptz) is
  'Queue subscription_ending (3 days before expires_at), once per period (0054); params carry expires_at, plan and status (0069) so the bot can tell a self-renewing period from one that ends. Since 0062 club_trial_tomorrow is no longer queued. Service role only; returns how many rows were queued.';
