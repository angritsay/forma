# Legal pages — templates, not legal advice

> **See also `docs/COMPLIANCE.md`** — the September 2026 audit against Russian law, what it changed
> and what is still outstanding. This file describes where the text lives; that one says what the
> text has to say and why.

`/privacy/`, `/terms/` and `/refund/` (RU + EN) are generated from
`src/components/landing/legal.ts`. They are **templates written by engineers** so the site is not
launched with empty pages. Before the first sale, have a lawyer review them for the jurisdiction the
business operates in (consumer-protection law, personal-data law, tax rules for digital goods).

## Where the numbers come from

Everything a lawyer may want to change lives in `content/site/pricing.ts`:

| Field                        | Used in                                     | Default  |
| ---------------------------- | ------------------------------------------- | -------- |
| `refundDays`                 | refund policy, terms §9, FAQ                | 14       |
| `refundMaxCompletedWorkouts` | refund policy, terms §9, FAQ                | 3        |
| `legalUpdatedAt`             | "Last updated" on all three pages           | ISO date |
| `dataRegion`                 | privacy §4 (Supabase region: `eu` or `us`)  | `eu`     |
| `minimumAge`                 | privacy §1                                  | 18       |
| `shutdownNoticeDays`         | terms §4 (notice before the service closes) | 30       |

The seller — the registered name, ИНН, ОГРНИП and address — lives in
`content/site/legalEntity.ts` and is empty until it is filled in. While it is empty the pages read
exactly as they did before; once filled, a requisites section appears at the end of all three
documents and the footer names the seller instead of the brand. `npm run legal:check` prints what is
still missing without failing the build.

Other contacts come from `content/site/brand.ts` (`organization`, `contactEmail`) and
`content/site/links.ts` (`supportEmail`, `supportTelegram`). The
cookies/analytics section of the privacy policy switches automatically: it names Yandex Metrica /
Google Analytics only when `PUBLIC_YANDEX_METRIKA_ID` / `PUBLIC_GA_ID` are set at build time.

**Update `legalUpdatedAt` whenever the wording changes.** Since migration 0018 it is not only the
"last updated" line: it is the version stamped into every row of the consent log. A log naming a
version nobody can read any more proves nothing, and somebody who agreed to the old text has not
agreed to the new one.

## Decisions a lawyer should confirm

- **Legal entity and jurisdiction.** `BRAND.organization` is a placeholder brand name; the offer
  needs the real seller (individual entrepreneur / company), registration details and the governing
  law.
- **Lifetime access definition** (terms §4) and the shutdown notice period.
- **Subscription** (terms §1, §4, §5; refund policy §1a): automatic renewal at the sign-up price,
  14 days' notice before a price change, cancellation keeps the paid period, only the first payment
  is refundable under the course rule, renewals are not. Check against consumer law on recurring
  payments and on the notice a seller must give before each charge. The clauses are written — see
  the next section.

## Automatic monthly renewal — draft for the lawyer, not shown until `RENEWAL = 'auto'`

Today every subscription period is a one-off payment and the published texts say so («Подписка не
списывается автоматически», «автосписания нет»). Automatic renewal of the **30-day plan only** is
prepared behind one switch, `RENEWAL` in `content/site/plans.ts` (procedure: `docs/SETUP.md`
§7.18). The year stays a one-off payment in both modes. Until the switch is flipped none of the
text below is published; when it is, `PRICING.legalUpdatedAt` is bumped in the same commit (a test
refuses the flip otherwise), so consents name the version that contains these clauses.

What replaces what, all in `src/components/landing/legal.ts` (the block above `termsDocument`,
marked «DRAFT FOR THE LAWYER»):

- **Terms §4** (`AUTO_TERM_OF_ACCESS`): the 30-day Subscription renews for the next 30 days until
  the User cancels; the annual one does not.
- **Terms §5** (`AUTO_PRICE_CLAUSES`), replacing «не списывается автоматически»: consent to a
  charge every 30 days to the same card at the sign-up price; card details held by Prodamus, not
  by us; a reminder at least 3 days before each charge; cancellation at any time through the link
  in the payment receipt email or by writing to the support address, the paid period kept; a new
  price notified by email at least `PRICING.priceChangeNoticeDays` (14) days before the first
  charge at it; a failed charge ends the Subscription at the end of the paid period.
- **Terms §9**: adds «automatic renewals of a 30-day Subscription are not refunded: only its first
  payment is».
- **Refund policy §1a** (`AUTO_REFUND_SUBSCRIPTION`): the year's payment and the first 30-day
  payment are refundable on the course rule; automatic renewals are not; cancel ahead to avoid the
  next charge.

The same promises in short form, for the lawyer to read with the clauses: the monthly plan's note
(`plansFor` in `plans.ts`), the `…Auto` keys in `src/i18n/{ru,en}/landing.ts` and `app.ts`, the
home FAQ (`autoRenewalFaq` in `content/site/faq.ts`) and the bot's reminder
(`subscriptionRenewing*` in `supabase/functions/telegram-notify/copy.ts`).

Questions for the lawyer:

- **The reminder reaches only people who connected the Telegram bot.** Is a reminder before each
  charge required by law, and if so, is a bot message enough or must it be email for everyone? (No
  email reminder exists today.)
- **The reminder states no amount** — «столько же, сколько в прошлый раз» — because the queue does
  not know whether the person paid in roubles or dollars. Is that sufficient?
- **«Only the first payment is refundable»** against ЗоЗПП art. 32 (withdrawal at any time, paying
  the costs actually incurred), which refund policy §6 keeps. A renewal charged yesterday and
  unused is probably refundable pro rata by statute whatever our rule says.
- **Cancellation by writing to support** — we then cancel by hand in Prodamus; is a written
  request enough, and how fast must it take effect before a charge?
- **The 14-day price-change notice** is new: the manual texts never promised it (they quote the
  price at the time of each payment).
- **Refund rule** (14 days / fewer than 3 completed workouts) versus statutory consumer rights for
  digital content in the target countries.
- **Health disclaimer** (terms §6) wording for the target market.
- **Minimum age** and whether parental consent is enough.
- **Personal data**: the policy now states the legal bases, names health data as a special category
  under 152-ФЗ ст. 10, discloses the cross-border transfer (ст. 12) and gives a destruction period.
  What a lawyer should still confirm: whether the 30-day destruction promise fits the accounting
  records that must be kept, and the data-localisation question (152-ФЗ ст. 18 ч. 5), which is
  unresolved and is discussed in `docs/COMPLIANCE.md` §3.1.
- **Payment provider terms** if `course.paymentUrl` points at an external checkout.

## Editing the text

Sections are plain `L10n` objects (`{ ru, en }`) in `legal.ts`; keep both languages in sync and keep
the section `id`s stable (they are anchor links in the table of contents).
