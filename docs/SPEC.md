# Forma — product & engineering specification

This document is the contract every contributor (human or agent) builds against.
Read it fully before touching code. When the spec and the code disagree, the spec wins
unless the spec is provably wrong — in that case fix the spec in the same change.

## 1. What we are building

**Forma** is a web product for a CrossFit coach who sells home-training courses.

- **Landing site** (SEO-first, static): sells 5 home CrossFit-style courses, some with light home
  equipment (dumbbells, kettlebell, pull-up bar, jump rope), some without. A visitor picks a course,
  enters an email; we record `email ↔ course` in the database (lifetime access). Optionally we
  redirect to an external payment link configured per course.
- **Web app** (`/app/`): the user enters the email, receives a one-time code by email, confirms it,
  and gets the fitness app: all courses (owned / locked), a Duolingo-style path per course, a
  leaderboard, streaks, adaptive difficulty, a workout player with exercise animations/videos,
  progress statistics. Two languages (RU/EN) switchable in settings — copy, descriptions and videos
  follow the language.
- **Backend**: Supabase (Postgres + Auth email OTP + Storage). Frontend is fully static and is
  deployed to GitHub Pages by GitHub Actions.

Nothing is mocked. If a feature needs a service the owner must provision (Supabase project, payment
links, video files), the code integrates with the real service and `docs/SETUP.md` explains how to
provision it. Values only the owner knows (coach name, prices, domain, analytics ids) live in
`content/site/*.ts` and `.env` and are listed in the SETUP "fill-in checklist". Never invent
reviews, statistics, testimonials or "trusted by" claims.

## 2. Tech stack (pinned in package.json — do not add dependencies)

| Area           | Choice                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Site framework | Astro 5, static output, i18n routing (`ru` default without prefix, `en` prefixed)                              |
| App            | React 19 island (`client:only`) mounted at `/app/`, `react-router` HashRouter                                  |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`) + design tokens in `src/styles/global.css`                               |
| Fonts          | `@fontsource-variable/manrope` (UI/body), `@fontsource/playfair-display` italic (display) — both have Cyrillic |
| State          | zustand (persisted where noted)                                                                                |
| Backend SDK    | `@supabase/supabase-js` v2                                                                                     |
| Validation     | zod (content schemas, forms)                                                                                   |
| Tests          | vitest (pure modules: training engine, seo scripts, content validation)                                        |
| Lint/format    | eslint (flat config) + prettier                                                                                |
| OG images      | `@resvg/resvg-js` (SVG → PNG at build time)                                                                    |

Quality gates (all must pass before a commit): `npm run check` (astro check + tsc), `npm run lint`,
`npm run test`, `npm run build`, `npm run seo:audit`.

Do **not** run a dev server or preview server (owner preference). Verify with builds, tests and
static rendering (e.g. resvg for SVG frames).

## 3. Repository layout

```
astro.config.mjs, tsconfig.json, vitest.config.ts, eslint.config.js, .prettierrc, .env.example
content/                    # editable product content (TypeScript / Markdown), validated by zod
  site/                     # brand.ts, coach.ts, pricing.ts, links.ts  (owner-editable config)
  exercises/                # exercise library: one file per group, index.ts exports EXERCISES
  courses/                  # one file per course (5), index.ts exports COURSES
  guides/{ru,en}/*.md       # SEO articles (Astro content collection "guides")
  seo/                      # keywords.json (clusters), redirects, seo config
src/
  content.config.ts         # Astro content collections (guides)
  content/schema.ts         # zod schemas + TS types for exercises/workouts/courses (CONTRACT)
  content/registry.ts       # validated, indexed access to content
  i18n/                     # index.ts (t(), locale helpers) + ru/*.ts en/*.ts per namespace
  styles/global.css         # tokens + tailwind theme
  lib/training/             # training-science engine (pure TS, tested)
  lib/api/                  # Supabase client + typed data access (auth, profiles, sessions...)
  lib/seo/                  # JSON-LD builders, url/hreflang helpers, sitemap registry
  lib/util/                 # l10n helpers, paths (withBase), dates
  layouts/                  # Base.astro (html shell, SeoHead, fonts), Landing.astro (nav/footer)
  components/seo/           # SeoHead.astro, JsonLd.astro, Analytics.astro
  components/landing/       # landing sections (Astro)
  components/anim/          # Figure rig (SVG) + poses per exercise (used by app AND landing)
  components/ui/            # React UI kit used by the app (Button, Card, Chip, Sheet, ...)
  app/                      # React SPA: main.tsx, router.tsx, store/, screens/, hooks/
  pages/                    # Astro routes (see §9)
supabase/
  migrations/*.sql          # schema, RLS, functions, views, triggers (idempotent where possible)
  templates/*.html          # auth email templates (OTP code)
scripts/
  seo/                      # audit.mjs, indexnow.mjs, new-guide.mjs, og.mjs
  content/                  # validate.mjs (runs zod over content)
docs/                       # SPEC.md (this), SETUP.md, SEO.md, TRAINING_SCIENCE.md, CONTENT.md
.github/workflows/          # ci.yml (checks), deploy.yml (GitHub Pages)
public/                     # favicon.svg, icons, manifest
```

## 4. Conventions

- Code, comments, commit messages, docs: **English**. Product copy: RU and EN via i18n/L10n.
- TypeScript strict. No `any` unless interfacing with untyped JSON (then narrow immediately).
- Every user-visible string goes through i18n (`t()`) or an `L10n` content field. No hardcoded RU/EN
  strings in components.
- File ownership: each area owns its folders (see §3). Shared contracts (`src/content/schema.ts`,
  `src/i18n/index.ts`, `src/styles/global.css`, `src/lib/training/index.ts` exports) change only with
  care and a note in the result.
- i18n namespaces: `common`, `landing`, `app`, `training`, `seo`. Each namespace is a file in
  `src/i18n/ru/<ns>.ts` and `src/i18n/en/<ns>.ts` with identical key sets (a test enforces parity).
- Tailwind utilities + tokens; no inline hex colors in components. Course accent colors come from
  content (`course.accent`, `course.gradient`) and are applied via CSS variables.
- Accessibility: interactive elements are `<button>`/`<a>`, images have `alt`, overlays close on
  Esc, focus visible, color contrast ≥ 4.5:1 for text on dark surfaces.
- Mobile-first. The app is designed for a phone (390px) and must be usable up to desktop
  (centered max-width 480px app frame on large screens). Landing is responsive 360px → 1440px.
- Dates: store ISO strings; "today" is computed in the user's local timezone for streaks/steps;
  server timestamps are `timestamptz`.
- Errors: never crash to a blank screen; show a localized error state with retry.

## 5. Brand & design system

- Name: **Forma** (`content/site/brand.ts`). Tagline RU "Кроссфит дома. Под тебя." EN "Home CrossFit
  that adapts to you."
- Look (from the reference screens): near-black background, dark rounded cards, white primary
  buttons with black text, pastel gradient "hero art" cards (mint → sky, peach → lilac, etc.), pill
  chips for metrics (kcal, min), italic display headings, bottom tab bar in the app
  (Home / Courses / Stats / Profile), large rounded corners (24px cards, 16px inner elements),
  generous spacing, subtle 1px borders (`--border`).
- Tokens (`src/styles/global.css`): `--bg #0B0B0D`, `--surface #151519`, `--surface-2 #1E1E24`,
  `--surface-3 #2A2A31`, `--border rgba(255,255,255,.08)`, `--text #F5F5F7`, `--muted #9A9AA3`,
  `--muted-2 #6B6B73`, `--primary #FFFFFF` (on-primary `#0B0B0D`), `--accent #B9F3E0` (mint),
  `--accent-2 #C9D6FF` (sky), `--success #7CE0B0`, `--warning #FFD166`, `--danger #FF6B6B`,
  radii `--r-card 24px`, `--r-inner 16px`, `--r-pill 999px`.
- Typography: display = Playfair Display italic 500/600 (`font-display`), body/UI = Manrope
  variable (`font-sans`). Numbers in timers use `font-sans` with tabular figures.
- Hero art: we have no photos. Use the animated SVG figure on pastel gradient cards
  (`components/anim`) — this is the brand illustration system on both landing and app.

## 6. Content model (contract: `src/content/schema.ts`)

`L10n = { ru: string; en: string }`. All content is TypeScript validated by zod at test time and
by `scripts/content/validate.mjs`.

**Exercise** — id (`snake_case`), `slug: L10n` (latin, kebab-case; RU slug is a transliteration or a
recognizable latin term), `name`, `description` (2–4 sentences), `howTo[]` (≥3 steps), `cues[]`
(≥2), `mistakes[]` (≥1), `breathing?`, `muscles[]`, `pattern`, `equipment[]` (`['none']` for
bodyweight), `level 1|2|3`, `unit` (`reps|seconds|meters|calories`), `secondsPerRep` (required for
reps), `met` (metabolic equivalent), `loadable`, `scaling {easier?, harder?}` (exercise ids),
`animation` (id of a pose set in `components/anim/poses`), `video? {ru?, en?}` (URL or
`storage:<bucket>/<path>`), `tags[]`, `isTest?`.

**Workout** — `id`, `name`, `focus`, `description`, `blocks[]`, `basePoints` (60–250), `tags[]`.
**Block** — `id`, `type` (`warmup|skill|strength|metcon|core|cooldown|test`), `format`
(`sets|circuit|amrap|emom|fortime|tabata|interval`), `title?`, `description?`, `sets?`, `rounds?`,
`durationSec?` (AMRAP length / For-time cap), `workSec?`/`restSec?` (tabata/interval),
`restBetweenSetsSec?`, `restBetweenRoundsSec?`, `items[]`, `scalable` (default true; warmup and
cooldown are not scaled).
**WorkoutItem** — `exerciseId`, exactly one of `reps|seconds|meters|calories`, `load?`
(`light|medium|heavy`), `perSide?`, `note?`, `restAfterSec?`.
**CourseNode** — `id`, `week`, `day`, `kind` (`workout|rest|test|benchmark|milestone`),
`workoutId?` (required for workout/test/benchmark), `title`, `subtitle?`, `deload?`, `stepsGoal?`
(rest nodes, default 7000).
**Course** — `id`, `order`, `slug: L10n`, `name`, `tagline`, `description`, `longDescription[]`,
`forWhom[]`, `outcomes[]`, `equipment[]`, `level`, `weeks`, `sessionsPerWeek`, `avgSessionMin`,
`accent` (hex), `gradient` `[hex, hex]`, `price {rub, usd}`, `paymentUrl? {ru?, en?}`,
`introVideo? {ru?, en?}`, `workouts[]`, `nodes[]`, `faq[]`.

Content rules: exercises referenced by workouts must exist; every exercise used by a course must be
doable with the course equipment (or `none`); every course has ≥1 test node at start
(baseline) and end; rest nodes between consecutive workout days; week 4 (and 8) are deload weeks in
6–8-week courses.

## 7. Training-science engine (contract: `src/lib/training/index.ts`)

Pure TypeScript, no I/O, fully unit-tested, documented in `docs/TRAINING_SCIENCE.md` with the
sources behind each rule (ACSM guidelines, progressive overload, RPE/RIR autoregulation, deloads,
MET-based energy expenditure, WHO physical activity guidance, 7000-steps evidence).

Public API (types in `types.ts`):

```ts
computeFitnessIndex(profile: UserTrainingProfile): { index: number /*0..100*/; level: 1|2|3; components: Record<string, number> }
initialScale(index: number): number              // maps 0..100 → 0.6..1.3 (volume multiplier)
recommendDifficulty(state: CourseState, profile: UserTrainingProfile, nowIso: string): { choice: DifficultyChoice; reason: L10n }
prescribeWorkout(workout: Workout, opts: PrescribeOptions): PrescribedWorkout   // concrete reps/seconds/loads, substitutions, rest
estimateDuration(p: PrescribedWorkout): DurationEstimate                        // seconds, per block
estimatePoints(workout: Workout, choice: DifficultyChoice, opts?: { repeat?: boolean; streakDays?: number }): number
estimateCalories(p: PrescribedWorkout, weightKg: number): number
buildPlayerSteps(p: PrescribedWorkout): PlayerStep[]                            // explain → work → rest … → done
summarizeSession(p: PrescribedWorkout, results: ExerciseResult[], feedback: SessionFeedback, opts): SessionSummary
adaptScale(state: CourseState, summary: SessionSummary): { scale: number; delta: number; reason: L10n }
computeStreak(days: DayActivity[], todayIso: string): StreakInfo
stepsPoints(steps: number, goal?: number): number
levelForPoints(points: number): LevelInfo
```

Rules (defaults; constants live in `constants.ts`):

- Difficulty choice multipliers: easier ×0.85 volume / ×1.15 rest, normal ×1.0, harder ×1.15 volume
  / ×0.9 rest. Points factor: easier 0.8, normal 1.0, harder 1.25. Repeating a completed node yields
  50% points. Streak bonus: +10% at ≥7 days, +20% at ≥30 days.
- Adaptation after a session (Borg CR10 RPE + completion ratio): completion ≥0.95 and RPE ≤6 →
  scale +0.05; RPE 7–8 and completion ≥0.9 → +0.02; RPE ≥9 or completion <0.8 → −0.05;
  feeling `pain` → −0.10 and a "see a professional / reduce load" note. Scale clamped to 0.5..1.5.
- Recommendation before a workout: `harder` if the last two sessions had RPE ≤6 and completion ≥0.95
  and ≥48h passed since the last session; `easier` if the last RPE ≥9, or completion <0.8, or
  <24h since the last session, or yesterday's steps ≥ 15 000 (heavy day); otherwise `normal`.
- Deload nodes: volume ×0.65, rest ×1.2, points as normal.
- Duration: reps × `secondsPerRep` (× scale), seconds as given, plus rest, plus 8s transition per
  item, plus 20s per block intro; AMRAP/EMOM/Tabata durations are fixed by format; For-time uses the
  estimated work time capped by `durationSec`.
- Calories: MET × weightKg × hours per work interval (rest at 1.5 MET), default weight 70 kg.
- Substitutions: level 1 users or limitations map exercises to `scaling.easier` (recursively up to 2
  steps); `harder` choice at level 3 may use `scaling.harder` for bodyweight items.
- Streak: a day counts if a workout session was completed **or** logged steps ≥ goal (7000). The
  current day does not break the streak until it ends (`atRisk` flag when nothing logged yet).
- Steps points: 30 at goal, +5 per extra 1000 (cap 60), 0 below goal.
- Fitness index: weighted components — push-ups (30%), squats/60s (25%), plank (20%), activity
  (15%), experience (10%), using age/sex-normalized reference tables documented in
  TRAINING_SCIENCE.md; level 1 <35, level 2 35–65, level 3 >65.

## 8. Backend (Supabase) — contract: `supabase/migrations`, `src/lib/api`

Auth: email OTP. Client calls `auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`,
then `auth.verifyOtp({ email, token, type: 'email' })`. The Supabase email template must include
`{{ .Token }}` (template in `supabase/templates/otp.html`, RU+EN in one email).

Tables (all with RLS enabled):

- `profiles` (`id uuid pk → auth.users`, `email text`, `display_name text`, `avatar_seed text`,
  `locale text default 'ru'`, `training_profile jsonb` (UserTrainingProfile), `fitness_index int`,
  `fitness_level int`, `onboarded_at timestamptz`, timestamps). Own row read/write. Created by trigger
  on `auth.users` insert.
- `purchases` (`id uuid`, `email citext`, `course_id text`, `status text` in
  `pending|active|refunded`, `source text`, `locale text`, `note text`, `created_at`,
  `activated_at`). Unique `(email, course_id)`. Anonymous inserts only through RPC
  `create_order(p_email, p_course_id, p_locale, p_source)` (security definer, validates email and
  course id, upserts pending). Users read their own via view `my_entitlements` (`course_id`,
  `activated_at`) filtered by `lower(email) = lower(auth.email())` and `status = 'active'`.
  Admins (`admins(email)` table + `is_admin()`) read/update all.
- `user_course_state` (`user_id`, `course_id`, `scale numeric`, `current_node_index int`,
  `completed_node_ids text[]`, `updated_at`), pk `(user_id, course_id)`. Own rows.
- `workout_sessions` (`id uuid`, `user_id`, `course_id`, `node_id`, `workout_id`, `difficulty text`,
  `scale numeric`, `prescribed jsonb`, `results jsonb`, `rpe int`, `feeling text`, `completion
numeric`, `points int`, `duration_sec int`, `calories int`, `started_at`, `completed_at`,
  `local_date date`). Own rows.
- `daily_logs` (`user_id`, `local_date date`, `steps int`, `points int`, `note text`, `updated_at`),
  pk `(user_id, local_date)`. Own rows.
- `benchmarks` (`user_id`, `key text`, `value numeric`, `unit text`, `recorded_at`) — personal
  records from test nodes. Own rows.
- Leaderboard: security-definer function `get_leaderboard(p_period text /*week|all*/, p_course_id
text default null, p_limit int default 100)` returning `(user_id, display_name, avatar_seed,
points, rank, is_me)`. Never exposes emails. `points` = sum of `workout_sessions.points` (+
  `daily_logs.points` for global). Week = current ISO week (UTC).
- Storage bucket `videos` (private): read policy for authenticated users with an active purchase of
  the course encoded as the first path segment (`<course_id>/…`) or under `shared/`.
- Admin RPC: `admin_set_purchase_status(p_id uuid, p_status text)`.

`src/lib/api/` exposes typed functions (`auth.ts`, `profiles.ts`, `entitlements.ts`,
`courseState.ts`, `sessions.ts`, `dailyLogs.ts`, `leaderboard.ts`, `orders.ts`, `admin.ts`,
`storage.ts`) over a single client (`client.ts`) configured from `PUBLIC_SUPABASE_URL` and
`PUBLIC_SUPABASE_ANON_KEY`. `isConfigured()` returns false when env is missing; the app shows a
localized "backend not configured" screen instead of crashing.

## 9. Routes

Landing (Astro, static, RU default / EN under `/en/`):

```
/                          home
/courses/                  courses hub
/courses/<slug>/           course page + order form (5 pages per locale)
/exercises/                exercise library hub (programmatic)
/exercises/<slug>/         exercise page: animation, how-to, cues, mistakes, scaling, related
/guides/                   guides hub (clusters)
/guides/<slug>/            SEO article (content collection)
/about/  /privacy/  /terms/  /refund/  /contact/
/app/                      React app (noindex)
/sitemap.xml  /robots.txt  /llms.txt  /rss.xml  /<indexnow-key>.txt  /manifest.webmanifest  /404
```

App (HashRouter under `/app/#/`): `/auth`, `/onboarding`, `/` (home), `/courses`, `/courses/:id`,
`/courses/:id/nodes/:nodeId` (preview + difficulty), `/play` (active session), `/summary/:sessionId`,
`/stats`, `/leaderboard`, `/steps`, `/profile`, `/admin`.

## 10. App flows (must match exactly)

1. **Auth**: email field → "Send code" → 6-digit code field (paste-friendly, resend timer 60s) →
   session. Errors localized. Language switch available on the auth screen.
2. **Onboarding** (first login, resumable): language → name → basics (age band, sex optional,
   weight optional) → activity level → experience → equipment (+ dumbbell/kettlebell weights) →
   limitations → self-tests (max push-ups with knee option, air squats in 60s with in-app timer,
   plank hold with timer) → time per session → goal → result screen (fitness index, level,
   what it means) → home.
3. **Home**: greeting, streak card (days, at-risk state, rest-day steps CTA), "Today" card = next
   node of the active course (or "pick a course"), quick stats (steps this week chart, kcal, minutes,
   points), owned courses row, locked courses row with "Get course" CTA linking to landing.
4. **Course path**: vertical winding path grouped by week; node states done/current/locked; rest
   nodes; test/benchmark nodes; header with progress %, leaderboard button.
5. **Node preview**: plan (blocks → exercises with animation thumbnails and prescribed numbers),
   difficulty chooser with three cards (Easier / As usual / Harder): each shows estimated duration
   and points; the recommended one is badged with the reason; "Start".
6. **Player**: per exercise: explanation step (name, animation/video, cues) → work step
   (animation background + timer for seconds / rep counter with "Done" for reps / load shown when
   loadable) → rest countdown (skippable) → next. Controls: Previous, Pause, Next. Block intros.
   Progress bar and elapsed time. Leaving asks for confirmation; unfinished session persists locally
   and can be resumed.
7. **Summary + feedback**: time, points, calories, completion; RPE slider 1–10 with descriptors;
   feeling chips (great / ok / hard / pain); notes; "Save" → adaptation message ("next time +5%").
8. **Stats**: weekly workouts/minutes/points chart, streak calendar, steps chart, personal records,
   achievements.
9. **Leaderboard**: tabs week / all-time, course filter, top-100 with own row pinned.
10. **Steps**: log today's steps (manual input; explain why), history, goal 7000.
11. **Profile**: name, avatar seed, language (RU/EN), units, equipment/weights, retake tests, sign
    out; admin link if admin.
12. **Admin**: purchases list (search by email, filter status), activate / refund, add purchase.

## 11. SEO conveyor (docs/SEO.md is the runbook)

Mirrors the moba-trainer pipeline: structured page documents → templated pages → JSON-LD →
sitemap/robots/llms → internal linking → hubs → IndexNow.

- Every page has: unique `<title>` (≤60 chars), meta description (80–160), canonical, hreflang
  (`ru`, `en`, `x-default`), OpenGraph/Twitter, JSON-LD graph (`WebSite`+`Organization` on home,
  `Course` on course pages, `Article`/`HowTo` + `BreadcrumbList` + `FAQPage` where applicable,
  `VideoObject` when a video exists, `ExercisePlan`/`HowTo` for exercises), `lang` attribute.
- Programmatic families: exercises (from the library), courses, guides (Markdown collection with
  clusters), hubs per cluster. Internal links: every article links to ≥3 related pages; exercise
  pages link to courses using them.
- `scripts/seo/audit.mjs`: title/description lengths, duplicates, hreflang pairs, broken internal
  links, minimum word count for guides (≥800 words), every exercise/course has both locales, sitemap
  coverage. Fails CI on errors.
- `scripts/seo/indexnow.mjs`: submits changed URLs to IndexNow (Yandex, Bing) after deploy when
  `INDEXNOW_KEY` is set. Key file served at `/<key>.txt`.
- Analytics/verification from env: `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`,
  `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION` — rendered only when set.
- OG images generated per page at build (`scripts/seo/og.mjs` → `public/og/*.png`).

## 12. Deployment

- `deploy.yml`: on push to the deploy branch, `npm ci && npm run build` with `SITE_URL`,
  `BASE_PATH` (derived from the repository name unless a custom domain is configured),
  `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` from repository variables; uploads `dist/` with
  `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`. Then runs IndexNow when
  the secret exists.
- `ci.yml`: check, lint, test, build, seo audit on pull requests.
- The app uses `import.meta.env.BASE_URL` everywhere (`withBase()` helper) so it works both at
  `https://<user>.github.io/<repo>/` and on a custom domain.
