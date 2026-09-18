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
  payments and on the notice a seller must give before each charge.
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
