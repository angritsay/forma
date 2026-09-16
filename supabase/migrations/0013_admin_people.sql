-- =============================================================================
-- admin_people — everybody who has signed in, for the admin to pick from.
--
-- «В админку показывай всех пользователей которые прошли активацию чтобы я могла
-- не писать а пролистать все почты и выбрать кому накинуть курс или подписку.»
--
-- Granting a course or a subscription meant typing an address from memory into a
-- field that only tells you it was wrong after you submit it. One letter out and
-- the grant lands on an account that does not exist, silently: `admin_add_purchase`
-- takes any well-formed address, because a pre-sale grant to somebody who has not
-- signed up yet is a real thing the coach does. So the check cannot live there —
-- it has to be a list you choose from instead of a box you type into.
--
-- "Прошла активацию" means: there is a row in `public.profiles`. A profile is
-- created by the trigger on `auth.users` once the one-time code has been confirmed,
-- so a profile is exactly the set of people who got in. It is read here rather than
-- `auth.users` because the app's own table is the one that carries the display name
-- and the onboarding state, and because reaching into `auth` from a function the
-- client can call is a habit worth not having.
--
-- What it returns, per person: the address, what they call themselves, when they
-- first signed in, whether they finished onboarding, how many courses they already
-- hold, and whether a subscription is live. Those last two are what make the list
-- usable — the point is to pick somebody who does *not* already have the thing you
-- were about to give them.
-- =============================================================================

create or replace function public.admin_people(
  p_search text default null,
  p_limit  int  default 500
)
returns table (
  email        citext,
  display_name text,
  created_at   timestamptz,
  onboarded_at timestamptz,
  courses      int,
  subscribed   boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_term text;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  -- A substring match on the address or the name, or everybody when it is empty.
  -- `%` and `_` are escaped so a pasted address cannot turn into a wildcard scan.
  v_term := nullif(trim(coalesce(p_search, '')), '');
  if v_term is not null then
    v_term := '%' || replace(replace(v_term, '\', '\\'), '%', '\%') || '%';
    v_term := replace(v_term, '_', '\_');
  end if;

  return query
  select
    p.email,
    p.display_name,
    p.created_at,
    p.onboarded_at,
    /*
     * Active grants only. A refunded purchase is history and a person holding one is
     * a person with nothing — showing it as a course they have would be the list
     * telling the coach not to give them the thing they are owed.
     */
    (
      select count(*)::int
      from public.purchases pu
      where pu.email = p.email and pu.status = 'active'
    ) as courses,
    /*
     * `subscription_live()` rather than a status check written again here. A cancelled
     * subscription still has access until it expires (0005_subscriptions.sql), and a
     * second copy of that rule is a second place for it to drift.
     */
    exists (
      select 1
      from public.subscriptions s
      where s.email = p.email
        and public.subscription_live(s.status, s.expires_at)
    ) as subscribed
  from public.profiles p
  where v_term is null
     or p.email::text ilike v_term escape '\'
     or coalesce(p.display_name, '') ilike v_term escape '\'
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 500), 1000));
end;
$$;

comment on function public.admin_people(text, int) is
  'Admin-only: everybody with a profile (i.e. who confirmed a sign-in code), with what they already hold.';

revoke execute on function public.admin_people(text, int) from public, anon;
grant execute on function public.admin_people(text, int) to authenticated;
