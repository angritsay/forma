# Forma as a platform for creators

How Forma becomes a place where fitness creators sell their own courses and clubs, and how it is
built in phases. The terms creators see are in `docs/CREATORS.md` and `content/site/creatorTerms.ts`.
This document covers the product and the engineering behind them.

## The decision

The owner decided on 8 Oct 2026, choosing between "one Forma app", "white-label per creator" and
"both, in two tiers":

- **Both, in two tiers.** Creators **start inside the Forma app**: their page, courses and club
  live in Forma, they sign up and build without waiting for anybody, and Forma takes the payment.
  **Pro** moves them under their own brand: their own domain, bot and app, and payments into their
  own Prodamus / lava.top. Pro is what Forma has offered by hand so far.
- **Pricing.** Start has no monthly fee; Forma keeps 20% of course and club sales and 10% of
  sessions. Pro costs 4 990 ₽ / $59 a month; Forma keeps 10% and 5%. Pro pays for itself above
  49 900 ₽ of sales a month.

Why this shape:

- **Distribution.** Every creator brings an audience that already trusts them, so a paying
  member costs Forma close to nothing to acquire. That is the part of the business ads cannot
  buy.
- **Self-serve Start is what makes it scale.** "Message Nastia → call → we build" grows only
  with the owner's hours. That is an agency.
- **Inside one app there is a network.** A member of one creator can find another
  (the «also on Forma» catalogue). Full white-label hides Forma from them, so a white-label-only
  business has no network effect.
- **Pro is software revenue.** A monthly fee is predictable income, and investors read it as
  such.

## What exists after phase 1 (`0064_creators.sql`)

- **`creators`**: one row per creator, holding a public slug, name, owner address, plan
  (`start` / `pro`), status (`applied` → `active` / `declined`, `paused`), their audience link and
  follower count, and the processor fee that shares are counted after. Forma itself is the
  `house` row and is never billed.
- **Applying is self-serve.** «Для авторов» in the account sheet opens «Кабинет автора»
  (`/creator`), where a signed-in person applies (`creator_apply`) or edits a pending application.
  The owner's whole part is one tap in «Авторы» (`/admin/creators`): open or decline.
- **Whose course is whose.** `admin_courses.creator_id` holds the owner of a course. «Авторы»
  gives a course to a creator and takes it back. Null means Forma's own course.
- **Statements are computed from the payments themselves.** `creator_statement` counts course
  sales of the creator's courses per Moscow month and currency, through the payment ↔ purchase
  link (`provider_ref`, 0019). It applies the money rules of 0063: payer after binding, dismissed
  payments out, currencies never added together. From those sales it derives:
  - Forma's share and the creator's;
  - Pro's monthly fee;
  - the balance, positive when the creator owes Forma (Pro: the money landed in their account)
    and negative when Forma owes the creator (Start: the money came through Forma's till).
- **Invoices are produced automatically.** `close_creator_month` freezes a finished month into
  numbered rows (`F-202609-alla-yoga-RUB`), once per creator, month and currency. It runs on the
  1st via `.github/workflows/creator-invoices.yml`; the owner can also run it from «Авторы». The
  owner marks an invoice settled once the money has moved.
- **The creator sees their money.** «Кабинет автора» shows:
  - the plan and the page address;
  - courses and buyers;
  - this month's sales and «твоё»;
  - who owes whom;
  - the months and the closed invoices.

Nobody can dispute these figures by hand any more: they come from the same ledger the webhooks
write.

## Phase 2: creators build and sell on their own

Order matters, because each step needs the one before it.

1. **Creator-scoped builder.** Today the builder RPCs check `is_admin()`. They should also admit
   the creator, limited to `admin_courses.creator_id = my creator` (and the days, workouts and
   exercises under those courses). Publishing a creator's course stays a review step for the
   owner, one tap, because health content goes out under the platform's name.
2. **Public creator pages.** _Done in `0066_creator_pages.sql`._ `forma-app.co/c/<slug>/` shows
   the creator's name, their line about themselves, a link to their audience and their published
   courses, each with the free first workout and a buy button. Pages are built at build time from
   the anon-callable `public_creators()` (five safe fields), only for open creators other than
   Forma with at least one published course, and only those enter the sitemap. «Кабинет автора»
   links the address once the page exists.
3. **A club per creator.** The club is one shared club today (0016). Each creator should get a
   club of their own, priced by them, so that club money can be credited to them. Until then
   statements count course sales only, and both screens say so.
4. **Sessions per creator.** Link `coaches` (0055) to `creators`, so that a creator's 1:1 hours
   count to them at their sessions share.
5. **Payouts on Start.** The money arrives in Forma's till, so Forma must pay creators their share.
   That takes an **agency agreement**, so that only Forma's share is Forma's income; without one,
   tax falls on the full amount. An accountant has to confirm this before Start opens, and it is
   the reason `creatorTerms.ts` keeps `start.open = false`. Prodamus split payments, if the
   account supports them, would make the payout automatic at checkout.
6. **The «also on Forma» catalogue.** _Done in `0066_creator_pages.sql`._ «Также в Forma» on
   «Курсы» lists other open creators' published courses under the member's own, grouped by
   creator (`catalogue_creators()`). A Pro creator can switch their listing off
   (`creators.listed`, in «Кабинет автора» or by the owner in «Авторы»), since the point of Pro
   is their own brand; their page stays. Start creators are always listed.
7. **Tier history.** Record the date of each plan change, so that a month that straddles a change
   is billed half and half. Today a statement uses the current plan, and an invoice keeps the plan
   it was closed under.

## Metrics this gives an investor

These come from data that exists after phases 0063 and 0064:

- **GMV**: all course sales of all creators per month (`creator_statement`, summed).
- **Net revenue and effective take rate**: Forma's share plus Pro fees, divided by GMV.
- **Creators**: count open, count new per month, and count paused or declined.
- **Members**: buyers per creator (`my_creator().buyers`) and paying club members
  (`admin_members_months`).
- **Channels**: money per first-touch channel (`admin_sources`). For creators, a channel label per
  creator link (`?src=c-<slug>`) gives each creator's own conversion.

The calculator artifact models the same quantities ahead of the data: creators per month,
followers, conversion, take rate and Pro fee.
