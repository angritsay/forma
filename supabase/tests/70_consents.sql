-- =============================================================================
-- Consents (0018): the log, the two ways in, isolation between people, withdrawal.
-- Run after 10_smoke.sql on the same database.
--
-- What is worth asserting here is not "a row appears" — it is the four things the
-- log has to be true about for it to be evidence at all:
--   * a consent is written for the address that actually agreed, and nobody can
--     write one for somebody else's address;
--   * agreeing twice to the same text does not make two records;
--   * the site's row and the app's row for one person become one row, not two
--     unconnected halves;
--   * a withdrawal is dated rather than erased.
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
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000070', 'consent@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000071', 'other@example.com', '{}')
on conflict (id) do nothing;

-- The site: an anonymous order carries the version of the text that was on screen ----
--
-- The calls are made as anon and counted as the owner of the database, because anon
-- has no privilege on the table at all — which is itself part of the design and is
-- asserted below.
select pg_temp.as_anon();
do $$ begin
  perform public.create_order('consent@example.com', 'start', 'ru', 'landing', '2026-09-18');
  -- Ordering again is the same person agreeing to the same text.
  perform public.create_order('consent@example.com', 'start', 'ru', 'landing', '2026-09-18');
  -- An order with no version (a browser still running the previous bundle) is
  -- accepted and simply records nothing: a missing row is honest, a guessed one is not.
  perform public.create_order('other@example.com', 'start', 'ru', 'landing', null);
end $$;

select pg_temp.as_super();
do $$ declare v_n int; begin
  select count(*) into v_n from public.consents
  where email = 'consent@example.com' and doc_version = '2026-09-18';
  assert v_n = 2, 'ordering records both the policy and the offer, got ' || v_n;

  select count(*) into v_n from public.consents where email = 'consent@example.com';
  assert v_n = 2, 'a second order does not duplicate the consent, got ' || v_n;

  select count(*) into v_n from public.consents where email = 'other@example.com';
  assert v_n = 0, 'no version means no claim, got ' || v_n;
end $$;

-- Anonymous callers cannot reach the signed-in path at all --------------------------
select pg_temp.as_anon();
do $$ declare v_err text; begin
  begin
    perform public.record_consent(array['health'], '2026-09-18');
    raise exception 'should have failed';
  exception when insufficient_privilege then
    null;  -- revoked from anon: this is the expected outcome
  when others then
    get stacked diagnostics v_err = message_text;
    assert v_err in ('not_signed_in', 'permission denied for function record_consent'),
      'anon refused, got ' || v_err;
  end;
end $$;

-- The app: the health consent, and the joining of the two halves --------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000070', 'consent@example.com');
do $$ declare v_n int; v_uid uuid; begin
  perform public.record_consent(array['health'], '2026-09-18', 'ru', 'onboarding');

  select count(*) into v_n from public.my_consents();
  assert v_n = 3, 'privacy + offer from the site, health from the app, got ' || v_n;

  -- Re-recording what the site already wrote attaches the account to that row
  -- instead of opening a second one for the same address and text.
  perform public.record_consent(array['privacy', 'offer', 'health'], '2026-09-18', 'ru', 'app');
  select count(*) into v_n from public.my_consents();
  assert v_n = 3, 'the site row and the app row are one row, got ' || v_n;

  select user_id into v_uid from public.consents
  where email = 'consent@example.com' and kind = 'privacy';
  assert v_uid = '00000000-0000-0000-0000-000000000070',
    'the anonymous row is claimed by the account that signed in';

  -- A new version of the text is a new agreement, not an update of the old one.
  perform public.record_consent(array['health'], '2026-10-01', 'ru', 'app');
  select count(*) into v_n from public.consents
  where email = 'consent@example.com' and kind = 'health';
  assert v_n = 2, 'a new version is a new row, got ' || v_n;
end $$;

-- One person cannot see or touch another's ------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000071', 'other@example.com');
do $$ declare v_n int; begin
  select count(*) into v_n from public.my_consents();
  assert v_n = 0, 'my_consents is mine, got ' || v_n;

  select count(*) into v_n from public.consents;
  assert v_n = 0, 'RLS hides other people''s consents, got ' || v_n;
end $$;

-- Withdrawal is dated, not erased ----------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-000000000070', 'consent@example.com');
do $$ declare v_live int; v_rows int; v_err text; begin
  v_rows := public.revoke_consent('health');
  assert v_rows = 2, 'both health versions withdrawn at once, got ' || v_rows;

  select count(*) into v_live from public.my_consents() where kind = 'health';
  assert v_live = 0, 'a withdrawn consent is not a live one, got ' || v_live;

  select count(*) into v_rows from public.consents
  where kind = 'health' and revoked_at is not null;
  assert v_rows = 2, 'the record survives the withdrawal, got ' || v_rows;

  -- And the same person can agree again afterwards: the partial unique index only
  -- covers live grants, so the withdrawn rows do not block a fresh one.
  perform public.record_consent(array['health'], '2026-10-01', 'ru', 'app');
  select count(*) into v_live from public.my_consents() where kind = 'health';
  assert v_live = 1, 'agreeing again after a withdrawal works, got ' || v_live;

  begin
    perform public.record_consent(array['marketing'], '2026-09-18');
    raise exception 'should have failed';
  exception when others then
    get stacked diagnostics v_err = message_text;
    assert v_err = 'invalid_kind', 'unknown kinds are refused, got ' || v_err;
  end;
end $$;

select pg_temp.as_super();
\pset tuples_only off
select 'CONSENT TESTS PASSED' as result;
