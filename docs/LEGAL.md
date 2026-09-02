# Legal pages — templates, not legal advice

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

Contacts and the legal entity name come from `content/site/brand.ts` (`organization`,
`contactEmail`) and `content/site/links.ts` (`supportEmail`, `supportTelegram`). The
cookies/analytics section of the privacy policy switches automatically: it names Yandex Metrica /
Google Analytics only when `PUBLIC_YANDEX_METRIKA_ID` / `PUBLIC_GA_ID` are set at build time.

Update `legalUpdatedAt` whenever the wording changes.

## Decisions a lawyer should confirm

- **Legal entity and jurisdiction.** `BRAND.organization` is a placeholder brand name; the offer
  needs the real seller (individual entrepreneur / company), registration details and the governing
  law.
- **Lifetime access definition** (terms §4) and the shutdown notice period.
- **Refund rule** (14 days / fewer than 3 completed workouts) versus statutory consumer rights for
  digital content in the target countries.
- **Health disclaimer** (terms §6) wording for the target market.
- **Minimum age** and whether parental consent is enough.
- **Personal data**: legal basis (consent vs. contract), cross-border transfer to the Supabase region
  and to GitHub Pages, retention periods for accounting records, and whether a local-law notice
  (e.g. data-localisation requirements) applies.
- **Payment provider terms** if `course.paymentUrl` points at an external checkout.

## Editing the text

Sections are plain `L10n` objects (`{ ru, en }`) in `legal.ts`; keep both languages in sync and keep
the section `id`s stable (they are anchor links in the table of contents).
