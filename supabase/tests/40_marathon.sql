-- =============================================================================
-- Marathons (0011): the four scoring rules, deadlines, voiding, adjustments, and the row-level
-- security that keeps tomorrow's task and everyone's email out of the app.
--
-- Run after 10_smoke.sql on the same database — it reuses that file's admin (coach@example.com).
-- Creates its own five athletes, so it depends on nothing else.
--
-- The fixture is one marathon that started eight days ago, so "today" is day 9 (week 2) and week 1
-- is entirely in the past: the deadline arithmetic is then the thing under test rather than a race
-- against the clock.
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
create or replace function pg_temp.as_super() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
end $$;

/*
 * The marathon's id and the ids of its people, so every block below can find them by name.
 *
 * Security definer on purpose: an athlete has no select on marathon_members and no select on a
 * task past today — which is exactly what the second half of this file checks — so a plain lookup
 * would come back empty and the assertions would test the fixture instead of the schema.
 */
create or replace function pg_temp.m() returns uuid language sql stable security definer as $$
  select id from public.marathons where slug = 'sprint';
$$;
create or replace function pg_temp.member(p_email text) returns uuid language sql stable security definer as $$
  select mem.id from public.marathon_members mem
  where mem.marathon_id = pg_temp.m() and mem.email = p_email::citext;
$$;
create or replace function pg_temp.task(p_title text) returns uuid language sql stable security definer as $$
  select t.id from public.marathon_tasks t
  where t.marathon_id = pg_temp.m() and t.title = p_title;
$$;
-- An hour before the task's deadline: the normal case, proof that arrives in time.
create or replace function pg_temp.in_time(p_day int) returns timestamptz language sql stable security definer as $$
  select (((m.starts_on + (p_day - 1))::timestamp + m.due_time) at time zone m.timezone)
         - interval '1 hour'
  from public.marathons m where m.id = pg_temp.m();
$$;
create or replace function pg_temp.points(p_title text, p_week int default 1)
returns bigint language sql stable as $$
  select s.points from public.marathon_scores(pg_temp.m(), p_week) s where s.title = p_title;
$$;

-- The people ------------------------------------------------------------------
select pg_temp.as_super();
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000041', 'vanya@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000042', 'vitya@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000043', 'olya@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000044', 'katya@example.com', '{}'),
  ('00000000-0000-0000-0000-000000000045', 'zhenya@example.com', '{}')
on conflict (id) do nothing;

-- Building the marathon is admin work ------------------------------------------
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');

do $$ declare v_m uuid; v_a uuid; v_b uuid; begin
  insert into public.marathons (slug, title, status, starts_on, days, team_size, timezone, due_time, prize)
  values ('sprint', 'Марафон', 'active', (now() at time zone 'UTC')::date - 8, 28, 2, 'UTC', '22:00',
          'Час с Сергеем')
  returning id into v_m;

  -- A timezone Postgres cannot resolve would silently break every deadline in the run.
  begin
    update public.marathons set timezone = 'Mars/Olympus' where id = v_m;
    raise exception 'should have failed';
  exception when sqlstate 'P0001' then null;
  end;

  insert into public.marathon_teams (marathon_id, name, sort_order)
  values (v_m, 'Ваня и Витя', 1) returning id into v_a;
  insert into public.marathon_teams (marathon_id, name, sort_order)
  values (v_m, 'Оля и Катя', 2) returning id into v_b;

  insert into public.marathon_members (marathon_id, email, team_id, display_name) values
    (v_m, 'vanya@example.com', v_a, 'Ваня'),
    (v_m, 'vitya@example.com', v_a, 'Витя'),
    (v_m, 'olya@example.com', v_b, 'Оля'),
    (v_m, 'katya@example.com', v_b, 'Катя'),
    (v_m, 'zhenya@example.com', null, 'Женя');

  assert public.marathon_day_index(v_m) = 9, 'day 9';
  assert public.marathon_week_of(7) = 1 and public.marathon_week_of(8) = 2, 'weeks run 1..7, 8..14';
  raise notice 'OK marathon, teams, members';
end $$;

-- A team from another marathon can never be handed to a member.
do $$ declare v_other uuid; v_team uuid; begin
  insert into public.marathons (slug, title, starts_on) values ('other', 'Другой', current_date)
  returning id into v_other;
  insert into public.marathon_teams (marathon_id, name) values (v_other, 'Чужие') returning id into v_team;
  begin
    update public.marathon_members set team_id = v_team where id = pg_temp.member('vanya@example.com');
    raise exception 'should have failed';
  exception when sqlstate 'P0001' then null;
  end;
  raise notice 'OK a team belongs to one marathon';
end $$;

-- The day plan -----------------------------------------------------------------
do $$ declare v_m uuid := pg_temp.m(); begin
  -- all_members: the pair scores only if both deliver. This is the rule the format is built on.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, proof_kind)
  values (v_m, 1, 'Зарядка', 'all_members', 10, 'done');
  -- per_member: everyone who delivers earns.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, proof_kind, unit)
  values (v_m, 2, 'Шаги', 'per_member', 5, 'number', 'шагов');
  -- capped: per_member with a ceiling on the entry's total.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, cap, proof_kind)
  values (v_m, 3, 'Вторая палуба', 'capped', 5, 7, 'done');
  -- none: the morning message. Never scores, whoever ticks it.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 4, 'Доброе утро', 'none', 0);
  -- Addressed to one person: nobody else sees it and nobody else scores it.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 5, 'Одиночная', 'per_member', 3);
  insert into public.marathon_task_targets (task_id, member_id)
  values (pg_temp.task('Одиночная'), pg_temp.member('zhenya@example.com'));

  -- Addressed to one pair: the other pair and the solo player never see it.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 6, 'Только для пары', 'all_members', 9);
  insert into public.marathon_task_targets (task_id, team_id)
  values (pg_temp.task('Только для пары'), (select id from public.marathon_teams
          where marathon_id = v_m and name = 'Оля и Катя'));
  -- late proof is recorded but does not score.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 6, 'Планка', 'per_member', 4);
  -- next week, and today, and tomorrow.
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 8, 'Неделя два', 'all_members', 20);
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, proof_kind, proof_visibility)
  values (v_m, 9, 'Сегодня', 'per_member', 1, 'text', 'team');
  insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
  values (v_m, 10, 'Завтра', 'per_member', 1);

  -- A number with no unit says nothing; a cap outside the capped rule is a lie.
  begin
    insert into public.marathon_tasks (marathon_id, day_index, title, proof_kind)
    values (v_m, 1, 'Без единиц', 'number');
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.marathon_tasks (marathon_id, day_index, title, rule, points, cap)
    values (v_m, 1, 'Лишний потолок', 'per_member', 5, 9);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;
  begin
    insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
    values (v_m, 1, 'Без потолка', 'capped', 5);
    raise exception 'should have failed';
  exception when check_violation then null;
  end;

  raise notice 'OK day plan';
end $$;

-- The proof of week 1, entered by the coach with the times it actually arrived ----
do $$ begin
  -- Зарядка (all_members, 10): the pair delivers, Оля is alone, Женя plays solo.
  insert into public.marathon_submissions (task_id, member_id, submitted_at) values
    (pg_temp.task('Зарядка'), pg_temp.member('vanya@example.com'), pg_temp.in_time(1)),
    (pg_temp.task('Зарядка'), pg_temp.member('vitya@example.com'), pg_temp.in_time(1)),
    (pg_temp.task('Зарядка'), pg_temp.member('olya@example.com'), pg_temp.in_time(1)),
    (pg_temp.task('Зарядка'), pg_temp.member('zhenya@example.com'), pg_temp.in_time(1));

  -- Шаги (per_member, 5): Ваня alone; Оля and Катя both.
  insert into public.marathon_submissions (task_id, member_id, value_num, submitted_at) values
    (pg_temp.task('Шаги'), pg_temp.member('vanya@example.com'), 9000, pg_temp.in_time(2)),
    (pg_temp.task('Шаги'), pg_temp.member('olya@example.com'), 8000, pg_temp.in_time(2)),
    (pg_temp.task('Шаги'), pg_temp.member('katya@example.com'), 12000, pg_temp.in_time(2));

  -- Вторая палуба (capped 5/7): both of the pair, so 10 clipped to 7.
  insert into public.marathon_submissions (task_id, member_id, submitted_at) values
    (pg_temp.task('Вторая палуба'), pg_temp.member('vanya@example.com'), pg_temp.in_time(3)),
    (pg_temp.task('Вторая палуба'), pg_temp.member('vitya@example.com'), pg_temp.in_time(3));

  -- Доброе утро (none): ticked by everyone, worth nothing.
  insert into public.marathon_submissions (task_id, member_id, submitted_at) values
    (pg_temp.task('Доброе утро'), pg_temp.member('vanya@example.com'), pg_temp.in_time(4)),
    (pg_temp.task('Доброе утро'), pg_temp.member('olya@example.com'), pg_temp.in_time(4));

  -- Одиночная: sent to Женя alone, so only Женя's proof counts. Ваня's is recorded (the coach can
  -- enter anything) and scores nothing, because he was never a recipient.
  insert into public.marathon_submissions (task_id, member_id, submitted_at) values
    (pg_temp.task('Одиночная'), pg_temp.member('zhenya@example.com'), pg_temp.in_time(5)),
    (pg_temp.task('Одиночная'), pg_temp.member('vanya@example.com'), pg_temp.in_time(5));

  -- Только для пары: sent to Оля и Катя, and both deliver.
  insert into public.marathon_submissions (task_id, member_id, submitted_at) values
    (pg_temp.task('Только для пары'), pg_temp.member('olya@example.com'), pg_temp.in_time(6)),
    (pg_temp.task('Только для пары'), pg_temp.member('katya@example.com'), pg_temp.in_time(6));

  -- Планка: an hour after the deadline.
  insert into public.marathon_submissions (task_id, member_id, submitted_at)
  values (pg_temp.task('Планка'), pg_temp.member('vanya@example.com'),
          pg_temp.in_time(6) + interval '2 hours');
end $$;

do $$ begin
  assert pg_temp.points('Ваня и Витя') = 22,
    'pair: 10 both + 5 one of two + 7 capped, nothing for the solo task or the late one, got '
    || pg_temp.points('Ваня и Витя');
  assert pg_temp.points('Оля и Катя') = 19,
    'pair: 0 (only one did Зарядка) + 10 + 9 (the task sent only to them), got '
    || pg_temp.points('Оля и Катя');
  assert pg_temp.points('Женя') = 13,
    'solo: 10 (a team of one is satisfied by one) + 3, got ' || pg_temp.points('Женя');
  assert (select rank from public.marathon_scores(pg_temp.m(), 1) where title = 'Ваня и Витя') = 1;
  assert (select rank from public.marathon_scores(pg_temp.m(), 1) where title = 'Оля и Катя') = 2;
  assert (select rank from public.marathon_scores(pg_temp.m(), 1) where title = 'Женя') = 3;
  assert (select count(*) from public.marathon_scores(pg_temp.m(), 1)) = 3, 'one row per entry';
  assert (select members from public.marathon_scores(pg_temp.m(), 1) where title = 'Ваня и Витя')
         = array['Ваня', 'Витя'];
  raise notice 'OK the four rules, the deadline and who a task was sent to';
end $$;

-- The week is the race: week 2 has its own board, and the default week is the current one.
do $$ begin
  assert (select sum(points) from public.marathon_scores(pg_temp.m(), 2)) = 0, 'week 2 is untouched';
  assert (select sum(points) from public.marathon_scores(pg_temp.m())) = 0, 'default is this week';
  raise notice 'OK weekly reset';
end $$;

-- Voiding and manual points -----------------------------------------------------
do $$ begin
  update public.marathon_submissions set voided_at = now(), void_reason = 'фото не то'
  where task_id = pg_temp.task('Вторая палуба') and member_id = pg_temp.member('vanya@example.com');
  assert pg_temp.points('Ваня и Витя') = 20, 'capped falls to one member: 10 + 5 + 5, got '
    || pg_temp.points('Ваня и Витя');
  assert (select voided_by from public.marathon_submissions
          where task_id = pg_temp.task('Вторая палуба')
            and member_id = pg_temp.member('vanya@example.com'))
         = '00000000-0000-0000-0000-00000000000c', 'the void is stamped with who did it';

  insert into public.marathon_adjustments (marathon_id, member_id, day_index, points, reason, created_by)
  values (pg_temp.m(), pg_temp.member('katya@example.com'), 3, 5, 'вытащила напарницу',
          '00000000-0000-0000-0000-00000000000c');
  assert pg_temp.points('Оля и Катя') = 24, 'the adjustment lands on the team, got '
    || pg_temp.points('Оля и Катя');
  -- An adjustment in week 1 does not move week 2.
  assert (select sum(points) from public.marathon_scores(pg_temp.m(), 2)) = 0;
  raise notice 'OK void and manual points';
end $$;

-- =============================================================================
-- What an athlete can and cannot do
-- =============================================================================
select pg_temp.as_user('00000000-0000-0000-0000-000000000041', 'vanya@example.com');

do $$ begin
  assert (select count(*) from public.marathons) = 1, 'only my own marathon, and not the draft';
  assert (select count(*) from public.marathon_members) = 0, 'members are never read directly';
  assert (select count(*) from public.marathon_teams) = 2, 'the teams of my marathon';
  raise notice 'OK what is visible';
end $$;

do $$ begin
  -- Tomorrow's task does not exist as far as the app is concerned.
  assert (select count(*) from public.marathon_tasks where title = 'Завтра') = 0, 'no reading ahead';
  assert (select count(*) from public.marathon_tasks where title = 'Сегодня') = 1, 'today is open';
  -- Nine tasks exist on days 1..9; two of them were addressed to other people, so seven are his.
  assert (select count(*) from public.marathon_tasks) = 7,
    'days 1..9, minus the two addressed to other people, got '
    || (select count(*) from public.marathon_tasks);
  assert (select count(*) from public.marathon_tasks where title = 'Одиночная') = 0,
    'a task sent to one person is not on anyone else''s screen';
  assert (select count(*) from public.marathon_tasks where title = 'Только для пары') = 0,
    'nor is a task sent to the other pair';
  raise notice 'OK the plan opens one day at a time';
end $$;

do $$ declare v_id uuid; v_err text; begin
  -- Proof for today, sent by its owner.
  insert into public.marathon_submissions (task_id, member_id, value_text)
  values (pg_temp.task('Сегодня'), pg_temp.member('vanya@example.com'), 'сделал')
  returning id into v_id;
  assert (select day_index from public.marathon_submissions where id = v_id) = 9,
    'the day comes from the task, not the client';
  assert (select marathon_id from public.marathon_submissions where id = v_id) = pg_temp.m();

  -- Backdating is the one thing that would break the deadline, so the clock is the server's.
  update public.marathon_submissions set submitted_at = now() - interval '3 days' where id = v_id;
  assert (select submitted_at from public.marathon_submissions where id = v_id) > now() - interval '1 minute',
    'an athlete cannot move when the proof arrived';

  -- Nor can they lift a void.
  update public.marathon_submissions set voided_at = null, void_reason = null
  where task_id = pg_temp.task('Вторая палуба') and member_id = pg_temp.member('vanya@example.com');
  assert (select voided_at from public.marathon_submissions
          where task_id = pg_temp.task('Вторая палуба')
            and member_id = pg_temp.member('vanya@example.com')) is not null,
    'a void is the coach''s to lift';

  -- Nor send proof in someone else's name.
  begin
    insert into public.marathon_submissions (task_id, member_id)
    values (pg_temp.task('Сегодня'), pg_temp.member('vitya@example.com'));
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;

  -- Nor write the day plan.
  begin
    insert into public.marathon_tasks (marathon_id, day_index, title, rule, points)
    values (pg_temp.m(), 9, 'Своё задание', 'per_member', 100);
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;

  -- Nor award themselves points.
  begin
    insert into public.marathon_adjustments (marathon_id, member_id, day_index, points, reason)
    values (pg_temp.m(), pg_temp.member('vanya@example.com'), 9, 50, 'я молодец');
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK an athlete writes only their own proof';
end $$;

-- The roster is names only, and it says which one is me.
do $$ begin
  assert (select count(*) from public.marathon_roster(pg_temp.m())) = 5;
  assert (select display_name from public.marathon_roster(pg_temp.m()) where is_me) = 'Ваня';
  assert (select team_name from public.marathon_roster(pg_temp.m()) where is_me) = 'Ваня и Витя';
  assert (select count(*) from public.my_marathons()) = 1;
  assert (select day_index from public.my_marathons()) = 9;
  assert (select week from public.my_marathons()) = 2;
  assert (select total_weeks from public.my_marathons()) = 4;
  assert (select prize from public.my_marathons()) = 'Час с Сергеем';
  raise notice 'OK roster and my_marathons';
end $$;

-- My own days, with what I did and what my team took.
do $$ begin
  assert (select tasks_done from public.marathon_my_points(pg_temp.m()) where day_index = 1) = 1;
  assert (select points from public.marathon_my_points(pg_temp.m()) where day_index = 1) = 10;
  -- Day 3's capped task lost my voided proof, so the team keeps only Витя's five.
  assert (select points from public.marathon_my_points(pg_temp.m()) where day_index = 3) = 5;
  assert (select tasks_done from public.marathon_my_points(pg_temp.m()) where day_index = 3) = 0,
    'a voided proof is not something I did';
  -- The task sent to Женя alone was never mine: it is not even counted in the day's total.
  assert (select tasks_total from public.marathon_my_points(pg_temp.m()) where day_index = 5) = 0;
  -- Nor is the morning message: ticking «Доброе утро» is not a task, and not ticking it is not a
  -- day missed.
  assert (select tasks_total from public.marathon_my_points(pg_temp.m()) where day_index = 4) = 0;
  assert (select count(*) from public.marathon_my_points(pg_temp.m())) = 9, 'day 1 through today';
  raise notice 'OK my points, day by day';
end $$;

-- A teammate's state is what makes the pair a pair; a rival's is not.
select pg_temp.as_user('00000000-0000-0000-0000-000000000042', 'vitya@example.com');
do $$ begin
  assert (select count(*) from public.marathon_submissions
          where task_id = pg_temp.task('Сегодня')) = 1, 'I can see that Ваня delivered';
end $$;

select pg_temp.as_user('00000000-0000-0000-0000-000000000044', 'katya@example.com');
do $$ begin
  assert (select count(*) from public.marathon_submissions
          where task_id = pg_temp.task('Сегодня')) = 0, 'the other team''s proof is not mine to see';
  raise notice 'OK teammate visibility';
end $$;

-- Someone who is not in the marathon at all.
select pg_temp.as_user('00000000-0000-0000-0000-000000000030', 'yogi@example.com');
do $$ declare v_err text; begin
  assert (select count(*) from public.marathons) = 0;
  assert (select count(*) from public.marathon_tasks) = 0;
  assert (select count(*) from public.my_marathons()) = 0;
  begin
    perform public.marathon_scores(pg_temp.m(), 1);
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.marathon_roster(pg_temp.m());
    raise exception 'should have failed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK an outsider sees nothing';
end $$;

-- Removing someone takes them off the board without deleting what they sent.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'coach@example.com');
do $$ begin
  update public.marathon_members set status = 'removed' where id = pg_temp.member('zhenya@example.com');
  assert (select count(*) from public.marathon_scores(pg_temp.m(), 1)) = 2, 'two entries left';
  assert (select count(*) from public.marathon_submissions
          where member_id = pg_temp.member('zhenya@example.com')) = 2, 'their proof is still on file';
  update public.marathon_members set status = 'active' where id = pg_temp.member('zhenya@example.com');
  assert pg_temp.points('Женя') = 13, 'and comes back intact';
  raise notice 'OK removing a member';
end $$;

-- A finished marathon is readable and closed.
do $$ begin
  update public.marathons set status = 'finished' where id = pg_temp.m();
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-000000000041', 'vanya@example.com');
do $$ begin
  assert (select count(*) from public.marathons) = 1, 'the board stays readable';
  begin
    insert into public.marathon_submissions (task_id, member_id)
    values (pg_temp.task('Доброе утро'), pg_temp.member('vanya@example.com'));
    raise exception 'should have failed';
  exception when insufficient_privilege then null; when unique_violation then null;
  end;
  raise notice 'OK a finished marathon takes no more proof';
end $$;

select pg_temp.as_super();
\echo MARATHON TESTS PASSED
