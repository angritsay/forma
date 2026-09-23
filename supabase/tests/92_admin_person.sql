-- =============================================================================
-- The person page (migration 0046).
--
-- Run: psql -v ON_ERROR_STOP=1 -d <db> -f supabase/tests/92_admin_person.sql
-- on a database with 00_shim.sql and every migration applied. One transaction, rolled back.
--
-- Checked:
--   * a non-admin gets nothing, and a malformed address is refused;
--   * an address nobody signed in with still answers: grants, no profile, empty activity;
--   * a signed-in person comes back whole — profile, purchases, subscription with `live`,
--     club access, both club circles with the partner, proofs, assigned workouts with `done`,
--     activity totals, last sessions with the custom title, support rows without the ids,
--     payments under the account's own, a linked and a claimed address;
--   * the payment typed at checkout under a different address is found through payment_emails;
--   * `can_end_subscription` follows the catalogue.
-- =============================================================================
begin;

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = warning;
\o /dev/null

create or replace function pg_temp.as_user(p_id uuid, p_email text) returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'email', p_email, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create or replace function pg_temp.as_super() returns void
language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{}', true);
end $$;

select pg_temp.as_super();

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-0000000046a1', 'person-admin@example.com', now()),
  ('00000000-0000-0000-0000-0000000046a2', 'person-one@example.com',   now()),
  ('00000000-0000-0000-0000-0000000046a3', 'person-two@example.com',   now())
on conflict (id) do nothing;

insert into public.admins (email) values ('person-admin@example.com') on conflict do nothing;

update public.profiles
   set display_name = 'Настя', onboarded_at = now(), fitness_level = 2, telegram_id = 46046046
 where email = 'person-one@example.com';
update public.profiles set display_name = 'Оля' where email = 'person-two@example.com';

insert into public.subscriptions (email, plan, status, started_at, expires_at)
select e, 'monthly', 'active', now() - interval '1 day', now() + interval '30 days'
from unnest(array['person-one@example.com', 'person-two@example.com']::citext[]) e
on conflict (email) do update set status = 'active', expires_at = now() + interval '30 days';

insert into public.purchases (email, course_id, status, activated_at)
values ('person-one@example.com', 'start', 'active', now() - interval '20 days'),
       ('person-one@example.com', 'dumbbells', 'refunded', null),
       ('person-presale@example.com', 'start', 'active', now());

-- Both circles of the club, then a pair in the duo one.
select pg_temp.as_user('00000000-0000-0000-0000-0000000046a2', 'person-one@example.com');
select public.join_club();
select public.club_invite_create() as token \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000046a3', 'person-two@example.com');
select public.join_club();
select public.club_invite_redeem(:'token');

select pg_temp.as_super();

-- A task and a proof in the solo circle.
insert into public.marathon_tasks (marathon_id, day_index, title, proof_kind, rule, points)
values (public.club_marathon(false), 1, 'Планка 1 минута', 'done', 'per_member', 10);
insert into public.marathon_submissions (task_id, member_id, marathon_id, day_index, value_text)
select tk.id, m.id, tk.marathon_id, tk.day_index, 'сделала'
from public.marathon_tasks tk
join public.marathon_members m on m.marathon_id = tk.marathon_id
where tk.title = 'Планка 1 минута' and m.email = 'person-one@example.com';

-- A custom workout, given and done.
insert into public.custom_workouts (short_id, title, structure, points)
values ('p46_custom', 'Спина дома', '{"blocks":[]}'::jsonb, 50);
insert into public.assigned_workouts (custom_workout_id, email, note)
select id, 'person-one@example.com', 'после травмы' from public.custom_workouts where short_id = 'p46_custom';

insert into public.workout_sessions (user_id, course_id, node_id, workout_id, points, started_at, completed_at, local_date)
values
  ('00000000-0000-0000-0000-0000000046a2', 'start',  'n1',         'w_p46',      100, now() - interval '1 day', now() - interval '1 day', current_date - 1),
  ('00000000-0000-0000-0000-0000000046a2', 'custom', 'p46_custom', 'p46_custom',  50, now() - interval '1 hour', now() - interval '1 hour', current_date),
  ('00000000-0000-0000-0000-0000000046a2', 'start',  'n2',         'w_p46b',       0, now(),                     null,                     current_date);

-- The session guard stamps started_at with now(), which is one instant inside this transaction;
-- spread the three out with triggers off so «newest first» means something.
set local session_replication_role = replica;
update public.workout_sessions set started_at = now() - interval '1 day'
 where user_id = '00000000-0000-0000-0000-0000000046a2' and workout_id = 'w_p46';
update public.workout_sessions set started_at = now() - interval '1 hour'
 where user_id = '00000000-0000-0000-0000-0000000046a2' and workout_id = 'p46_custom';
set local session_replication_role = origin;

insert into public.support_requests (channel, user_id, accepted)
values ('app', '00000000-0000-0000-0000-0000000046a2', true);
insert into public.support_requests (channel, telegram_id, accepted)
values ('telegram', 46046046, false);

-- Payments: under the account's own address, under a linked checkout address, claimed, and
-- somebody else's that must not show.
insert into public.payment_emails (user_id, email, linked_by)
values ('00000000-0000-0000-0000-0000000046a2', 'nastia.pay@example.com', 'p46-2');
insert into public.payments (email, amount, provider_ref, intent, applied, provider, currency) values
  ('person-one@example.com', 990, 'p46-1', 'monthly', true,  'prodamus', 'RUB'),
  ('nastia.pay@example.com', 2990, 'p46-2', 'course', true, 'lava', 'USD'),
  ('stranger@example.com',   500, 'p46-4', 'course',  false, 'prodamus', 'RUB');
insert into public.payments (email, amount, provider_ref, intent, applied, claimed_by, claimed_at)
values ('typo@example.con', 1990, 'p46-3', 'course', false, '00000000-0000-0000-0000-0000000046a2', now());

-- ---------------------------------------------------------------------------
-- 1. Guards.
-- ---------------------------------------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-0000000046a3', 'person-two@example.com');
do $$
declare v_denied boolean := false;
begin
  begin
    perform public.admin_person('person-one@example.com');
  exception when insufficient_privilege then v_denied := true; end;
  assert v_denied, 'a non-admin must not read a person';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-0000000046a1', 'person-admin@example.com');
do $$
declare v_msg text;
begin
  begin
    perform public.admin_person('not-an-address');
  exception when others then v_msg := sqlerrm; end;
  assert v_msg = 'invalid_email', 'a malformed address is refused: ' || coalesce(v_msg, 'null');
end $$;

-- ---------------------------------------------------------------------------
-- 2. Nobody signed in with it: grants only.
-- ---------------------------------------------------------------------------
do $$
declare j jsonb := public.admin_person('  Person-Presale@Example.com ');
begin
  assert j->>'email' = 'person-presale@example.com', 'address normalised: ' || (j->>'email');
  assert j->'profile' = 'null'::jsonb, 'no profile';
  assert jsonb_array_length(j->'purchases') = 1, 'the pre-sale grant is there';
  assert (j->>'club_access')::boolean, 'a course activated today opens the club trial';
  assert (j->'activity'->>'sessions')::int = 0, 'no sessions';
  assert jsonb_array_length(j->'sessions') = 0 and jsonb_array_length(j->'support') = 0, 'empty lists';
  assert jsonb_array_length(j->'payments') = 0, 'no payments';
end $$;

-- ---------------------------------------------------------------------------
-- 3. The whole person.
-- ---------------------------------------------------------------------------
do $$
declare
  j jsonb := public.admin_person('person-one@example.com');
  v_duo jsonb;
  v_refs text[];
begin
  assert j->'profile'->>'display_name' = 'Настя', 'name';
  assert (j->'profile'->>'telegram_linked')::boolean, 'telegram linked';
  assert (j->'profile'->>'fitness_level')::int = 2, 'level';
  assert j->'profile'->'telegram_id' is null, 'the telegram id itself is not sent';

  assert jsonb_array_length(j->'purchases') = 2, 'both purchase rows, refunded included';
  assert (j->'subscription'->>'live')::boolean, 'subscription live';
  assert (j->>'club_access')::boolean, 'club access through the subscription';

  assert jsonb_array_length(j->'memberships') = 2, 'both circles: ' || (j->'memberships')::text;
  assert (j->'memberships'->0->>'solo')::boolean, 'solo circle first';
  v_duo := j->'memberships'->1;
  assert not (v_duo->>'solo')::boolean, 'then duo';
  assert jsonb_array_length(v_duo->'partners') = 1, 'one partner';
  assert v_duo->'partners'->0->>'display_name' = 'Оля', 'partner by profile name';

  assert jsonb_array_length(j->'proofs') = 1, 'one proof';
  assert j->'proofs'->0->>'task_title' = 'Планка 1 минута', 'proof with its task';

  assert jsonb_array_length(j->'assigned') = 1, 'one assigned workout';
  assert (j->'assigned'->0->>'done')::boolean, 'done';
  assert j->'assigned'->0->>'note' = 'после травмы', 'note';

  assert (j->'activity'->>'sessions')::int = 2, 'two completed: ' || (j->'activity')::text;
  assert (j->'activity'->>'started')::int = 3, 'three started';
  assert (j->'activity'->>'days')::int = 2, 'two days';
  assert j->'activity'->>'last_completed_at' is not null, 'last session';

  assert jsonb_array_length(j->'sessions') = 3, 'three sessions';
  assert j->'sessions'->0->'completed_at' = 'null'::jsonb, 'newest first — the unfinished one';
  assert j->'sessions'->1->>'custom_title' = 'Спина дома', 'custom session with its title';

  assert jsonb_array_length(j->'support') = 2, 'app and telegram support rows';
  assert not (j->'support'->0 ? 'user_id') and not (j->'support'->0 ? 'telegram_id'), 'no ids';
  assert j->'support'->0 ? 'channel', 'the rest of the row is there';

  assert j->'payment_emails' = '["nastia.pay@example.com"]'::jsonb, 'linked address: ' || (j->'payment_emails')::text;
  select array_agg(p->>'provider_ref' order by p->>'provider_ref') into v_refs
  from jsonb_array_elements(j->'payments') p;
  assert v_refs = array['p46-1', 'p46-2', 'p46-3'], 'own, linked and claimed payments: ' || v_refs::text;

  assert not (j->>'can_end_subscription')::boolean, 'no admin_end_subscription yet';
end $$;

-- ---------------------------------------------------------------------------
-- 4. The feature check follows the catalogue.
-- ---------------------------------------------------------------------------
select pg_temp.as_super();
create function public.admin_end_subscription(p_email text, p_note text default null)
returns void language sql as $$ select null::void $$;
select pg_temp.as_user('00000000-0000-0000-0000-0000000046a1', 'person-admin@example.com');
do $$
begin
  assert (public.admin_person('person-one@example.com')->>'can_end_subscription')::boolean,
    'admin_end_subscription(p_email) is seen';
end $$;

\o
\echo 'ADMIN PERSON 0046 TESTS PASSED'
rollback;
