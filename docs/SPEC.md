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
  leaderboard, streaks, adaptive difficulty, a workout player with the coach's clip of each movement,
  progress statistics. Russian throughout — copy, descriptions and videos.
- **Backend**: Supabase (Postgres + Auth email OTP + Storage). Frontend is fully static and is
  deployed to GitHub Pages by GitHub Actions.

Nothing is mocked. If a feature needs a service the owner must provision (Supabase project, payment
links, video files), the code integrates with the real service and `docs/SETUP.md` explains how to
provision it. Values only the owner knows (coach name, prices, domain, analytics ids) live in
`content/site/*.ts` and `.env` and are listed in the SETUP "fill-in checklist". Never invent
reviews, statistics, testimonials or "trusted by" claims.

## 2. Tech stack (pinned in package.json — do not add dependencies)

| Area           | Choice                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Site framework | Astro 5, static output, i18n routing (`ru` default without prefix, `en` prefixed)                     |
| App            | React 19 island (`client:only`) mounted at `/app/`, `react-router` HashRouter                         |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`) + design tokens in `src/styles/global.css`                      |
| Fonts          | `@fontsource-variable/onest` (UI/body), `@fontsource-variable/manrope` (display) — both have Cyrillic |
| State          | zustand (persisted where noted)                                                                       |
| Backend SDK    | `@supabase/supabase-js` v2                                                                            |
| Validation     | zod (content schemas, forms)                                                                          |
| Tests          | vitest (pure modules: training engine, seo scripts, content validation)                               |
| Lint/format    | eslint (flat config) + prettier                                                                       |
| OG images      | `@resvg/resvg-js` (SVG → PNG at build time)                                                           |

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
  components/media/         # ExerciseStill: one frame of a movement's clip (used by app AND landing)
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

- Code, comments, commit messages, docs: **English**. Product copy: **Russian** — every string and
  every content field still carries an English value (L10n), but `LOCALES` in
  `src/content/schema.ts` publishes Russian only: no /en/ pages, no hreflang, no language switch.
  Publishing English again is that one line plus a copy review.
- TypeScript strict. No `any` unless interfacing with untyped JSON (then narrow immediately).
- Every user-visible string goes through i18n (`t()`) or an `L10n` content field. No hardcoded
  strings in components.
- File ownership: each area owns its folders (see §3). Shared contracts (`src/content/schema.ts`,
  `src/i18n/index.ts`, `src/styles/global.css`, `src/lib/training/index.ts` exports) change only with
  care and a note in the result.
- i18n namespaces: `common`, `landing`, `app`, `training`, `seo`. Each namespace is a file in
  `src/i18n/ru/<ns>.ts` and `src/i18n/en/<ns>.ts` with identical key sets (a test enforces parity).
- Tailwind utilities + tokens; no inline hex colors in components. A course's tile colour comes
  from content (`course.tile`) and is applied via the `--course-tile` CSS variable.
- Accessibility: interactive elements are `<button>`/`<a>`, images have `alt`, overlays close on
  Esc, focus visible, color contrast ≥ 4.5:1 for text on dark surfaces.
- Mobile-first, with one breakpoint. The app is designed for a phone (390px), and that is what it
  is **below `md` (768)**: a 480px column with the bottom tab bar. **From `md` up it uses the
  screen** — the frame releases its cap, the tab bar hides and `TopNav` takes over as a row across
  the top, with `AdminNav` as a second column inside `/admin`. This reverses the rule that stood
  here («centered max-width 480px app frame on large screens»), and the reversal is the owner's:
  she builds courses from a laptop, and a 480px strip in the middle of one is a phone stranded in a
  grey field. Content is capped at 760px for reading screens, 1040px for the screen that splits
  in two (the club) and 1280px for the admin; a sheet becomes a centred dialog at the same
  breakpoint. Landing is responsive 360px → 1440px.
- `AdminNav` is the one component that waits for `lg` (1024) instead. Its rail is 264px, which is a
  third of a tablet: at `md` it left the purchases 504px — less than a phone gives them — so a
  tablet takes the phone's route into the admin and spends the whole width on the work.
- Which screens re-lay out rather than stretch, from `md`: Today (workout left, the rest right),
  Programmes (tickets two across), the club (day left, week's board right), the profile
  (identity left, settings right), the player (clip left, counter and «дальше» right), the course
  day in the admin (list of days left, editor right), and the progress details (figures two across).
  Everything else keeps one column and gains air.
- The type scale does not change with the screen (`design/` calls it «мобайл-первая, 390px»). What
  grows on a wide screen is the gutter, the column count and the air between sections.
- Dates: store ISO strings; "today" is computed in the user's local timezone for streaks/steps;
  server timestamps are `timestamptz`.
- Errors: never crash to a blank screen; show a localized error state with retry.

## 5. Brand & design system

- Name: **Forma** (`content/site/brand.ts`). Tagline RU "Кроссфит дома. Под тебя." EN "Home CrossFit
  that adapts to you."
- Look: near-black ground throughout, structured by hairline rules and editorial numerals rather
  than by a card around every object. Composition is asymmetric — a 7/5 grid, not a balanced
  split; headings sit low against their column; photographs bleed past the page gutter. Large
  radii where an object is genuinely discrete (24px cards, 20px tiles) and 12px on everything
  interactive — buttons, inputs and chips alike, with capitalised, tracked labels. A _fact_ that
  is not a control — «12 баллов», the prize, a trial's days left — is a fully rounded pill
  (`Pill`), and a person or a rank is a circle (`Avatar`, the board's numerals): the owner's
  prototype (`design/ui_kits/app-v2`) draws them so, and `design/CHANGELOG.md` §10 records the
  reversal of the earlier «no pills, no circles» rule. This paragraph described that scale while
  the tokens were all 0; both now agree, and the one change of mind is the buttons, which used to
  be held at a near-square 4px. Chrome that has content moving under it — the tab bar, a screen
  header, a sheet, a modal, the player — is frosted glass (`design/CHANGELOG.md` §8); everything
  else is a solid surface. The app's tab bar (Курсы / Клуб / Тренер, plus Админка as a fourth seat
  for whoever has the panel — the profile is a sheet behind the avatar, not a tab) is a capsule of
  glass floating over the bottom of the screen with one highlight that slides between the seats.
  The highlight is a share of however many seats the bar has, never a hard-coded quarter, because
  the same bar is three seats for most people and four for an admin. A screen arrives the way the
  highlight went (`screenMotion`). Generous spacing, 1px
  borders (`--border`).
- The accent is a dosage rule, not just a colour: `#9ECBFF` marks the primary button, the
  wordmark's full stop, a rule, a kicker, "you are here". Never a large fill. Large areas are
  shades of black and full-bleed monochrome photography.
- Tokens (`src/styles/global.css`): `--bg #0B0B0D`, `--surface #151519`, `--surface-2 #1E1E24`,
  `--surface-3 #2A2A31`, `--border rgba(255,255,255,.08)`, `--text #F4F4F6`, `--muted #A8A8B2`,
  `--muted-2 #93939D`, `--primary #FFFFFF` (on-primary `#0B0B0D`), `--accent #9ECBFF`,
  `--accent-2 #C9D6FF` (periwinkle), `--success #7CE0B0`, `--warning #FFD166`, `--danger #FF6B6B`,
  course tiles `--tile-1…5` with `--tile-fg #DCE9FA` as their ink, radii `--r-card 24px`,
  `--r-tile 20px`, `--r-inner 16px`, `--r-control 4px`.
- Typography: display = Manrope variable 600 (`font-display`; 800 for the wordmark), body/UI =
  Onest variable (`font-sans`). Both are chosen for Cyrillic first: an earlier pair drew и, п and
  т as composite glyphs pointing at the Latin u, n and m outlines, so every Russian heading
  rendered as pseudo-Latin. Display leading is 1.18 and tracking -0.02em — measured floors, not
  taste: Й reaches 0.926em above the baseline and у drops to -0.240em in Manrope, so lines collide
  below 1.166em. Numbers in timers use `font-sans` with tabular figures — both faces expose
  `tnum`.
- Kickers (`.eyebrow`) are uppercase at 0.14em tracking, per the brandbook. This is a deliberate
  trade, and it reverses an earlier rule in this spec: Cyrillic capitals are near-uniform
  rectangles, so a Russian label in caps loses its word silhouette and roughly doubles its set
  width. It is affordable for short labels only — use `.eyebrow-sentence` for anything longer.
  `src/i18n/eyebrow.test.ts` fails the build on a string over 22 characters inside an `.eyebrow`.
- Photography is the main visual surface: full-bleed, monochrome, grained, white text over a
  protection gradient (`.photo-mono` / `.photo-grain` / `.photo-scrim`, and the two `PhotoBlock`
  components). **The current photographs are placeholders** — see `src/lib/media/photos.ts`: they
  are remote Unsplash URLs rather than vendored files, and the pictures themselves are wrong for a
  product about training at home.
- A still from the coach's clip (`components/media/ExerciseStill`) is the second illustration
  system: `images/exercises/<id>.jpg` in the public bucket, drawn on the flat course tile. It
  carries a course's identity wherever a photograph does not exist — catalogue rows, the top of a
  workout, the movement grid. Where a movement has no clip the tile is left flat; nothing is drawn
  to stand in for footage that has not been shot.

## 6. Content model (contract: `src/content/schema.ts`)

`L10n = { ru: string; en: string }`. All content is TypeScript validated by zod at test time and
by `scripts/content/validate.mjs`.

**Exercise** — id (`snake_case`), `slug: L10n` (latin, kebab-case; RU slug is a transliteration or a
recognizable latin term), `name`, `description` (2–4 sentences), `howTo[]` (≥3 steps), `cues[]`
(≥2), `mistakes[]` (≥1), `breathing?`, `muscles[]`, `pattern`, `equipment[]` (`['none']` for
bodyweight), `level 1|2|3`, `unit` (`reps|seconds|meters|calories`), `secondsPerRep` (required for
reps), `met` (metabolic equivalent), `loadable`, `scaling {easier?, harder?}` (exercise ids),
`video? {ru?, en?}` (URL or `storage:<bucket>/<path>`), `tags[]`, `isTest?`.

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
`tile` (hex — one of `--tile-1…5`), `price {rub, usd}`, `paymentUrl? {ru?, en?}`,
`introVideo? {ru?, en?}`, `workouts[]`, `nodes[]`, `faq[]`.

Content rules: exercises referenced by workouts must exist; every exercise used by a course must be
doable with the course equipment (or `none`); every course has ≥1 test node at start
(baseline; a level-1 course may open with its first workout, since the onboarding self-tests set the
starting load) and end; rest nodes between consecutive workout days; week 4 (and 8) are deload weeks in
6–8-week courses (the beginner course `start` follows the coach's own programme and has none).

## 7. Training-science engine (contract: `src/lib/training/index.ts`)

Pure TypeScript, no I/O, fully unit-tested, documented in `docs/TRAINING_SCIENCE.md` with the
sources behind each rule (ACSM guidelines, progressive overload, RPE/RIR autoregulation, deloads,
MET-based energy expenditure, WHO physical activity guidance, 7000-steps evidence).

Public API (types in `types.ts`):

```ts
computeFitnessIndex(profile: UserTrainingProfile): { index: number /*0..100*/; level: 1|2|3; components: Record<string, number> }
initialScale(index: number): number              // maps 0..100 → 0.6..1.3 (volume multiplier)
recommendDifficulty(state: CourseState, profile: UserTrainingProfile, nowIso: string, context?: RecommendationContext /* stepsYesterday */): { choice: DifficultyChoice; reason: L10n }
prescribeWorkout(workout: Workout, opts: PrescribeOptions, lookup?: ExerciseLookup): PrescribedWorkout   // concrete reps/seconds/loads, substitutions, rest
estimateDuration(p: PrescribedWorkout): DurationEstimate                        // seconds, per block
estimatePoints(workout: Workout, choice: DifficultyChoice, opts?: { repeat?: boolean; streakDays?: number }): number
estimateCalories(p: PrescribedWorkout, weightKg?: number, lookup?: ExerciseLookup): number
buildPlayerSteps(p: PrescribedWorkout): PlayerStep[]                            // block_intro → work → rest … → done
warmupSkipIndex(steps: readonly PlayerStep[], p: PrescribedWorkout): number | null  // where "skip the warm-up" lands
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
- Recommendation before a workout: `harder` if the last two sessions had RPE ≤6, completion ≥0.95
  and no pain, and ≥48h passed since the last session; `easier` if the last session reported pain or
  RPE ≥9, or completion <0.8, or <24h since the last session, or yesterday's steps ≥ 15 000 (heavy
  day); otherwise `normal`. History is ordered chronologically (instants, not strings).
- Deload nodes: volume ×0.65, rest ×1.2, points as normal.
- Duration: reps × `secondsPerRep` (× scale), seconds as given, plus rest, plus 8s transition per
  item, plus 20s per block intro; AMRAP/EMOM/Tabata durations are fixed by format; For-time uses the
  estimated work time capped by `durationSec`. Only the rests the player actually plays are counted
  (no rest after the last set, round or interval), so the estimate matches the player timeline.
- Completion: each work step is weighted by its estimated seconds; `achieved` is read the way the
  step is run — seconds for a timer step (seconds item, EMOM minute, Tabata/interval round), reps
  for a reps step. A `test` block's step (`isTest`) is a max effort against the clock: the client
  records the measurement for the benchmark and the step counts as done or skipped.
- Calories: MET × weightKg × hours per work interval (rest at 1.5 MET), default weight 70 kg.
- Substitutions: level 1 users or limitations map exercises to `scaling.easier` (recursively up to 2
  steps); `harder` choice at level 3 may use `scaling.harder` for bodyweight items, never inside a
  non-scalable block (warm-up, cool-down) or a `test` block — a benchmark must stay the same
  movement. A substitute measured in another unit keeps the work time, not the number.
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

**Demo mode** (`src/lib/api/mode.ts`, `src/lib/api/demo/*`, runbook in docs/SETUP.md §10) is a
deliberate, clearly-labelled testing feature: a browser-local backend implementing the same API
surface over `localStorage` (namespace `forma.demo.*`, versioned), so the whole product — sign-in,
onboarding, the player, stats, leaderboard, admin, the landing order form — can be walked through
before Supabase exists. Rows are stored in the shapes `mappers.ts` converts from, so the domain
types keep one definition; errors keep the `AppError`/`AuthError` contract; every call is delayed
~120 ms so loading states stay visible. Auth uses a locally generated 6-digit code shown on the
auth screen in a demo hint. A new demo account is seeded with the `start` and `engine` courses
active, no history, two weeks of step logs, twelve invented leaderboard athletes and admin
rights. Activation is exactly two paths: `PUBLIC_DEMO_MODE=true` at build time, or — only when
Supabase is **not** configured — a visitor flag (`forma.demo`) set by the button on the setup
screen. With Supabase configured and the build flag absent, `isDemo()` returns false without
reading storage and the demo implementation (a dynamically imported chunk) is never fetched, so
production behaviour is unchanged. A persistent badge in the app chrome states on every screen
that the data lives only in this browser; demo content never reaches the marketing site.

## 9. Routes

Landing (Astro, static, RU default / EN under `/en/`):

```
/                          home
/courses/                  courses hub
/courses/<slug>/           course page + order form (5 pages per locale)
/exercises/                exercise library hub (programmatic; filmed movements only)
/exercises/<slug>/         exercise page: clip, how-to, cues, mistakes, scaling, related
/guides/                   guides hub (clusters)
/guides/<slug>/            SEO article (content collection)
/subscribe/               every course by subscription (monthly / annual), plan choice + order form
/about/  /privacy/  /terms/  /refund/  /contact/
/app/                      React app (noindex; also the Telegram Mini App surface)
/sitemap.xml  /robots.txt  /llms.txt  /rss.xml  /<indexnow-key>.txt  /manifest.webmanifest  /404
```

App (HashRouter under `/app/#/`). **Three tabs — «Курсы», «Клуб», «Тренер» — and «Админка» as a
fourth seat for whoever has the panel.** The words changed and the paths did not, so nothing that
was ever linked or bookmarked broke:

```
/auth  /onboarding
/                          «Курсы» — the main screen: progress across every course there is
/courses                   → redirect to `/` (the path this screen had while it was the second tab)
/courses/:id               the course's path
/courses/:id/nodes/:nodeId preview + difficulty
/play                      active session          /summary/:sessionId
/achievements              the catalogue of achievements, from the 🏅 in the header of «Курсы»
/assessment                the physical test, asked for after a couple of workouts
/marathon  /marathon/board «Клуб»
/book                      «Тренер» — one-to-one session with the coach
/leaderboard  /steps
/assigned/:id  /shared/:token
/admin  /admin/workouts  /admin/exercises  /admin/courses[/:id]  /admin/marathons[/:id]
```

Gone with the four-tab shell: `/` as «Сегодня», `/stats` («Прогресс»), `/profile` (a sheet behind
the avatar now) and `/marathon/points` («Мои баллы»).

Products: a **course** is bought once and kept forever (`purchases`); a **subscription**
(`subscriptions`, monthly or annual) lists every course through `my_entitlements` while its paid
period runs, and is activated by the coach or by the Prodamus webhook; an **hour with the coach**
(`content/site/booking.ts`) is the only product that uses his time. `/book` is drawn as the price:
the coach's photograph and his name, one line about what the session is, the format as a pill, and
then the lengths as a switch — the two durations on one line — over a single block: the chosen
length's name, its price as one display-size figure, what it includes, and one button. The two used
to be stacked as two blocks; on a phone the second started below the fold, so the comparison the
stacking was for never happened, and «переключение по продолжительности сессии» is both the
comparison and one screen's worth of screen. No labelled rows and no numbered «how it works» list:
the buttons are the steps.

The same `/app/` build runs inside Telegram as a Mini App (`src/lib/telegram/webapp.ts`): the SDK
is loaded only when Telegram opened the page, Telegram's back button follows the route, and links
that leave the app open outside it. Everything Telegram-specific is a no-op on the open web.

## 10. App flows (must match exactly)

1. **Auth**: the coach's black-and-white montage full-bleed and looping
   (`content/site/media.ts`; the coach's photograph stands in until it is cut), the wordmark fading
   up and away over it, and then the form: email field → "Send code" → 6-digit code field
   (paste-friendly, resend timer 60s) → session. No heading, no lead, no field label, no spam hint —
   the errors, the resend and the way back to the address are all that stand with the two fields.
   `prefers-reduced-motion` and any tap skip the title card. Errors localized.
2. **Onboarding** (first login, resumable): name → basics (age band, sex optional,
   weight optional) → activity level → experience → equipment (+ dumbbell/kettlebell weights) →
   limitations → **the assessment** → time per session → goal → result screen (fitness index,
   level) → home.
   **Each step is one question and its answers, and nothing else** (design/CHANGELOG.md §10): the
   question in the display face — «ЧТО есть дома?», «СКОЛЬКО минут на тренировку?» — and under it
   plates (`OptionTile`), pills or big numerals. No lead under the question, no kicker over a group
   whose plates already say what they are, no description under an answer; where an answer needed
   its description («Новичок · меньше года») the description became the answer («Меньше года»).
   Minutes are five plates of one numeral each. A picked plate inverts and a check lands on it on
   the spring (`.pop-in`). The header is one row: back, the progress rule, «01/10». The result is
   the index as one huge numeral — «54» at 800, «из 100» at 200 — with the level as a pill under it
   and «Начать тренироваться» in the footer; the ring, the paragraph on what the level means and
   the list of components are gone.
   The assessment is one question — «Подстроить тренировки под тебя?», with what it costs as two
   pills under it («5 упражнений», «3 мин») — and two answers. «Сейчас» first shows the one
   instruction everything here depends on, in the owner's own words and nothing more («Максимум не
   выжимаем» over a still of the first movement), and then asks about five movements
   (`content/site/assessment.ts`) as a full-screen surface over the wizard drawn like the player:
   the clip full-bleed, the movement's name in the display face on a pane of glass at the foot, one
   short line and one field. **Nothing is timed and nothing is performed on the screen** — «убери
   таймер в онбординге совсем… просто чтобы они лайтово прошли и поделились примерно сколько раз
   они могут сделать не умирая». The clock, the draining ring, the horn, the wake lock and the
   «Начать»/«Стоп» phases are gone; the athlete watches the clip and says roughly how many they
   could do without going to failure. «Не сейчас» postpones the whole thing; it comes back as a
   task on the home screen, and the fitness index imputes what it is missing
   (docs/TRAINING_SCIENCE §2). Three of the five numbers feed the index, the other two are written
   to `benchmarks`.

   What that does to the index is written down in `content/site/assessment.ts` rather than left to
   be found: two of the three components get closer to what their tables expect (`pushups` is
   defined as max consecutive and the minute was a proxy; `PLANK_ANCHORS` run to 180 s and the
   minute capped every answer at 60), and `squats60s` loosens — its anchors were built for reps in
   sixty seconds and now read a self-reported comfortable set. The field keeps its name because
   renaming it migrates stored profiles for no reader's benefit. Task #41, the coach's own ranges as
   data, is where the borrowed tables stop mattering.

3. **«Курсы»** (the first tab, and the screen the app opens on): «Курсы это прогресс по всем
   курсам которые есть». A progress screen that happens to list courses, not a catalogue. It
   replaced «Сегодня» and absorbed the «Программы» tab, which were two screens answering one
   question between them.

   At the top, small: the greeting, the avatar, and the **streak 🔥 and the achievements 🏅 as two
   entry points** («Профиль и все ачивки убирай. Они должны быть на главном экране в виде маленьких
   энтри поинтов»). They are controls the height of a chip, side by side — not tiles and not a
   section. The avatar opens the **account sheet** (flow 11), the streak opens its calendar as a
   sheet, and the achievements open their **catalogue** (flow 8).

   Then the courses, one card each, in the shape the owner drew: the **photograph**, the **share
   completed as one large figure** over its **progress bar**, and **one button**. The figure is the
   prototype's `.display` device — the number larger than the word — because on a progress screen
   the number is the content. A course the athlete does not own shows **«Подробнее»** and leaves
   for that course's page on the site; it used to say «Прийти» or «Курс закрыт», neither of which
   says what happens next. The button is only ever offered where there is a page behind it
   (`LIVE_COURSES`), and a course that is neither owned nor on sale is not listed at all.

   **One workout button.** «Не может быть такого состояния что и продолжить тренировку и начать
   курс. На главном экране всегда должна быть только одна кнопка тренировки.» When a session is
   open, `resumeCard()` (`features/home/resumeModel.ts`) says so, the course it belongs to carries
   the resume button, and every other course offers its path instead of a start. One module decides
   it; the screen never re-derives it.

   The club is not on this screen at all any more — it is its own tab.

   **The name.** The format is the «Клуб маленьких шагов» — «Клуб» where a label has one slot (the
   tab, the top row, the deck card), the full name where there is room (the screen's own head, the
   invitation, the locked and trial copy). It was the «Челлендж» until the owner renamed it: a
   challenge promises a test, and the people this is for are coming back after a break, for whom a
   test is a reason not to start; a club promises belonging, which is what the format actually
   gives — a partner, a board with names, a day everybody is having at once. The prize is still
   real and still an hour with the coach, but it is the last clause of the invitation rather than
   its point, because a club whose first sentence is about winning is a competition in a club's
   name. Code and database keep `marathon*` throughout: renaming them buys the reader nothing and
   costs a migration. `src/i18n/*/app.ts` is the one place that reconciles the two.

4. **Course path**: the days as a winding column of circles — four columns, wave order, the day's
   name and one short line set in the space each stop leaves beside it, its stars under the name —
   grouped under a band per week in the programme colour («НЕДЕЛЯ 1 · 3/7»). A finished day is
   filled in that colour and ticked, today is filled in paper and lands on the spring, an open day
   is outlined, a locked one is dimmed; rest and milestone days open a sheet. The head is the
   course's name on a band of its colour, then a ring with the share inside and one display line
   beside it — «ДЕНЬ 4 из 28», 800 + 200 — then three figures on one ruled line: days done, minutes
   trained, the load multiplier (a button, opening the sheet that explains it). The leaderboard is
   a kicker opposite the way back.
5. **Node preview**: the picture (a still from the movement's clip, else the drawn figure), the
   workout's name, the programme and day, and three pills — how long, how much work, what it
   costs. Everything else — focus,
   description, the movement grid, the plan block by block — is folded behind "What's inside".
   Pressing Start opens the difficulty sheet: Easier / As usual / Harder, each led by its estimated
   **minutes** as a large numeral, over a bar of the work it prescribes, with the reps and kcal
   under it. The recommended one is a filled row (paper on ink) rather than a badged one, and the
   reason is stated under all three. Picking one starts the session immediately — there is no second
   preview and no confirm button. **No points anywhere in training**: points are the club's
   currency (§10 flow 12), and a workout is time you spend, not a score you earn.
6. **Player**: one card the size of the screen, with two sides. Front: the clip (or the drawn
   figure), auto-playing, **as wide as the screen** — `w-full h-auto` on a phone, with the stage
   cropping whatever the frame's own height runs past, so no shape of clip can put a bar down the
   side; contained and letterboxed from `md`, where filling the width would crop half a movement
   away. This is geometry, not a measurement of the clip: it used to read `videoWidth`/`videoHeight`
   and choose, and the choice could fail to arrive, which is exactly how black bars reached the
   owner's phone. With a back arrow and pause at the top and, at the bottom, the movement's
   name and its one number — a countdown for timed work, an adjustable rep count with "Done" for
   reps. Nothing else: no elapsed clock, no sound control, no step counter, no next-up line. Back:
   the coach's words as tabs (technique + breathing, cues + mistakes, contraindications + muscles),
   reached by swiping right to left or the "How to do it" handle — never by scrolling over the
   clip — and put away by swiping left to right. Vertical on the front walks the workout: up is the
   next movement, down the one before, both meaning exactly what the → and ← keys mean. The axes
   are that way round because the owner asked for a feed of short video: the thumb walks the
   column of clips, and the words arrive from the side. A session
   that opens with a warm-up starts inside it, with no gate and no intro. **Tapping the picture
   pauses** — the picture only, never the panel, and a press that travels or is held is left to
   the swipe handlers. «Пропустить разминку» is offered twice: as a chip on the panel that fades
   out after about six seconds, and, for the whole warm-up, behind Pause, where skipping or
   restarting a step, stepping back and ending the session also live. Timed work carries a line
   under the countdown showing how far through the movement it is, with the elapsed and the whole
   under it — white, because the clock is not one of the places colour may land.
   Leaving asks for confirmation; an unfinished session persists locally and resumes **where it
   stopped** — same step, same countdown. The step's clock is derived from the session clock
   (`stepStartedMs` in the store), so pausing, walking out and closing the app all freeze it the
   same way, and Home offers a **Продолжить** strip naming the movement it will pick up on.
7. **Summary + feedback**: «Готово!» at the size of the screen, under a kicker naming the day and
   the programme; **one warm line computed from the real streak** and never invented — «Четвёртый
   день подряд. Так и растёт форма.», the ordinal in words to the tenth day and «11-й день» after
   it, and no line at all when there is no streak to report or the session is being re-read from
   the server; the stars; then three numerals on a rule — minutes, repetitions, kcal, with how much
   of the plan was done standing in for repetitions on a day that counts none. «Как зашло?» under
   it: RPE as **one row of ten circles** filled up to the choice, with the Borg descriptor under
   them, feeling chips (great / ok / hard / pain) and a note. «Save» → the achievements just
   unlocked, the adaptation message («next time +5%»), «К пути →» and «Поделиться». The whole
   session block by block, the test results and the benchmark are behind «Подробности».
8. **«Достижения»** (`/achievements`, from the 🏅 in the header of «Курсы»): every achievement the
   product has, **including the ones not yet earned, each with the rule that earns it**. That rule
   is the reason the screen exists — «Достижения открывают каталог достижений» — and a grid of grey
   circles with no rule attached is what it replaces. One row each: the figure on the left (white
   with a ✓ when it is taken, a hairline ring filling with its progress when it is not, the same
   figure «Готово!» draws the moment one is earned), the name, and the rule under it. The count
   sits in the header, because it is the one number the catalogue is about.

   This is what is left of **«Прогресс»**, which was the fourth tab and is gone with it. The streak
   went to the header of «Курсы» and its calendar to the sheet behind it; the achievements became
   this screen; the week's table is the club's own (flow 6) and the full leaderboard is flow 9. The
   charts, the personal records and the level card had no reader: «МИНИМУМ текста, максимум
   визуала» does not survive six figures stacked behind a «Подробности» nobody opened. The level
   is in the account sheet, where it is one line and a rule for reaching the next one.

9. **Leaderboard**: tabs week / all-time, course filter, top-100 with own row pinned. A rank is a
   **circle**, drawn exactly as the club's `BoardRow` draws it — the leader filled, your own
   row a white ring, the podium a stronger hairline — but filled in white, never the club's
   orange: this table belongs to no programme. No avatar on the row (a rank is a circle and a
   person is a circle; two per row read as a pair of controls) and no «оч.» after the points.
10. **Steps**: one big numeral inside the goal ring — the number being typed is the figure — with
    the goal as a pill under it that turns white and carries the points the moment it is crossed,
    and the quick adds as chips. The last fourteen days are **two rows of seven circles**, a ✓ where
    the goal was reached and the weekday's letter where it was not, the day of the month under each;
    every circle opens the edit sheet. Goal 7000. A day may also
    carry a screenshot of the athlete's own step counter — attached the moment it is picked, held
    in the private `proofs` bucket, visible to the athlete and the coach and nobody else. It is
    evidence, not arithmetic: points still come from the number.
11. **The account** — a **sheet**, opened by the avatar in the header of «Курсы» and by the same
    avatar in the top row from `md`. Not a screen and not a tab: «Профиль и все ачивки убирай».
    Five things and no navigation — the avatar, the name with the address the sign-out will leave,
    the level, **one line saying how to reach the next one**, and «Выйти» behind a confirmation.
    The 417-line profile screen it replaces was a settings page nobody opened twice.

    What that screen also carried and this does not: the inventory and the limitations sheets, the
    subscription row, «Пройти тесты заново», the link to the coach's hour and the link to the
    admin. The last two are tabs now. **The first three have no home in the app at present and the
    owner has to say where they should go** — the likeliest answer is the assessment flow, which is
    being rebuilt to run after the second workout rather than during onboarding.

12. **Admin**: three tabs. **Покупки** — the ledger (search by email, filter status), activate /
    refund, add by hand. **Подписки** — the same for plans. **Люди** — everybody who has confirmed a
    sign-in code (`admin_people()`, admin-only), newest first, with what they already hold and one
    button each to give a course or a subscription. That tab exists so a grant is a choice rather
    than an address typed from memory: `admin_add_purchase` accepts any well-formed address on
    purpose — a pre-sale grant to somebody who has not signed up yet is a real case — so a typo
    cannot be caught there and is designed out here instead. The manual path stays on the other two
    tabs, where it is the only way in.

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
- **Only filmed movements get a page.** The library was written ahead of the camera — 90 movements
  described, 26 shot — and an exercise page with no clip on it is a page failing at its only job,
  ninety times over. `FILMED_EXERCISES` (`src/content/registry.ts`) is the boundary and it works
  exactly like `LIVE_COURSES`: the entries stay in `content/`, and adding `video` to one is the whole
  of putting its page back. The hub, the pages, the sitemap, the «Проще»/«Сложнее» links, the related
  lists and the guides' `exercise:` links all read it. A guide that names an unfilmed movement keeps
  its sentence and loses the link, and `seo:audit` prints one note per such reference — that list is
  the filming queue. Nothing on sale is affected: «Форма с нуля» prescribes 26 movements and every
  one is filmed (guarded by `src/content/filmed.test.ts`); the courses that use the rest are all
  `published: false`.
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
