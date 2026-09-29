# Forma — home CrossFit that adapts to you

Forma is the web product of a CrossFit coach, Sergey, and its owner and co-founder, Anastasia. It
is live at **<https://forma-app.co>**, in Russian and English, and sells three things:

- **One course** — «Форма с нуля» / _Forma. Start_: home CrossFit from zero, with a chair and a mat
  and no other equipment. The first workout is free; the rest open with the purchase, with no time
  limit. Four more courses are in the repository with `published: false` and are not sold.
- **The club** — paid access for 30 days or a year: a task a day, points, a weekly board and a
  winner, solo and in pairs (duo). Members get the bot's morning, evening and Sunday messages, and
  «+30 дней тебе и другу» for bringing a friend through the site's `/together/` page.
- **A session with the coach** — 30 or 60 minutes on a call. The client picks a free time in the
  coach's calendar inside the app, the slot is held for 20 minutes, and the payment confirms it.
  Each coach has one fixed room link. The client can move a session up to 24 hours before it; there
  is no self-cancel and no refund. Nastia's calendar is behind the `coach_nastia` feature flag.

## What is in it

- **Site** (Astro, SEO-first, RU + EN): the homepage, the course, club and coach pages,
  `/subscribe/`, `/together/`, an exercise library and guides, legal pages; sitemaps, JSON-LD,
  hreflang and IndexNow.
- **App** (`/app/`, React): sign-in by email code, onboarding, the course as a path of workouts, a
  workout player with the coach's own clips, adaptive load («легче / как обычно / тяжелее»), the
  club, the Тренер tab with booking, and an admin panel for courses, the club, people, bookings and
  support. Fully bilingual; the reader's language is chosen once and remembered.
- **Telegram**: the same app runs as a Mini App. The customer bot greets on `/start`, passes
  questions on to the coach and delivers messages from a queue (`telegram_outbox`: payments, club
  messages, session confirmations and reminders). A second bot posts every payment, booking and
  question into the owner's private group, one topic per area.
- **Payments**: Prodamus for roubles, lava.top for everyone else. Both webhooks open access or
  confirm a booking by themselves, and anything they cannot match lands in the owner's group.
- **Backend**: Supabase — Postgres with Row Level Security, email one-time-code auth, private video
  storage, and Edge Functions for the webhooks and the bots.
- **Hosting**: a static build published by GitHub Actions (GitHub Pages with the custom domain;
  Cloudflare Pages as an option — see `docs/DEPLOY.md`).

The load adaptation is deterministic and rule-based — see `docs/TRAINING_SCIENCE.md`. Nothing in the
product is mocked: every screen talks to the real backend. A browser-local demo mode exists for
trying the app without one (`docs/SETUP.md` §10).

## Quick start

```bash
npm ci
cp .env.example .env        # Supabase URL + anon key (see docs/SETUP.md §6)
npm run check               # astro check + tsc
npm run test                # Vitest
npm run build               # static site → dist/
npm run seo:audit           # SEO conveyor checks
npm run legal:check         # what is still missing before taking money (a report)
```

## Documentation

| Doc                                                    | What it covers                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`docs/SPEC.md`](docs/SPEC.md)                         | Product & engineering specification (the contract everything is built against)              |
| [`docs/SETUP.md`](docs/SETUP.md)                       | Supabase, auth email, migrations, payments, Telegram, booking, the owner's channel, secrets |
| [`docs/DEPLOY.md`](docs/DEPLOY.md)                     | Deployment, the custom domain, moving to a new repository                                   |
| [`docs/TRAINING_SCIENCE.md`](docs/TRAINING_SCIENCE.md) | Every rule and constant of the adaptive engine with sources                                 |
| [`docs/CONTENT.md`](docs/CONTENT.md)                   | Authoring exercises, courses, guides, videos                                                |
| [`docs/VIDEO.md`](docs/VIDEO.md)                       | The coach's exercise clips                                                                  |
| [`docs/COACH_RULES.md`](docs/COACH_RULES.md)           | The coach's rules for the beginner course — read before editing its workouts                |
| [`docs/SEO.md`](docs/SEO.md)                           | The SEO conveyor runbook (keywords → pages → audit → deploy → IndexNow)                     |
| [`docs/LEGAL.md`](docs/LEGAL.md)                       | Where the legal pages' text lives                                                           |
| [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md)             | The audit against Russian law and security, and what is still outstanding                   |
| [`docs/IDEAS.md`](docs/IDEAS.md)                       | Ideas that are not planned yet — each becomes a task and a PR when taken                    |

## Repository layout

```
content/     exercises, courses, guides (ru/en), site config (prices, links, booking, payments)
src/         Astro pages & layouts, React app, UI kit, engine, API layer, i18n
supabase/    SQL migrations (schema, RLS, functions), SQL tests, Edge Functions, auth email templates
scripts/     SEO conveyor, content validation, legal check, media, DB bundle, private page
docs/        specification and runbooks
.github/     CI, deploy, Supabase apply tasks, the bot's and the club's schedules
```

## Scripts

| Command                           | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `npm run build`                   | Build the static site (landing + app) into `dist/`           |
| `npm run check`                   | Astro + TypeScript type checks                               |
| `npm run lint` / `npm run format` | ESLint / Prettier                                            |
| `npm run test`                    | Vitest: engine, content, i18n parity, webhooks, SEO scripts  |
| `npm run legal:check`             | Report what is still missing before the site can take money  |
| `npm run content:validate`        | Validate `/content` against the schemas                      |
| `npm run content:review`          | Build the coach's review page for the beginner course        |
| `npm run seo:audit`               | Audit guides/content and (if present) `dist/` for SEO rules  |
| `npm run seo:og`                  | Generate OpenGraph images into `public/og/`                  |
| `npm run seo:new-guide`           | Scaffold a new guide from the writing checklist              |
| `npm run seo:indexnow`            | Submit URLs to IndexNow (needs `INDEXNOW_KEY`)               |
| `npm run db:bundle`               | Concatenate the migrations for one paste into the SQL editor |

## License

Proprietary — all rights reserved by the course owner.
