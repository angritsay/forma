-- =============================================================================
-- Subscriptions (0005): entitlements union, intents, webhook activation, admin, expiry.
-- Run after 10_smoke.sql on the same database (it reuses its users and helpers are re-declared).
-- =============================================================================
\set ON_ERROR_STOP on
\set QUIET on
\pset format unaligned
\pset tuples_only on

create or replace function pg_temp.as_user(p_id uuid, p_email text, p_role text default 'authenticated')
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', p_role)::text, false);
  execute format('set role %I', p_role);
end $$;
create or replace function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', false);
  set role anon;
end $$;
create or replace function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', false);
  set role service_role;
end $$;
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000010', 'sub@example.com', '{}')
on conflict (id) do nothing;
grant select on public.subscriptions to service_role;

-- Anonymous intent -----------------------------------------------------------------
select pg_temp.as_anon();
do $$ declare v1 uuid; v2 uuid; v_err text; begin
  v1 := public.create_subscription_order(' Sub@Example.com ', 'monthly', 'en', 'landing');
  v2 := public.create_subscription_order('sub@example.com', 'annual', 'ru', 'app');
  assert v1 = v2, 'one row per email';
  begin
    perform public.create_subscription_order('sub@example.com', 'weekly');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_plan', 'invalid_plan raised, got ' || v_err;
  end;
  begin
    perform public.create_subscription_order('nope', 'monthly');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_email', 'shared email validator';
  end;
  begin
    perform public.apply_subscription_payment('sub@example.com', 'monthly', 'x');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK subscription intents';
end $$;

select pg_temp.as_super();
do $$ declare r record; begin
  select plan, status, source, locale into r from public.subscriptions where email = 'sub@example.com';
  assert r.plan = 'annual', 'a pending intent follows the latest choice';
  assert r.status = 'pending';
  assert r.source = 'app';
end $$;

-- Not an entitlement until paid ------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000010', 'sub@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = 0, 'pending subscription grants nothing';
  assert (select count(*) from public.subscriptions) = 0, 'customer cannot read the table';
  assert (select is_live from public.my_subscription) = false, 'own row visible, not live';
  begin
    perform public.apply_subscription_payment('sub@example.com', 'monthly', 'x');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_set_subscription('sub@example.com', 'monthly', 'active');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK customer restrictions';
end $$;

-- Webhook payment activates, renews, and is idempotent ------------------------------
select pg_temp.as_service();
do $$ declare v_id uuid; v_exp timestamptz; begin
  v_id := public.apply_subscription_payment('SUB@example.com', 'monthly', 'ord-1', '2026-09-01 10:00+00');
  select expires_at into v_exp from public.subscriptions where id = v_id;
  assert v_exp = timestamptz '2026-10-01 10:00+00', 'one month from the payment, got ' || v_exp;
  -- the same notification again: nothing moves
  perform public.apply_subscription_payment('sub@example.com', 'monthly', 'ord-1', '2026-09-01 10:00+00');
  assert (select expires_at from public.subscriptions where id = v_id) = v_exp, 'duplicate delivery ignored';
  -- a renewal before expiry extends from the expiry, not from the payment date
  perform public.apply_subscription_payment('sub@example.com', 'monthly', 'ord-2', '2026-09-28 10:00+00');
  assert (select expires_at from public.subscriptions where id = v_id) = timestamptz '2026-11-01 10:00+00', 'renewal chains';
  raise notice 'OK webhook payments';
end $$;

-- Live subscription = every course ---------------------------------------------------
select pg_temp.as_super();
update public.subscriptions set expires_at = now() + interval '20 days' where email = 'sub@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-000000000010', 'sub@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = (select count(*) from public.courses), 'all courses while live';
  assert (select is_live from public.my_subscription), 'live';
  assert (select plan from public.my_subscription) = 'monthly';
  raise notice 'OK entitlements while live';
end $$;

-- Expired = nothing, cancelled keeps the paid period ---------------------------------
select pg_temp.as_super();
update public.subscriptions set expires_at = now() - interval '1 hour' where email = 'sub@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-000000000010', 'sub@example.com');
do $$ begin
  assert (select count(*) from public.my_entitlements) = 0, 'expired grants nothing';
  assert (select is_live from public.my_subscription) = false, 'expired is not live';
  raise notice 'OK expiry';
end $$;

-- A return after a gap starts from the payment, not from the old expiry ---------------
select pg_temp.as_service();
do $$ declare v_exp timestamptz; begin
  perform public.apply_subscription_payment('sub@example.com', 'annual', 'ord-3', '2027-01-15 12:00+00');
  select expires_at into v_exp from public.subscriptions where email = 'sub@example.com';
  assert v_exp = timestamptz '2028-01-15 12:00+00', 'return starts fresh, annual = 1 year, got ' || v_exp;
  assert (select plan from public.subscriptions where email = 'sub@example.com') = 'annual', 'plan follows the payment';
  raise notice 'OK return after a gap';
end $$;

-- Admin -----------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ declare v_err text; v_exp timestamptz; begin
  assert (select count(*) from public.subscriptions) = 1, 'admin reads the table';
  -- extend a live annual by a month by hand: from its expiry
  perform public.admin_set_subscription('sub@example.com', 'monthly', 'active', null, ' comp ');
  select expires_at into v_exp from public.subscriptions where email = 'sub@example.com';
  assert v_exp = timestamptz '2028-02-15 12:00+00', 'extension chains from expiry, got ' || v_exp;
  assert (select note from public.subscriptions where email = 'sub@example.com') = 'comp';
  -- cancel keeps the paid period
  perform public.admin_set_subscription('sub@example.com', 'monthly', 'cancelled');
  assert (select status from public.subscriptions where email = 'sub@example.com') = 'cancelled';
  assert (select expires_at from public.subscriptions where email = 'sub@example.com') = v_exp, 'cancel keeps expires_at';
  -- grant to a new email with an explicit date
  perform public.admin_set_subscription('Gift@Example.com', 'annual', 'active', '2030-01-01 00:00+00', 'gift');
  assert (select expires_at from public.subscriptions where email = 'gift@example.com') = timestamptz '2030-01-01 00:00+00';
  begin
    perform public.admin_set_subscription('nobody@example.com', 'monthly', 'cancelled');
    raise exception 'should have failed';
  exception when no_data_found then null;
  end;
  begin
    perform public.admin_set_subscription('sub@example.com', 'monthly', 'pending');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_status';
  end;
  raise notice 'OK admin subscriptions';
end $$;

-- Cancelled keeps the paid period: live until expires_at, nothing after ----------------
select pg_temp.as_super();
update public.subscriptions set status = 'cancelled', expires_at = now() + interval '3 days' where email = 'sub@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-000000000010', 'sub@example.com');
do $$ begin
  assert (select is_live from public.my_subscription), 'cancelled but paid: still live';
  assert (select count(*) from public.my_entitlements) = (select count(*) from public.courses), 'courses stay until expiry';
  raise notice 'OK cancelled, inside the paid period';
end $$;
select pg_temp.as_super();
update public.subscriptions set expires_at = now() - interval '1 minute' where email = 'sub@example.com';
select pg_temp.as_user('00000000-0000-0000-0000-000000000010', 'sub@example.com');
do $$ begin
  assert (select is_live from public.my_subscription) = false, 'cancelled and over: not live';
  assert (select count(*) from public.my_entitlements) = 0, 'nothing after expiry';
  raise notice 'OK cancelled, after the paid period';
end $$;
-- A form submission never downgrades a live subscription --------------------------------
select pg_temp.as_super();
update public.subscriptions set status = 'active', plan = 'annual', expires_at = now() + interval '10 days' where email = 'sub@example.com';
select pg_temp.as_anon();
do $$ begin
  perform public.create_subscription_order('sub@example.com', 'monthly', 'ru', 'landing');
  raise notice 'OK re-order while live';
end $$;
select pg_temp.as_super();
do $$ begin
  assert (select plan from public.subscriptions where email = 'sub@example.com') = 'annual', 'live plan kept';
  assert (select status from public.subscriptions where email = 'sub@example.com') = 'active', 'live status kept';
end $$;

select pg_temp.as_super();
\echo SUBSCRIPTION TESTS PASSED
