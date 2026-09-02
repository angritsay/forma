# Forma — home CrossFit that adapts to you

Forma is the web product of a CrossFit coach who sells home-training courses:

- **Landing** (SEO-first, RU + EN): sells five home courses (with and without light equipment),
  records `email ↔ course` purchases for lifetime access, and runs a programmatic SEO conveyor
  (exercise encyclopedia, guides, course pages, sitemaps, JSON-LD, IndexNow).
- **App** (`/app/`): sign in with an email code, onboarding with self-tests, Duolingo-style course
  paths, a workout player with exercise animations/videos, adaptive difficulty ("easier / as usual /
  harder" with estimated duration and points), streaks with 7 000-step rest days, leaderboard,
  statistics, achievements. Language switchable in settings.
- **Backend**: Supabase (Postgres + Row Level Security, email OTP auth, private video storage).
- **Hosting**: static build on GitHub Pages via GitHub Actions.

The load-adaptation logic is deterministic sports science (progressive overload, RPE-based
autoregulation, deload weeks, MET-based energy estimates) — see `docs/TRAINING_SCIENCE.md`. Nothing
in the product is mocked: every screen talks to the real backend, every course is a real program.

## Quick start

```bash
npm ci
cp .env.example .env        # Supabase URL + anon key (see docs/SETUP.md)
npm run check               # astro check + tsc
npm run test                # engine, content, i18n, seo script tests
npm run build               # static site → dist/
npm run seo:audit           # SEO conveyor checks
```

## Documentation

| Doc | What it covers |
| --- | --- |
| [`docs/SPEC.md`](docs/SPEC.md) | Product & engineering specification (the contract everything is built against) |
| [`docs/SETUP.md`](docs/SETUP.md) | Supabase project, auth email template, admins, storage, env vars, fill-in checklist |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | GitHub Pages deployment, custom domain, moving to a new repository |
| [`docs/TRAINING_SCIENCE.md`](docs/TRAINING_SCIENCE.md) | Every rule and constant of the adaptive engine with sources |
| [`docs/CONTENT.md`](docs/CONTENT.md) | Authoring exercises, courses, guides, videos, animations |
| [`docs/SEO.md`](docs/SEO.md) | The SEO conveyor runbook (keywords → pages → audit → deploy → IndexNow) |

## Repository layout

```
content/     exercises, courses, guides (ru/en), site config      ← editable product content
src/         Astro pages & layouts, React app, UI kit, engine, API layer, animations, i18n
supabase/    SQL migrations (schema, RLS, functions), auth email templates
scripts/     SEO conveyor scripts (audit, IndexNow, OG images, new guide), content validation
docs/        specification and runbooks
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Build the static site (landing + app) into `dist/` |
| `npm run check` | Astro + TypeScript type checks |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run test` | Vitest: engine, content registry, i18n parity, SEO scripts |
| `npm run content:validate` | Validate `/content` against the schemas |
| `npm run seo:audit` | Audit guides/content and (if present) `dist/` for SEO rules |
| `npm run seo:og` | Generate OpenGraph images into `public/og/` |
| `npm run seo:new-guide` | Scaffold a new guide from the writing checklist |
| `npm run seo:indexnow` | Submit URLs to IndexNow (needs `INDEXNOW_KEY`) |

## License

Proprietary — all rights reserved by the course owner.
